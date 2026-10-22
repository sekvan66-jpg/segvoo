"""
Komponiert Werbemusik passend zum Schnitt einer Fassung (alles per Code erzeugt → lizenzfrei).

Liest src/data/timeline-<fassung>.json und baut:
  • Chaos-Teil:  dunkle Spannung (Moll-Fläche, Puls, Ticken), Anstieg + Wirbel bis zum Wort „Schluss.“
  • „Schluss.“:  großer Schlag (Boom + Becken), kurz Luft holen
  • ab Logo:     Drop in fröhlichen Dur-Groove (C–G–Am–F): Kick, Clap, Hi-Hats, pumpender Bass,
                 Plucks mit Echo, breite Flächen, Hall
  • ab Preis:    Crash + mehr Energie (Melodie eine Oktave höher)
  • Endbild:     Crash + Schlussakkord, klingt aus
Ergebnis: public/musik-<fassung>.mp3   (im Skript-Kopf:  # musik: musik-<fassung>.mp3)

Stile:    --stil sanft      (Standard) ruhiges Musikbett: warme Flächen, Filz-Klavier, tiefer Bass, kaum Schlagzeug,
                            wird unter der Stimme automatisch leiser (Ducking), Akzente nur an Schlüsselstellen
          --stil kraftvoll  treibender Groove mit Kick, Clap, Plucks (lauter, für Glitch-Fassungen)
Aufruf:   .venv/bin/python tools/musik.py premium30   [--stil sanft] [--bpm 120]
Vorher muss die Timeline existieren (node tools/build-timeline.mjs premium30).
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = Path(__file__).resolve().parent.parent
SR = 44100
rng = np.random.default_rng(5)


def secs(n):
    return np.arange(int(n * SR)) / SR


def lp(x, f, order=2):
    return sosfilt(butter(order, min(f, SR / 2 - 100), btype="low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], btype="band", fs=SR, output="sos"), x)


def saw(f, t, phase=0.0):
    return 2 * ((f * t + phase) % 1) - 1


def adsr(n, a, d, s, r):
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = min(na, n)
    e[:na] = np.linspace(0, 1, na, endpoint=False)
    nd = min(nd, n - na)
    e[na : na + nd] = np.linspace(1, s, nd, endpoint=False)
    if nr > 0 and n > nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


class Track:
    """Stereo-Spur, in die Klänge an Zeitpunkte gelegt werden."""

    def __init__(self, dur):
        self.x = np.zeros((int((dur + 3) * SR), 2))

    def add(self, sig, at, gain=1.0, pan=0.0):
        if sig.ndim == 1:
            sig = np.stack([sig * np.sqrt(0.5 * (1 - pan)), sig * np.sqrt(0.5 * (1 + pan))], axis=1) * np.sqrt(2)
        s = int(at * SR)
        if s >= len(self.x) or s + len(sig) <= 0:
            return
        if s < 0:
            sig, s = sig[-s:], 0
        e = min(len(self.x), s + len(sig))
        self.x[s:e] += sig[: e - s] * gain


# ---------- Instrumente ----------
def kick(big=False):
    t = secs(0.45 if big else 0.32)
    f = 48 + 120 * np.exp(-t / 0.028)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.22 if big else 0.13))
    click = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.003) * 0.35
    return np.tanh(1.8 * (body + click))


def clap():
    t = secs(0.35)
    e = np.zeros(len(t))
    for k, off in enumerate([0, 0.009, 0.019, 0.03]):
        s = int(off * SR)
        e[s:] += np.exp(-(t[: len(t) - s]) / (0.005 if k < 3 else 0.11))
    return bp(rng.standard_normal(len(t)), 900, 5000) * e * 0.7


def hat(open_=False):
    t = secs(0.25 if open_ else 0.05)
    return hp(rng.standard_normal(len(t)), 8000) * np.exp(-t / (0.07 if open_ else 0.012)) * 0.3


def crash(length=2.4):
    t = secs(length)
    n = rng.standard_normal(len(t))
    x = hp(n, 4500) * 0.6 + bp(n, 2500, 7000) * 0.4
    return x * np.exp(-t / (length / 3.2)) * np.minimum(1, t / 0.002) * 0.55


def boom():
    t = secs(2.2)
    f = 34 + 60 * np.exp(-t / 0.08)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.7)
    return np.tanh(2.2 * x) * 0.9


def riser(length):
    t = secs(length)
    n = rng.standard_normal(len(t))
    out = np.zeros(len(t))
    steps = 24
    for k in range(steps):  # Rauschen durch ein langsam nach oben wanderndes Bandpass-Filter
        a, b = k * len(t) // steps, (k + 1) * len(t) // steps
        fc = 300 * (8000 / 300) ** (k / steps)
        out[a:b] = bp(n, fc * 0.7, min(fc * 1.4, 20000))[a:b]
    tone = np.sin(2 * np.pi * np.cumsum(180 * (6 ** (t / length))) / SR) * 0.25
    env = (t / length) ** 2.2
    return (out * 0.8 + tone) * env


def pluck(f, length=0.6, bright=1.0):
    t = secs(length)
    x = sum(np.sin(2 * np.pi * f * h * t) * np.exp(-t / (0.35 / (h**0.8))) / h**0.9 for h in range(1, 9))
    x = lp(x, 2500 + 5000 * bright) * np.minimum(1, t / 0.003)
    return x * 0.5


def pad(freqs, length, cutoff=1800):
    t = secs(length)
    left, right = np.zeros(len(t)), np.zeros(len(t))
    for f in freqs:
        for k, det in enumerate((-0.18, -0.07, 0.0, 0.07, 0.18)):
            v = saw(f * (1 + det / 100), t, phase=k * 0.21)
            if k % 2:
                left += v
            else:
                right += v
    env = adsr(len(t), 0.35, 0.4, 0.85, 0.5)
    left, right = lp(left, cutoff) * env, lp(right, cutoff) * env
    return np.stack([left, right], axis=1) / (len(freqs) * 3)


def bass(f, length):
    t = secs(length)
    x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t) + 0.12 * saw(f, t)
    return np.tanh(1.4 * x) * adsr(len(t), 0.005, 0.08, 0.8, 0.04) * 0.6


def felt_piano(f, length=1.6, vel=1.0):
    """Weiches Filz-Klavier: Grundton + leise Obertöne, sanfter Anschlag, langes Ausklingen."""
    t = secs(length)
    x = sum(a * np.sin(2 * np.pi * f * h * (1 + 0.0004 * h * h) * t) * np.exp(-t / (1.1 / h)) for h, a in [(1, 1), (2, 0.42), (3, 0.16), (4, 0.07)])
    x *= np.minimum(1, t / 0.006) * vel
    return lp(x, 2200) * 0.5


def bell(f, length=1.8):
    t = secs(length)
    x = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / d) for r, a, d in [(1, 1, 0.9), (2.76, 0.35, 0.4), (5.4, 0.15, 0.2)])
    return x * np.minimum(1, t / 0.002) * 0.35


def soft_hit():
    """Weicher Akzent: tiefer Puls + Luftzug, kein harter Schlag."""
    t = secs(1.6)
    f = 42 + 30 * np.exp(-t / 0.1)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.45) * 0.8
    air = bp(rng.standard_normal(len(t)), 1500, 7000) * np.exp(-t / 0.35) * 0.12
    return x + air


def voice_duck(fassung, n, depth_db=-8.0):
    """Hüllkurve: −8 dB während gesprochen wird, weiche Übergänge in den Pausen."""
    # die Stimme kann aus einer anderen Fassung stammen (Skript-Kopf „# stimme: …“) → Ordner aus der Timeline
    tl = ROOT / "src" / "data" / f"timeline-{fassung}.json"
    voice = json.loads(tl.read_text(encoding="utf-8"))["audio"].get("voice") if tl.exists() else None
    path = ROOT / "public" / (Path(voice).parent.as_posix() if voice else fassung) / "voice-words.json"
    g = np.ones(n)
    if not path.exists():
        return g
    words = json.loads(path.read_text(encoding="utf-8"))
    spans = []
    for w in words:
        if spans and w["start"] - spans[-1][1] < 0.3:
            spans[-1][1] = w["end"]
        else:
            spans.append([w["start"], w["end"]])
    low = 10 ** (depth_db / 20)
    for a, b in spans:
        g[int(max(0, a - 0.08) * SR) : int(b * SR)] = low
    # Glätten: schnell runter (~80 ms), langsam wieder hoch (~400 ms)
    out = np.empty(n)
    v = 1.0
    down, up = 1 - np.exp(-1 / (0.08 * SR)), 1 - np.exp(-1 / (0.4 * SR))
    for i in range(0, n, 64):
        target = g[i]
        v += (target - v) * (1 - (1 - (down if target < v else up)) ** 64)
        out[i : i + 64] = v
    return out


def build_sanft(beats, dur, t_hit, t_drop, t_lift, t_end, bpm, fassung):
    step = 60 / bpm / 4
    bar = 16 * step
    music, accents, send = Track(dur), Track(dur), Track(dur)
    # Intro: ruhige Moll-Fläche + leises Ticken, sanfter Anstieg zum Akzent
    drone = pad([110.0, 164.8, 220.0], t_hit + 0.6, cutoff=650)
    music.add(drone, 0, 0.45)
    send.add(drone, 0, 0.2)
    t = 0.0
    while t < t_hit - 0.05:
        music.add(hat() * 0.6, t, 0.18)
        t += 4 * step
    r_len = min(1.8, t_hit)
    accents.add(riser(r_len) * 0.5, t_hit - r_len, 0.35)
    accents.add(soft_hit(), t_hit, 0.35)
    send.add(bell(523.3, 2.0), t_hit, 0.3)
    # Hauptteil: C – G – Am – F mit Filz-Klavier, Flächen, tiefem Bass, leisem Shaker
    prog = [
        ([261.6, 329.6, 392.0], 65.4, [523.3, 392.0, 659.3, 392.0]),
        ([246.9, 293.7, 392.0], 49.0, [493.9, 392.0, 587.3, 392.0]),
        ([261.6, 329.6, 440.0], 55.0, [523.3, 440.0, 659.3, 440.0]),
        ([261.6, 349.2, 440.0], 43.7, [523.3, 440.0, 698.5, 440.0]),
    ]
    tb, b = t_drop, 0
    while tb < t_end - 0.01:
        chord, root, mel = prog[b % 4]
        lifted = tb >= t_lift
        bl = min(bar, t_end - tb)
        p_ = pad(chord, bl + 0.4, cutoff=1400 if not lifted else 2000)
        music.add(p_, tb, 0.42)
        send.add(p_, tb, 0.25)
        music.add(bass(root, min(bar * 0.95, bl)) * 0.7, tb, 0.5)
        for q in range(4):  # Klavier auf Vierteln, zart
            tq = tb + q * 4 * step
            if tq >= t_end - 0.01:
                break
            pn = felt_piano(mel[q], 1.6, vel=0.9 if q == 0 else 0.65)
            music.add(pn, tq, 0.42, [-0.25, 0.2, -0.15, 0.25][q])
            send.add(pn, tq, 0.3)
            if lifted and q % 2 == 0:
                music.add(bell(mel[q] * 2, 1.4), tq, 0.12, 0.3)
        for s16 in range(0, 16, 2):  # Shaker sehr leise
            ts = tb + s16 * step
            if ts < t_end - 0.01:
                music.add(hat() * 0.5, ts, 0.06 if s16 % 4 else 0.1)
        tb += bar
        b += 1
    send.add(bell(784.0, 2.0), t_lift, 0.35)
    accents.add(bell(784.0, 2.0), t_lift, 0.25)
    # Ende: aufgelöster Akkord + Glöckchen
    tail = max(1.5, dur - t_end + 0.5)
    final = pad([261.6, 329.6, 392.0, 523.3], tail, cutoff=2200)
    music.add(final, t_end, 0.5)
    send.add(final, t_end, 0.35)
    for k, f in enumerate([523.3, 659.3, 784.0, 1046.5]):
        accents.add(felt_piano(f, 2.2, 0.8), t_end + k * 0.09, 0.35, [-0.3, 0.3, -0.15, 0.15][k])
        send.add(bell(f, 2.0), t_end + k * 0.09, 0.12)
    music.add(bass(65.4, tail) * 0.7, t_end, 0.5)

    n = len(music.x)
    ir = reverb_ir(2.2)
    wet = np.stack([fftconvolve(send.x[:, c], ir[:, c])[:n] for c in range(2)], axis=1)
    duck = voice_duck(fassung, n)[:, None]
    mix = (music.x + wet * 0.45) * duck + accents.x
    return mix


def braam(freqs, length=2.6, open_=1.0):
    """Tiefer Kino-Akzent: verstimmte Sägezähne, Filter öffnet sich und schließt wieder."""
    t = secs(length)
    x = np.zeros(len(t))
    for f in freqs:
        for det in (-0.3, 0.0, 0.3):
            x += saw(f * (1 + det / 100), t)
    x /= len(freqs) * 3
    out = np.zeros(len(t))
    steps = 40
    for k in range(steps):  # Filterkurve in Stücken
        a, b = k * len(t) // steps, (k + 1) * len(t) // steps
        pos = k / steps
        fc = 200 + 2200 * open_ * np.exp(-((pos - 0.12) ** 2) / 0.02)
        out[a:b] = lp(x, fc)[a:b]
    env = np.minimum(1, t / 0.03) * np.exp(-t / (length / 2.2))
    return np.tanh(2.0 * out * env) * 0.8


def build_nacht(beats, dur, t_hit, t_drop, t_lift, t_end, bpm, fassung):
    """Dunkler Kino-Puls (d-Moll): pulsierender Bass, Flächen, leises Arpeggio, Ticken, Kino-Akzente."""
    step = 60 / bpm / 4
    bar = 16 * step
    music, accents, send = Track(dur), Track(dur), Track(dur)
    prog = [  # Dm – B – F – C
        ([146.8, 174.6, 220.0], 36.7, [293.7, 349.2, 440.0, 349.2]),
        ([116.5, 146.8, 174.6], 29.1, [233.1, 293.7, 349.2, 293.7]),
        ([174.6, 220.0, 261.6], 43.7, [349.2, 440.0, 523.3, 440.0]),
        ([130.8, 164.8, 196.0], 32.7, [261.6, 329.6, 392.0, 329.6]),
    ]
    tb, b = 0.0, 0
    while tb < t_end - 0.01:
        chord, root, arp = prog[b % 4]
        bl = min(bar, t_end - tb)
        intro = tb < t_drop
        p_ = pad(chord, bl + 0.4, cutoff=700 if intro else 1100)
        music.add(p_, tb, 0.4)
        send.add(p_, tb, 0.25)
        for s16 in range(16):
            ts = tb + s16 * step
            if ts >= t_end - 0.01:
                break
            if s16 % 2 == 0:  # pulsierender Bass auf Achteln
                music.add(bass(root * 2, step * 1.6) * (0.5 if intro else 0.8), ts, 0.5)
            if not intro:  # leises Arpeggio
                pl = pluck(arp[s16 % 4] * (2 if s16 % 8 == 7 else 1), 0.4, bright=0.35)
                music.add(pl, ts, 0.12, -0.3 if s16 % 2 else 0.3)
                send.add(pl, ts, 0.1)
            music.add(hat() * 0.5, ts, 0.05 if s16 % 4 else 0.09)  # Ticken
        tb += bar
        b += 1
    # Akzente
    r_len = min(1.8, t_hit)
    accents.add(riser(r_len) * 0.5, t_hit - r_len, 0.3)
    accents.add(boom(), t_hit, 0.55)
    accents.add(braam([36.7, 73.4, 110.0]), t_drop, 0.7)
    send.add(braam([36.7, 73.4, 110.0]), t_drop, 0.3)
    send.add(bell(880.0, 2.4), t_lift, 0.25)
    accents.add(bell(880.0, 2.4), t_lift, 0.15)
    tail = max(1.5, dur - t_end + 0.5)
    accents.add(braam([36.7, 73.4, 146.8], 3.2), t_end, 0.75)
    final = pad([146.8, 220.0, 293.7, 349.2], tail, cutoff=1400)
    music.add(final, t_end, 0.5)
    send.add(final, t_end, 0.35)
    n = len(music.x)
    ir = reverb_ir(2.6)
    wet = np.stack([fftconvolve(send.x[:, c], ir[:, c])[:n] for c in range(2)], axis=1)
    duck = voice_duck(fassung, n)[:, None]
    return (music.x + wet * 0.5) * duck + accents.x


def reverb_ir(length=1.6):
    t = secs(length)
    ir = np.stack([rng.standard_normal(len(t)), rng.standard_normal(len(t))], axis=1)
    ir *= np.exp(-t / (length / 5.5))[:, None]
    ir[:, 0] = lp(ir[:, 0], 7000)
    ir[:, 1] = lp(ir[:, 1], 7000)
    return ir / np.abs(ir).sum(0).max() * 6


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("fassung")
    ap.add_argument("--bpm", type=float, default=None)
    ap.add_argument("--stil", default="sanft", choices=["sanft", "kraftvoll", "nacht", "sport"])
    args = ap.parse_args()
    args.bpm = args.bpm or {"sanft": 96, "nacht": 100, "sport": 128}.get(args.stil, 120)
    tl_path = ROOT / "src" / "data" / f"timeline-{args.fassung}.json"
    if not tl_path.exists():
        sys.exit(f"{tl_path} fehlt – erst: node tools/build-timeline.mjs {args.fassung}")
    tl = json.loads(tl_path.read_text(encoding="utf-8"))
    beats, dur = tl["beats"], tl["duration"]

    def beat(*effects):
        return next((b for b in beats if b["effect"] in effects), None)

    # Schlüsselstellen (Namen aus den verschiedenen Stilen)
    b_schluss, b_logo, b_preis, b_end = beat("schluss", "stopp", "ampel"), beat("logo", "zuendung", "teamlogo"), beat("preis", "preisschild", "startnummer"), beat("end", "finale", "zielflagge")
    t_hit = b_schluss["words"][-1]["start"] if b_schluss else beats[1]["start"]
    t_drop = b_logo["start"] if b_logo else beats[min(2, len(beats) - 1)]["start"]
    t_lift = b_preis["start"] if b_preis else dur * 0.7
    t_end = b_end["start"] if b_end else dur - 3

    if args.stil == "nacht":
        finish(build_nacht(beats, dur, t_hit, t_drop, t_lift, t_end, args.bpm, args.fassung), dur, args, t_hit, t_drop, t_lift, t_end)
        return
    if args.stil == "sanft":
        finish(build_sanft(beats, dur, t_hit, t_drop, t_lift, t_end, args.bpm, args.fassung), dur, args, t_hit, t_drop, t_lift, t_end)
        return

    step = 60 / args.bpm / 4  # 16tel
    bar = 16 * step
    drums, music, sc_src = Track(dur), Track(dur), Track(dur)  # sc_src: Kicks für Sidechain
    send = Track(dur)  # Hall-Weg

    # ---------- Teil A: Spannung (Moll) bis zum Schlag ----------
    a_len = t_hit
    drone = pad([110.0, 164.8, 220.0], a_len + 0.4, cutoff=700)
    music.add(drone, 0, 0.55)
    t = 0.0
    while t < t_hit - 0.05:  # Puls (Herzschlag) auf Viertel
        drums.add(kick() * 0.6, t, 0.55)
        t += 4 * step
    t = 0.0
    k = 0
    while t < t_hit - 0.05:  # leises Ticken
        drums.add(hat(), t, 0.25 + 0.15 * (k % 2))
        t += 2 * step
        k += 1
    r_len = min(2.2, t_hit)
    music.add(riser(r_len), t_hit - r_len, 0.5)
    roll_start = max(0, t_hit - 1.0)
    t = roll_start
    while t < t_hit - 0.03:  # Wirbel, der lauter wird
        g = (t - roll_start) / max(0.01, t_hit - roll_start)
        drums.add(clap() * 0.5, t, 0.15 + 0.6 * g**2)
        t += step
    # ---------- Schlag bei „Schluss.“ ----------
    drums.add(kick(big=True), t_hit, 1.0)
    drums.add(boom(), t_hit, 0.9)
    send.add(crash(2.6), t_hit, 0.5)
    drums.add(crash(2.6), t_hit, 0.6)

    # ---------- Teil B/C: Drop in den Dur-Groove ----------
    prog = [  # C – G – Am – F
        ([261.6, 329.6, 392.0], 65.4, [523.3, 659.3, 784.0, 1046.5]),
        ([246.9, 293.7, 392.0], 49.0, [493.9, 587.3, 784.0, 987.8]),
        ([261.6, 329.6, 440.0], 55.0, [523.3, 659.3, 880.0, 1046.5]),
        ([261.6, 349.2, 440.0], 43.7, [523.3, 698.5, 880.0, 1046.5]),
    ]
    arp = [0, 1, 2, 3, 2, 1, 2, 3]
    drums.add(crash(2.2), t_drop, 0.5)
    send.add(crash(2.2), t_drop, 0.3)
    b = 0
    tb = t_drop
    while tb < t_end - 0.01:
        chord, root, notes = prog[b % 4]
        lifted = tb >= t_lift
        bl = min(bar, t_end - tb)
        p = pad(chord, bl + 0.3, cutoff=2600 if lifted else 1800)
        music.add(p, tb, 0.5)
        send.add(p, tb, 0.25)
        for s in range(16):
            ts = tb + s * step
            if ts >= t_end - 0.01:
                break
            if s % 4 == 0:
                drums.add(kick(), ts, 0.85)
                sc_src.add(np.ones(1), ts, 1.0)
            if s in (4, 12):
                drums.add(clap(), ts, 0.55)
                send.add(clap(), ts, 0.25)
            if s % 4 == 2:
                drums.add(hat(True), ts, 0.45)
            drums.add(hat(), ts, 0.18 if s % 2 else 0.1)
            if s % 2 == 0:  # pumpender Bass auf Achteln
                music.add(bass(root * (2 if s % 8 == 6 else 1), 2 * step * 0.9), ts, 0.55)
            if s % 2 == 0:  # Plucks (Arpeggio) + Echo
                f = notes[arp[(s // 2) % 8]] * (2 if lifted and s % 4 == 0 else 1)
                pl = pluck(f, 0.7, bright=1.0 if lifted else 0.6)
                pan = -0.35 if (s // 2) % 2 else 0.35
                music.add(pl, ts, 0.32, pan)
                send.add(pl, ts, 0.2, pan)
                music.add(pl, ts + 3 * step, 0.12, -pan)  # punktiertes Achtel-Echo
        tb += bar
        b += 1
    drums.add(crash(2.4), t_lift, 0.5)
    send.add(crash(2.4), t_lift, 0.25)

    # ---------- Ende: Crash + Schlussakkord ----------
    tail = max(1.5, dur - t_end + 0.5)
    drums.add(kick(big=True), t_end, 0.9)
    drums.add(crash(3.0), t_end, 0.6)
    final = pad([261.6, 329.6, 392.0, 523.3], tail, cutoff=3000)
    music.add(final, t_end, 0.6)
    send.add(final, t_end, 0.35)
    for k, f in enumerate([523.3, 659.3, 784.0, 1046.5]):
        pl = pluck(f, 1.6, 1.0)
        music.add(pl, t_end + k * 0.06, 0.3, [-0.4, 0.4, -0.2, 0.2][k])
        send.add(pl, t_end + k * 0.06, 0.25)
    music.add(bass(65.4, tail), t_end, 0.6)

    # ---------- Mischen: Sidechain, Hall, Summe ----------
    n = len(music.x)
    duck = np.ones(n)
    hits = np.nonzero(sc_src.x[:, 0])[0]
    rel = int(0.22 * SR)
    curve = 1 - 0.55 * np.exp(-np.arange(rel) / (0.06 * SR))
    for h in hits:
        e = min(n, h + rel)
        duck[h:e] = np.minimum(duck[h:e], curve[: e - h])
    music.x *= duck[:, None]
    ir = reverb_ir()
    wet = np.stack([fftconvolve(send.x[:, c], ir[:, c])[:n] for c in range(2)], axis=1)
    mix = drums.x * 0.9 + music.x + wet * 0.35
    if args.stil == "sport":  # treibend, aber unter der Stimme automatisch leiser
        mix *= voice_duck(args.fassung, len(mix), -7.0)[:, None]
    finish(mix, dur, args, t_hit, t_drop, t_lift, t_end)


def finish(mix, dur, args, t_hit, t_drop, t_lift, t_end):
    mix = hp(mix.T, 30).T
    mix = np.tanh(1.15 * mix)
    mix = mix[: int((dur + 0.2) * SR)]
    # Ausblenden am Ende
    fade = int(1.2 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.5
    mix = mix / np.abs(mix).max() * 0.89

    import soundfile as sf

    wav = ROOT / "out" / f"musik-{args.fassung}.wav"
    wav.parent.mkdir(exist_ok=True)
    sf.write(wav, mix.astype(np.float32), SR)
    out = ROOT / "public" / f"musik-{args.fassung}.mp3"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", "256k", str(out)], check=True)
    print(f"Fertig: public/musik-{args.fassung}.mp3 ({dur:.1f} s, {args.bpm:.0f} BPM, Stil {args.stil}) – Akzent {t_hit:.2f} s, Drop {t_drop:.2f} s, Preis {t_lift:.2f} s, Ende {t_end:.2f} s")


if __name__ == "__main__":
    main()
