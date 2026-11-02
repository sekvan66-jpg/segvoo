"""
Launch-Film: Soundtrack im Code – elektronisch, 120 BPM, A-Dur, genau 30 Takte (60 s), endet auf einem vollen Takt.
Whoosh an jedem Szenenübergang, Schlag auf dem Endtitel (56 s), unter dem Sprecher automatisch leiser.

Aufbau (Takte à 2 s):  1–3 Chaos (gefiltert, flatternde Plucks, Akzente auf Zettel/Excel/Ordner/Chaos?)
                       4–16 Groove (Drop bei 6 s, Klick bei 22 s)   17–20 Offline-Breakdown (dumpf, Anlauf)
                       21–27 Drop (Schild/Tresor, Preiskarten mit Akzenten)   28–30 Anlauf, Schlag 56 s, Schlussakkord

Aufruf:  .venv/bin/python tools/launch_music.py   →  public/musik-launch.mp3
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from scipy.signal import fftconvolve

sys.path.insert(0, str(Path(__file__).resolve().parent))
from musik import (  # noqa: E402
    SR, Track, boom, bp, clap, crash, gate, hat, kick, lp, pad, pluck, rev_cymbal, reverb_ir, riser, rng, sbass, secs, snare, supersaw,
)

ROOT = Path(__file__).resolve().parent.parent
DUR = 60.0
BEAT = 0.5
STEP = BEAT / 4
BAR = 4 * BEAT
CUTS = [6.0, 12.0, 22.0, 32.0, 40.0, 48.0, 54.0]  # Szenenübergänge (müssen zu src/launch/Launch.tsx passen)
T_END = 56.0  # Endtitel

PROG = [  # A – E – F#m – D
    ([220.0, 277.2, 329.6], 55.0),
    ([207.7, 246.9, 329.6], 41.2),
    ([185.0, 220.0, 277.2], 46.25),
    ([220.0, 293.7, 370.0], 73.4),
]


def whoosh(length=0.7):
    """Luftzug: Rauschen durch ein Bandpass, das hoch- und wieder runterläuft (Spitze bei 70 %)."""
    t = secs(length)
    n = rng.standard_normal(len(t))
    out = np.zeros(len(t))
    steps = 28
    for k in range(steps):
        a, b = k * len(t) // steps, (k + 1) * len(t) // steps
        x = k / steps
        fc = 400 * (9000 / 400) ** (np.sin(np.pi * min(1, x / 0.85)) ** 0.7)
        out[a:b] = bp(n, fc * 0.6, min(fc * 1.5, 19000))[a:b]
    env = np.where(t < length * 0.7, (t / (length * 0.7)) ** 2, np.exp(-(t - length * 0.7) / 0.08))
    left, right = out * env, np.roll(out, 90) * env
    return np.stack([left, right], axis=1) * 0.9


def blip(f, length=0.09):
    t = secs(length)
    return np.sin(2 * np.pi * f * t) * np.exp(-t / 0.03) * 0.5


def click():
    t = secs(0.05)
    return bp(rng.standard_normal(len(t)), 2000, 9000) * np.exp(-t / 0.006) * 0.8 + np.sin(2 * np.pi * 1800 * t) * np.exp(-t / 0.01) * 0.3


def down_glide(length=0.5):
    """„Verbindung weg“: Ton gleitet nach unten."""
    t = secs(length)
    f = 900 * (0.25 ** (t / length))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.25) * 0.45


def thump():
    t = secs(0.6)
    f = 60 + 40 * np.exp(-t / 0.05)
    return np.tanh(2 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.18)) * 0.8


def groove(bed, send, sc, t0, t1, energy=1.0, bright=1.0, hook=True):
    """Vier-Viertel-Groove von t0 bis t1 (auf dem Takt-Raster)."""
    t = t0
    while t < t1 - 0.01:
        b = int(round(t / BAR))
        chord, root = PROG[b % 4]
        for s in range(16):
            ts = t + s * STEP
            if ts >= t1 - 0.01:
                break
            if s % 4 == 0:
                bed.add(kick(), ts, 0.85 * energy)
                sc.add(np.ones(1), ts, 1.0)
            if s in (4, 12):
                bed.add(clap(), ts, 0.42 * energy)
                bed.add(snare(), ts, 0.25 * energy)
                send.add(clap(), ts, 0.15)
            bed.add(hat(), ts, (0.15 if s % 2 else 0.07) * energy)
            if s % 4 == 2:
                bed.add(hat(True), ts, 0.2 * energy)
            if s % 2 == 0:  # Bass auf Achteln, Oktave auf der „und“
                bed.add(sbass(root * (2 if s % 4 == 2 else 1), STEP * 1.7, cutoff=900 + 600 * bright), ts, 0.55 * energy)
            if s in (2, 6, 10, 14):  # Akkord-Stöße
                st = supersaw(chord, STEP * 1.3, cutoff=2600 + 3200 * bright, decay=0.08)
                bed.add(st, ts, 0.22 * energy)
                send.add(st, ts, 0.1)
            if hook and s % 2 == 0:  # Hookline
                motif = [0, 2, 1, 2, 0, 1, 2, 1]
                pl = pluck(chord[motif[(s // 2) % 8]] * 2, 0.3, bright=0.7 + 0.3 * bright)
                bed.add(pl, ts, 0.12 * energy, -0.3 if (s // 2) % 2 else 0.3)
                send.add(pl, ts, 0.08)
        t += BAR


def voice_duck(n, depth_db):
    p = ROOT / "public" / "launch" / "voice-placed.json"
    g = np.ones(n)
    if not p.exists():
        return g
    words = json.loads(p.read_text(encoding="utf-8"))
    lo = 10 ** (depth_db / 20)
    att, rel = int(0.05 * SR), int(0.25 * SR)
    for w in words:
        a, b = int((w["start"] - 0.05) * SR), int((w["end"] + 0.1) * SR)
        g[max(0, a) : min(n, b)] = lo
    # weiche Kanten
    k = np.ones(att) / att
    g = np.convolve(g, k, mode="same")
    k2 = np.ones(rel) / rel
    return np.minimum(1, np.convolve(g, k2, mode="same") * 0.5 + g * 0.5)


def main():
    bed, acc, send, sc = Track(DUR), Track(DUR), Track(DUR), Track(DUR)

    # ---------- Takte 1–3: Chaos ----------
    t = 0.0
    k = 0
    while t < 6.0 - 0.01:
        chord = PROG[(k // 16) % 4][0]
        f = chord[int(rng.integers(0, 3))] * (2 if rng.random() > 0.4 else 4)
        bed.add(pluck(f, 0.22, bright=0.6), t + rng.uniform(-0.01, 0.01), 0.1, float(rng.uniform(-0.7, 0.7)))
        if k % 2 == 0:
            bed.add(hat(), t, 0.1)
        if k % 8 == 0:
            bed.add(kick() * 0.7, t, 0.5)
            sc.add(np.ones(1), t, 1.0)
        if k % 4 == 2:
            bed.add(sbass(55.0, STEP * 1.6, cutoff=300), t, 0.5)
        t += STEP
        k += 1
    for i, tw in enumerate([0.5, 1.5, 2.5, 3.5]):  # Akzente auf den vier Wörtern
        acc.add(supersaw(PROG[i % 4][0], 0.3, cutoff=4200, decay=0.12), tw, 0.32)
        acc.add(clap(), tw, 0.25)
    bed.add(riser(2.0), 4.0, 0.4)
    t = 5.0
    while t < 6.0 - 0.01:  # Wirbel
        g = (t - 5.0)
        acc.add(snare(), t, 0.1 + 0.4 * g * g)
        t += STEP

    # ---------- Takte 4–16: Groove (Drop bei 6 s) ----------
    groove(bed, send, sc, 6.0, 32.0, energy=1.0, bright=0.7)
    for i, tr in enumerate([12.5, 13.0, 13.5, 14.0, 14.5, 15.0]):  # Zeilen der Fahrzeugliste
        acc.add(blip(880 * (1 + i * 0.12)), tr, 0.25)
    acc.add(click(), 22.0, 0.7)  # Klick → Kaufvertrag
    for tb in (27.0, 27.5, 28.0):  # Stempel E-Rechnung / ZUGFeRD / XRechnung
        acc.add(thump(), tb, 0.35)

    # ---------- Takte 17–20: offline – dumpf, ohne Drums, Anlauf ----------
    off = pad([220.0, 277.2, 329.6, 440.0], 8.2, cutoff=700)
    bed.add(off, 32.0, 0.55)
    send.add(off, 32.0, 0.3)
    t = 32.0
    while t < 38.0 - 0.01:  # leiser Puls
        bed.add(sbass(55.0, BEAT * 0.8, cutoff=260), t, 0.45)
        t += BEAT
    acc.add(down_glide(), 34.0, 0.5)  # WLAN durchgestrichen
    bed.add(riser(2.0), 38.0, 0.45)
    t = 39.0
    while t < 40.0 - 0.01:
        acc.add(snare(), t, 0.12 + 0.45 * (t - 39.0) ** 2)
        t += STEP

    # ---------- Takte 21–27: Drop (Schild + Tresor, Preiskarten) ----------
    groove(bed, send, sc, 40.0, 54.0, energy=1.05, bright=1.0)
    acc.add(boom(), 40.0, 0.55)
    acc.add(thump(), 44.0, 0.35)  # Tresor dreht
    for tp in (48.0, 48.5, 49.0):  # drei Preiskarten
        acc.add(supersaw(PROG[0][0], 0.35, cutoff=5200, decay=0.14), tp, 0.3)

    # ---------- Takte 28–30: Anlauf, Schlag auf dem Endtitel, Schlussakkord ----------
    groove(bed, send, sc, 54.0, 55.0, energy=0.7, bright=0.8, hook=False)
    bed.add(riser(1.0), 55.0, 0.5)
    t = 55.0
    while t < 56.0 - 0.01:
        acc.add(snare(), t, 0.15 + 0.5 * (t - 55.0) ** 2)
        t += STEP
    acc.add(kick(big=True), T_END, 1.0)
    acc.add(boom(), T_END, 0.8)
    acc.add(crash(3.5), T_END, 0.55)
    send.add(crash(3.5), T_END, 0.35)
    fin = supersaw([110.0, 220.0, 277.2, 329.6, 440.0, 554.4], 4.0, cutoff=5000, attack=0.01, decay=2.2, sustain=0.3, release=0.9)
    acc.add(fin, T_END, 0.5)
    send.add(fin, T_END, 0.4)
    for i, f in enumerate([880.0, 1108.7, 1318.5, 1760.0]):
        acc.add(pluck(f, 1.6, 1.0), T_END + 0.5 + i * BEAT * 0.5, 0.16, [-0.4, 0.4, -0.2, 0.2][i])
    fb = sbass(55.0, 3.5, cutoff=500)
    acc.add(fb * np.linspace(1, 0, len(fb)) ** 1.5, T_END, 0.6)

    # Whoosh an jedem Übergang (Spitze genau auf dem Schnitt)
    for c in CUTS:
        acc.add(whoosh(0.7), c - 0.49, 0.32)
    acc.add(whoosh(0.9), T_END - 0.63, 0.35)

    # ---------- Mischen ----------
    n = len(bed.x)
    duck = np.ones(n)
    relN = int(0.2 * SR)
    curve = 1 - 0.45 * np.exp(-np.arange(relN) / (0.05 * SR))
    for h in np.nonzero(sc.x[:, 0])[0]:
        e = min(n, h + relN)
        duck[h:e] = np.minimum(duck[h:e], curve[: e - h])
    bed.x *= duck[:, None]
    bed.x *= gate(n, [(5.97, 6.0), (31.97, 32.0)])[:, None]  # kurze Luft vor den Drops
    ir = reverb_ir()
    wet = np.stack([fftconvolve(send.x[:, c], ir[:, c])[:n] for c in range(2)], axis=1)
    bed.x *= voice_duck(n, -7.0)[:, None]
    acc.x *= voice_duck(n, -2.5)[:, None]
    mix = bed.x * 0.85 + acc.x + wet * 0.3
    mix = mix[: int(DUR * SR)]
    mix = np.tanh(1.1 * mix)
    fade = int(0.6 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.3
    mix = mix / np.abs(mix).max() * 0.89

    import soundfile as sf

    wav = ROOT / "out" / "musik-launch.wav"
    wav.parent.mkdir(exist_ok=True)
    sf.write(wav, mix.astype(np.float32), SR)
    out = ROOT / "public" / "musik-launch.mp3"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", "256k", str(out)], check=True)
    print(f"Fertig: public/musik-launch.mp3 ({DUR:.0f} s = 30 Takte, 120 BPM)")


if __name__ == "__main__":
    main()
