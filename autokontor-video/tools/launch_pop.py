"""
Launch-Film: Popsong statt Elektro-Bett – 120 BPM, A-Dur, genau 30 Takte (60 s), endet auf einem vollen Takt.
Echte Instrumentenklänge aus dem MuseScore-Soundfont (Klavier, Bass, Gitarre, Streicher, Chor-„Oohs“, Glockenspiel,
Schlagzeug), dazu Pop-Produktion im Code: druckvolle Kick, Clap, Supersaw-Stöße, Pumpen auf der Kick, Hall,
Whoosh auf jedem Szenenübergang und ein großer Schlag auf dem Endtitel (56 s). Unter dem Sprecher automatisch leiser.

Aufbau (Takte à 2 s, Akkorde I–V–vi–IV = A–E–F#m–D):
  1–3   Intro „Chaos“: Klavier-Stöße antworten auf Zettel/Excel/Ordner/Chaos?, Anlauf auf E
  4–7   Strophe (App-Fenster)           8–11  Pre-Chorus (Liste + Kundenkarte), Chor-Oohs steigen, Wirbel
  12–16 Refrain 1 mit Hook (Kaufvertrag/Rechnung)
  17–20 Breakdown „offline“: nur Klavier-Arpeggio, Streicher, Oohs, Anlauf
  21–28 Refrain 2 (Schild, Preiskarten), Hook löst sich genau auf dem Endtitel auf
  29–30 Schlussakkord

Einmalig:  sudo apt-get install fluidsynth musescore-general-soundfont-lossless   ·   pip install mido
Aufruf:    .venv/bin/python tools/launch_pop.py   →  public/musik-launch.mp3
"""
import json
import subprocess
import sys
from pathlib import Path

import mido
import numpy as np
import soundfile as sf
from scipy.signal import fftconvolve

sys.path.insert(0, str(Path(__file__).resolve().parent))
from launch_music import CUTS, DUR, T_END, click, down_glide, thump, voice_duck, whoosh  # noqa: E402
from musik import SR, Track, boom, clap, crash, hp, kick, lp, pluck, reverb_ir, riser, rng, supersaw  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SF2 = next(p for p in [Path("/usr/share/sounds/sf2/MuseScore_General_Full.sf2"), Path("/usr/share/sounds/sf2/FluidR3_GM.sf2")] if p.exists())
TMP = ROOT / "out" / "pop"
N = int((DUR + 3) * SR)

# Akkord → (Bass-Grundton, Akkord-Lage um A3–F#4)  – MIDI-Notennummern
CH = {"A": (45, [57, 61, 64]), "E": (40, [56, 59, 64]), "F#m": (42, [57, 61, 66]), "D": (38, [57, 62, 66])}
# ein Eintrag pro Takt; ein Paar = halber Takt je Akkord
BARS = ["F#m", "D", "E", "A", "E", "F#m", "D", "A", "E", "F#m", ("D", "E"), "A", "E", "F#m", "D", "A",
        "F#m", "D", "A", "E", "A", "E", "F#m", "D", "A", "E", "F#m", ("D", "E"), "A", "A"]  # fmt: skip
assert len(BARS) == 30

# Hook (Refrain), 4 Takte über A–E–F#m–D: (Beat, Dauer in Beats, Note)
HOOK = [(0, 0.5, 73), (0.5, 0.5, 76), (1, 0.75, 76), (2, 0.5, 78), (2.5, 0.5, 76), (3, 1, 73),
        (4, 0.5, 71), (4.5, 0.5, 73), (5, 0.5, 71), (5.5, 1, 68), (7, 0.5, 69), (7.5, 0.5, 71),
        (8, 0.5, 73), (8.5, 0.5, 76), (9, 0.75, 76), (10, 0.5, 78), (10.5, 0.5, 81), (11, 1, 78),
        (12, 0.5, 76), (12.5, 0.5, 74), (13, 0.5, 73), (13.5, 0.5, 71), (14, 1.5, 69)]  # fmt: skip
