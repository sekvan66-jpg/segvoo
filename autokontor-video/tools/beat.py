"""
Erzeugt einen treibenden Hintergrund-Beat (dunkler Trap-Beat: Kick, 808-Bass, Clap, Hi-Hats, Fläche)
komplett per Code – keine fremde Musik, keine Lizenzfragen.
Ergebnis: public/musik.mp3  → wird von npm run timeline automatisch eingebunden (leise unter der Stimme).

Aufruf:   .venv/bin/python tools/beat.py  [--bpm 150] [--sekunden 80]
Eigene Musik (z. B. aus Suno) ist meist schöner: einfach als public/musik.mp3 ablegen.
"""
import argparse
import subprocess
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parent.parent
SR = 44100
rng = np.random.default_rng(3)


def env(n, decay):
    return np.exp(-np.arange(n) / (decay * SR))


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], btype="band", fs=SR, output="sos"), x)


def hp(x, f):
    return sosfilt(butter(2, f, btype="high", fs=SR, output="sos"), x)


def lp(x, f):
    return sosfilt(butter(2, f, btype="low", fs=SR, output="sos"), x)


def kick():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    freq = 45 + 110 * np.exp(-t / 0.03)
    body = np.sin(2 * np.pi * np.cumsum(freq) / SR) * env(n, 0.12)
    click = hp(rng.standard_normal(n), 3000) * env(n, 0.004) * 0.4
    return np.tanh(1.6 * (body + click))


def bass(f0, length):
    n = int(length * SR)
    t = np.arange(n) / SR
    glide = f0 * (1 + 0.6 * np.exp(-t / 0.02))
    x = np.sin(2 * np.pi * np.cumsum(glide) / SR)
    a = np.minimum(1, np.arange(n) / (0.004 * SR)) * env(n, 0.45)
    return np.tanh(2.2 * x) * a


def clap():
    n = int(0.3 * SR)
    noise = bp(rng.standard_normal(n), 900, 3200)
    e = np.zeros(n)
    for k, off in enumerate([0, 0.011, 0.022]):
        s = int(off * SR)
        e[s:] += env(n - s, 0.006 if k < 2 else 0.09)
    return noise * e * 0.9


def hat(open_=False):
    n = int((0.18 if open_ else 0.05) * SR)
    return hp(rng.standard_normal(n), 7500) * env(n, 0.05 if open_ else 0.012) * 0.35


def pad(freqs, length):
    n = int(length * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for f in freqs:
        for det in (-0.12, 0.0, 0.12):
            ph = 2 * np.pi * f * (1 + det / 100) * t
            x += 2 * (ph / (2 * np.pi) % 1) - 1  # Sägezahn
    x = lp(x / (len(freqs) * 3), 900)
    a = np.minimum(1, t / 0.4) * np.minimum(1, (length - t) / 0.4)
    return x * a


def add(track, sample, at, gain=1.0):
    s = int(at * SR)
    if s >= len(track):
        return
    e = min(len(track), s + len(sample))
    track[s:e] += sample[: e - s] * gain


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--bpm", type=float, default=150)
    ap.add_argument("--sekunden", type=float, default=80)
    args = ap.parse_args()

    step = 60 / args.bpm / 4  # 16tel
    bar = step * 16
    bars = int(np.ceil(args.sekunden / bar))
    n = int(bars * bar * SR) + SR
    drums, low, mid = np.zeros(n), np.zeros(n), np.zeros(n)

    # F-Moll: F, F, Des, Es (je ein Takt)
    roots = [43.65, 43.65, 34.65, 38.89]
    chords = [[174.6, 207.7, 261.6], [174.6, 207.7, 261.6], [138.6, 174.6, 207.7], [155.6, 196.0, 233.1]]
    K, C, H = kick(), clap(), hat()
    for b in range(bars):
        t0 = b * bar
        r = roots[b % 4]
        kicks = [0, 7, 10] if b % 2 == 0 else [0, 3, 10, 14]
        for s in kicks:
            add(drums, K, t0 + s * step, 0.9)
            add(low, bass(r, step * 4), t0 + s * step, 0.55)
        add(drums, C, t0 + 8 * step, 0.8)
        if b % 4 == 3:
            add(drums, C, t0 + 15 * step, 0.4)
        for s in range(0, 16, 2):
            add(drums, H, t0 + s * step, 0.9 if s % 4 == 0 else 0.6)
        if b % 2 == 1:  # Hi-Hat-Roll am Taktende
            for k in range(6):
                add(drums, H, t0 + 12 * step + k * step / 1.5, 0.35 + k * 0.08)
        add(drums, hat(True), t0 + 6 * step, 0.5)
        add(mid, pad(chords[b % 4], bar), t0, 0.22)

    mix = drums + low + mid
    mix = np.tanh(1.2 * mix)
    mix = mix[: int(args.sekunden * SR)]
    mix = mix / np.abs(mix).max() * 0.89
    stereo = np.stack([mix, mix], axis=1)
    wav = ROOT / "out" / "beat.wav"
    wav.parent.mkdir(exist_ok=True)
    import soundfile as sf

    sf.write(wav, stereo, SR)
    out = ROOT / "public" / "musik.mp3"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", "192k", str(out)], check=True)
    print(f"Fertig: public/musik.mp3 ({args.sekunden:.0f} s, {args.bpm:.0f} BPM). Jetzt: npm run timeline")


if __name__ == "__main__":
    main()