# Schluss-Variante: über D|E zur Auflösung auf A genau auf dem Endtitel
HOOK_END = HOOK[:18] + [(12, 0.5, 78), (12.5, 0.5, 76), (13, 0.5, 74), (13.5, 0.5, 73), (14, 1, 71), (15, 0.5, 68), (15.5, 0.5, 71)]


def chord_at(beat):
    c = BARS[min(29, int(beat // 4))]
    return c[int((beat % 4) // 2)] if isinstance(c, tuple) else c


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


class Part:
    """Eine Instrumentenspur für den Soundfont (Zeiten in Beats, 120 BPM → 1 Beat = 0,5 s)."""

    def __init__(self, program, pan=64, drums=False):
        self.program, self.pan, self.drums, self.notes = program, pan, drums, []

    def note(self, beat, dur, pitch, vel, human=0.008):
        b = beat + (rng.uniform(-human, human) * 2 if human and beat > 0 else 0)  # leicht menschlich
        v = int(np.clip(vel + rng.integers(-6, 7), 1, 127))
        self.notes.append((max(0.0, b), dur, int(pitch), v))

    def chord(self, beat, dur, pitches, vel, strum=0.0):
        for i, p in enumerate(pitches):
            self.note(beat + i * strum, dur, p, vel)

    def render(self, name):
        tpb = 480
        mid = mido.MidiFile(ticks_per_beat=tpb)
        tr = mido.MidiTrack()
        mid.tracks.append(tr)
        ch = 9 if self.drums else 0
        tr.append(mido.MetaMessage("set_tempo", tempo=500000, time=0))
        tr.append(mido.Message("program_change", program=self.program, channel=ch, time=0))
        tr.append(mido.Message("control_change", control=10, value=self.pan, channel=ch, time=0))
        tr.append(mido.Message("control_change", control=7, value=110, channel=ch, time=0))
        ev = []
        for b, d, p, v in self.notes:
            ev.append((int(b * tpb), 1, p, v))
            ev.append((int((b + d) * tpb), 0, p, 0))
        ev.append((int((DUR + 2.5) * 2 * tpb), 0, 0, 0))  # Spurende nach 62,5 s
        ev.sort(key=lambda e: (e[0], e[1]))
        now = 0
        for t, on, p, v in ev:
            tr.append(mido.Message("note_on" if on else "note_off", note=p, velocity=v, channel=ch, time=t - now))
            now = t
        TMP.mkdir(parents=True, exist_ok=True)
        mf, wav = TMP / f"{name}.mid", TMP / f"{name}.wav"
        mid.save(mf)
        subprocess.run(["fluidsynth", "-ni", "-q", "-g", "0.6", "-R", "0", "-C", "0", "-r", str(SR), "-O", "float", "-F", str(wav), str(SF2), str(mf)], check=True)
        x, sr = sf.read(wav, dtype="float32", always_2d=True)
        assert sr == SR
        out = np.zeros((N, 2))
        out[: min(N, len(x))] = x[:N]
        return out


def compose():
    piano, bass, gtr, strings, oohs, glock, drums = (
        Part(0, 72), Part(33, 64), Part(28, 34), Part(48, 64), Part(53, 64), Part(9, 84), Part(0, 64, drums=True)
    )
    syn = {"kick": [], "stab": [], "hook": []}  # Klänge aus dem Code: (Zeit in s, Stärke, …)
    KICK, SNARE, CLAP, HHC, HHO, CRASH, TAMB = 36, 38, 39, 42, 46, 49, 54

    def kick_at(beat, vel=1.0):
        syn["kick"].append((beat / 2, vel))
        drums.note(beat, 0.25, KICK, int(70 * vel), human=0)

    # ---------- Takte 1–3: Intro „Chaos“ ----------
    for b, c in [(2, "F#m"), (4, "F#m"), (6, "D"), (8, "E")]:  # Antwort direkt nach Zettel / Excel / Ordner / Chaos?
        root, tri = CH[c]
        piano.chord(b, 0.45, [root, root + 12] + [p + 12 for p in tri], 104)
        strings.chord(b, 0.4, [p + 12 for p in tri], 70)
        drums.note(b, 0.2, CLAP, 100, human=0)
        kick_at(b, 0.8)
    for s in range(32):  # nervöses Ticken unter dem Chaos
        drums.note(s * 0.25, 0.1, HHC, 35 + int(rng.integers(0, 35)))
    root, tri = CH["E"]
    for k in range(1, 8):  # Anlauf auf E (Takt 3)
        piano.chord(8 + k * 0.5, 0.4, [p + 12 for p in tri], 50 + k * 7)
        bass.note(8 + k * 0.5, 0.4, root, 60 + k * 6)
    for k in range(8):
        drums.note(10 + k * 0.25, 0.2, SNARE, 40 + k * 10, human=0)
    strings.chord(8, 3.9, [p + 12 for p in tri], 60)

    # ---------- Takte 4–11: Strophe + Pre-Chorus ----------
    for bar in range(3, 11):
        b0 = bar * 4
        pre = bar >= 7
        for half in range(2):
            c = chord_at(b0 + half * 2)
            root, tri = CH[c]
            for q in range(2):
                bt = b0 + half * 2 + q
                if pre:  # treibende Achtel
                    piano.chord(bt, 0.45, tri, 74)
                    piano.chord(bt + 0.5, 0.45, tri, 62)
                else:  # ruhige Viertel
                    piano.chord(bt, 0.9, tri, 66 if q == 0 else 56)
                bass.note(bt, 0.45, root, 92)
                bass.note(bt + 0.5, 0.45, root + (12 if pre else 0), 80)
            if not pre:
                piano.note(b0 + half * 2, 1.9, root, 60)
        # Schlagzeug
        for s in range(16):
            bt = b0 + s / 4
            if (s in (0, 8, 10) or (bar >= 9 and s % 4 == 0)) and not (bar == 10 and s >= 8):
                kick_at(bt, 0.95)
            if s in (4, 12) and not (bar == 10 and s == 12):
                drums.note(bt, 0.2, SNARE, 92)
                drums.note(bt, 0.2, CLAP, 82)
            if s % 2 == 0 or pre:
                drums.note(bt, 0.1, HHC, (70 if s % 4 == 2 else 50) if s % 2 == 0 else 34)
        if pre:  # gedämpfte Gitarre, 16tel-Pop-Muster
            for s in (0, 3, 6, 8, 10, 13, 14):
                c = chord_at(b0 + s / 4)
                gtr.chord(b0 + s / 4, 0.2, [CH[c][0] + 12, CH[c][0] + 19], 88 if s in (0, 8) else 70)
    # Chor-Oohs steigen im Pre-Chorus
    for bar, notes in [(7, [61, 64]), (8, [59, 64]), (9, [61, 66]), (10, [62, 69])]:
        oohs.chord(bar * 4, 3.9 if bar < 10 else 1.95, [n + 12 for n in notes], 62 + (bar - 7) * 8)
    oohs.chord(42, 1.95, [64 + 12, 68 + 12], 90)
    for k in range(8):  # Wirbel in den Refrain
        drums.note(42 + k * 0.25, 0.2, SNARE, 50 + k * 9, human=0)
    # Zeilen der Fahrzeugliste: kleine Glockenspiel-Tonleiter
    for tr_, m in zip([12.5, 13.0, 13.5, 14.0, 14.5, 15.0], [78, 81, 86, 85, 88, 93]):
        glock.note(tr_ * 2, 0.5, m, 80)

    # ---------- Refrains ----------
    def chorus(bar0, bars, hook, hook_vel=96):
        for bar in range(bar0, bar0 + bars):
            b0 = bar * 4
            for half in range(2):
                c = chord_at(b0 + half * 2)
                root, tri = CH[c]
                for e in range(4):
                    bt = b0 + half * 2 + e * 0.5
                    bass.note(bt, 0.45, root + (12 if e % 2 else 0), 98 if e % 2 == 0 else 86)
                    piano.chord(bt, 0.45, [p + 12 for p in tri], 78 if e % 2 else 66)
                strings.chord(b0 + half * 2, 1.95, [p + 12 for p in tri], 74)
                for s in (2, 6):
                    syn["stab"].append(((b0 + half * 2) / 2 + s * 0.125, [hz(p + 12) for p in tri]))
            for s in range(16):
                bt = b0 + s / 4
                if s % 4 == 0:
                    kick_at(bt, 1.0)
                if s in (4, 12):
                    drums.note(bt, 0.2, SNARE, 100)
                    drums.note(bt, 0.2, CLAP, 96)
                if s % 4 == 2:
                    drums.note(bt, 0.3, HHO, 72)
                else:
                    drums.note(bt, 0.1, HHC, 44 if s % 2 else 60)
                if s % 2 == 1:
                    drums.note(bt, 0.1, TAMB, 50)
            for s in (0, 3, 6, 8, 10, 13, 14):
                c = chord_at(b0 + s / 4)
                gtr.chord(b0 + s / 4, 0.2, [CH[c][0] + 12, CH[c][0] + 19], 92 if s in (0, 8) else 74)
        drums.note(bar0 * 4, 2, CRASH, 100, human=0)
        if hook:
            hb = bar0 * 4
            for b, d, m in hook:
                oohs.note(hb + b, d * 0.95, m, hook_vel - 10)
                glock.note(hb + b, d, m + 12, 58)
                syn["hook"].append(((hb + b) / 2, d / 2, hz(m)))

    chorus(11, 5, HOOK)  # Refrain 1: 22–32 s
    # Takt 16 (30–32 s): Antwort + Tom-Fill in den Breakdown
    for b, d, m in [(60, 0.5, 76), (60.5, 0.5, 73), (61, 1.5, 69)]:
        oohs.note(b, d, m, 80)
        syn["hook"].append((b / 2, d / 2, hz(m)))
    for k, tom in enumerate([50, 50, 48, 48, 47, 45, 43, 41]):
        drums.note(62 + k * 0.25, 0.2, tom, 70 + k * 5, human=0)

    # ---------- Takte 17–20: Breakdown „offline“ ----------
    for bar in range(16, 20):
        b0 = bar * 4
        root, tri = CH[BARS[bar]]
        arp = [root + 12, tri[0], tri[1], tri[2], tri[0] + 12, tri[2], tri[1], tri[0]]
        for k, p in enumerate(arp):
            piano.note(b0 + k * 0.5, 0.9, p, 64 + (8 if k == 0 else 0))
        piano.note(b0, 3.8, root, 58)
        strings.chord(b0, 3.9, tri, 58)
        oohs.chord(b0, 3.9, [tri[1] + 12, tri[2] + 12], 54)
        if bar >= 18:
            bass.note(b0, 3.8, root, 70)
            kick_at(b0, 0.55)
            kick_at(b0 + 2, 0.55)
    for k in range(16):  # Wirbel 38–40 s
        drums.note(76 + k * 0.25, 0.2, SNARE, 36 + k * 5, human=0)

    chorus(20, 4, HOOK)  # Refrain 2a: 40–48 s
    chorus(24, 3, HOOK_END)  # Refrain 2b: 48–54 s (Hook läuft bis 56 s weiter)
    # Takt 28 (54–56 s): halber Takt Groove, dann Anlauf
    for half, c in enumerate(("D", "E")):
        root, tri = CH[c]
        b0 = 108 + half * 2
        strings.chord(b0, 1.95, [p + 12 for p in tri], 80)
        piano.chord(b0, 1.9, [root, root + 12] + [p + 12 for p in tri], 84)
        bass.note(b0, 1.9, root, 96)
    kick_at(108, 1.0)
    kick_at(109, 1.0)
    for k in range(8):
        drums.note(110 + k * 0.25, 0.2, SNARE, 50 + k * 9, human=0)

    # ---------- Takte 29–30: Schlussakkord auf dem Endtitel ----------
    final = [33, 45, 52, 57, 61, 64, 69]
    piano.chord(112, 7.5, final, 112, strum=0.02)
    strings.chord(112, 7.6, [57, 61, 64, 69, 73], 92)
    oohs.chord(112, 6, [69, 73, 76], 84)
    bass.note(112, 7, 33, 110)
    glock.chord(112, 2, [81, 85, 88, 93], 70, strum=0.25)
    drums.note(112, 4, CRASH, 120, human=0)
    drums.note(112, 4, 57, 100, human=0)
    syn["hook"].append((56.0, 1.6, hz(69)))
    syn["kick"].append((56.0, 1.3))
    return {"piano": piano, "bass": bass, "gtr": gtr, "strings": strings, "oohs": oohs, "glock": glock, "drums": drums}, syn


def pump(n, kicks, depth=0.45, rel=0.22):
    """Pumpen: Lautstärke taucht auf jedem Kick kurz ab (Sidechain wie im Radio-Pop)."""
    g = np.ones(n)
    m = int(rel * SR)
    curve = 1 - depth * np.exp(-np.arange(m) / (0.06 * SR))
    for t, v in kicks:
        a = int(t * SR)
        e = min(n, a + m)
        g[a:e] = np.minimum(g[a:e], 1 - (1 - curve[: e - a]) * min(1.0, v))
    return g[:, None]


def compress(x, thresh_db=-14.0, ratio=2.5, att=0.01, rel=0.15):
    """Bus-Kompressor (RMS), damit der Mix zusammenklebt."""
    lvl = np.sqrt(np.convolve(x.mean(1) ** 2, np.ones(int(0.02 * SR)) / int(0.02 * SR), mode="same")) + 1e-9
    db = 20 * np.log10(lvl)
    gr = np.minimum(0, (thresh_db - db) * (1 - 1 / ratio))
    out = np.empty_like(gr)
    v, a, r = 0.0, np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    for i in range(0, len(gr), 32):
        tgt = gr[i]
        k = a if tgt < v else r
        v = tgt + (v - tgt) * k**32
        out[i : i + 32] = v
    return x * (10 ** (out / 20))[:, None]


def export(wav, out, lufs=-15.0):
    """Master-EQ (kein Rumpeln, weniger Mulm, mehr Glanz) + lineare Lautheit wie die alte Fassung (Stimme bleibt verständlich)."""
    eq = "highpass=f=28,equalizer=f=320:t=q:w=1.1:g=-3,equalizer=f=2800:t=q:w=1.2:g=1.5,treble=g=3:f=7000"
    ln = f"loudnorm=I={lufs}:TP=-1.5:LRA=11"
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(wav), "-af", f"{eq},{ln}:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
    m = json.loads(r.stderr[r.stderr.rindex("{") :])
    ln += f":measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}"
    ln += f":offset={m['target_offset']}:linear=true"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-af", f"{eq},{ln}", "-ar", str(SR), "-codec:a", "libmp3lame", "-b:a", "256k", str(out)], check=True)


def main():
    parts, syn = compose()
    stems = {k: p.render(k) for k, p in parts.items()}
    n = N

    # Code-Klänge: Kick, Supersaw-Stöße, Hook-Pluck, Effekte
    kick_t, stab_t, hook_t, fx, send = Track(DUR), Track(DUR), Track(DUR), Track(DUR), Track(DUR)
    for t, v in syn["kick"]:
        kick_t.add(kick(big=v > 1.1), t, 0.85 * min(v, 1.2))
    for t, freqs in syn["stab"]:
        st = supersaw(freqs, 0.16, cutoff=4200, decay=0.09)
        stab_t.add(st, t, 0.16)
        send.add(st, t, 0.05)
    for t, d, f in syn["hook"]:
        pl = pluck(f, max(0.35, d + 0.25), bright=0.85)
        hook_t.add(pl, t, 0.2, float(rng.uniform(-0.15, 0.15)))
        send.add(pl, t, 0.08)
    for c in CUTS:  # Whoosh an jedem Übergang
        fx.add(whoosh(0.7), c - 0.49, 0.26)
    fx.add(whoosh(0.9), T_END - 0.63, 0.3)
    fx.add(riser(2.0), 4.0, 0.25)
    fx.add(riser(2.0), 20.0, 0.22)
    fx.add(riser(2.0), 38.0, 0.3)
    fx.add(riser(1.0), 55.0, 0.32)
    fx.add(click(), 22.0, 0.5)  # Klick → Kaufvertrag
    for tb in (27.0, 27.5, 28.0):  # Stempel E-Rechnung / ZUGFeRD / XRechnung
        fx.add(thump(), tb, 0.22)
    fx.add(down_glide(), 34.0, 0.35)  # WLAN durchgestrichen
    fx.add(boom(), 40.0, 0.45)
    fx.add(thump(), 44.0, 0.22)  # Tresor dreht
    fx.add(boom(), T_END, 0.5)
    fx.add(crash(3.5), T_END, 0.35)
    send.add(crash(3.5), T_END, 0.25)

    # Klangformung der Soundfont-Spuren
    for k in ("piano", "gtr", "strings", "oohs", "glock"):
        stems[k] = np.stack([hp(stems[k][:, c], 110 if k == "piano" else 160) for c in range(2)], axis=1)
    stems["bass"] = np.stack([lp(stems["bass"][:, c], 2500) for c in range(2)], axis=1)
    kicks = syn["kick"]
    level = {"piano": 0.55, "bass": 0.75, "gtr": 0.3, "strings": 0.42, "oohs": 0.5, "glock": 0.16, "drums": 0.7}
    for k in stems:  # jede Spur auf gleiche Spitze bringen, dann Pegel
        stems[k] = stems[k] / max(1e-6, np.abs(stems[k]).max()) * level[k]
    p = pump(n, kicks, 0.4)
    stems["bass"] *= pump(n, kicks, 0.3, 0.16)
    for k in ("strings", "oohs", "piano"):
        stems[k] *= p
    stab_t.x *= p

    for k, s in (("piano", 0.18), ("strings", 0.3), ("oohs", 0.35), ("glock", 0.3), ("gtr", 0.08), ("drums", 0.06)):
        send.x += stems[k] * s
    ir = reverb_ir(2.0)
    wet = np.stack([fftconvolve(send.x[:, c], ir[:, c])[:n] for c in range(2)], axis=1) * 0.28

    bed = stems["piano"] + stems["bass"] + stems["gtr"] + stems["strings"] + stems["drums"] + kick_t.x + stab_t.x + wet
    hook = stems["oohs"] + stems["glock"] + hook_t.x
    bed = compress(bed, -16, 2.2)
    bed *= voice_duck(n, -8.5)[:, None]
    hook *= voice_duck(n, -10.0)[:, None]
    fx.x *= voice_duck(n, -3.0)[:, None]
    mix = bed + hook + fx.x
    mix *= np.where(np.arange(n) < int(DUR * SR), 1.0, 0.0)[:, None]
    # kurze Luft vor dem Refrain 2 und vor dem Endtitel
    for a, b in ((39.95, 40.0), (55.96, 56.0)):
        i, j = int(a * SR), int(b * SR)
        mix[i:j] *= 0.15
    mix = mix[: int(DUR * SR)]
    mix = compress(mix, -12, 2.0, 0.005, 0.12)
    mix = np.tanh(1.15 * mix / max(1e-6, np.abs(mix).max()) * 1.2) / np.tanh(1.38)
    fade = int(0.6 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.3
    mix = mix / np.abs(mix).max() * 0.89

    wav = ROOT / "out" / "musik-launch.wav"
    sf.write(wav, mix.astype(np.float32), SR)
    export(wav, ROOT / "public" / "musik-launch.mp3")
    print(f"Fertig: public/musik-launch.mp3 (Popsong, {DUR:.0f} s = 30 Takte, 120 BPM, Soundfont {SF2.name})")


if __name__ == "__main__":
    main()
