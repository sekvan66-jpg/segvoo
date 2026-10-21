"""
Erzeugt die weichen Soundeffekte für den Premium-Stil per Code (lizenzfrei):
  public/sfx/pop.wav    – „Plopp“, wenn eine Kugel/Karte erscheint
  public/sfx/swish.wav  – weicher Luftzug beim Szenenwechsel
  public/sfx/click.wav  – Maus-Klick
  public/sfx/ding.wav   – heller Glockenton (Preis, Häkchen)

Aufruf:   .venv/bin/python tools/sounds.py
"""
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parent.parent
SR = 44100
rng = np.random.default_rng(11)


def t(sec):
    return np.arange(int(sec * SR)) / SR


def norm(x, peak=0.8):
    return x / max(1e-9, np.abs(x).max()) * peak


def pop():
    tt = t(0.16)
    f = 180 + 900 * np.exp(-tt / 0.018)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.035)
    return norm(x, 0.8)


def swish():
    tt = t(0.45)
    n = rng.standard_normal(len(tt))
    out = np.zeros_like(n)
    # Bandpass, der von tief nach hoch wandert
    for k, (lo, hi) in enumerate([(300, 900), (600, 1800), (1200, 3600), (2400, 7000)]):
        seg = sosfilt(butter(2, [lo, hi], btype="band", fs=SR, output="sos"), n)
        w = np.exp(-((tt - 0.08 - k * 0.07) ** 2) / (2 * 0.06**2))
        out += seg * w
    return norm(out, 0.5)


def click():
    tt = t(0.05)
    x = sosfilt(butter(2, 2500, btype="high", fs=SR, output="sos"), rng.standard_normal(len(tt))) * np.exp(-tt / 0.004)
    x += np.sin(2 * np.pi * 1800 * tt) * np.exp(-tt / 0.006) * 0.5
    return norm(x, 0.6)


def ding():
    tt = t(1.2)
    x = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt / d) for f, a, d in [(1318.5, 1, 0.5), (2637, 0.35, 0.25), (3955, 0.15, 0.12), (1975.5, 0.3, 0.35)])
    x *= np.minimum(1, tt / 0.003)
    return norm(x, 0.5)


def main():
    out = ROOT / "public" / "sfx"
    out.mkdir(parents=True, exist_ok=True)
    for name, fn in [("pop", pop), ("swish", swish), ("click", click), ("ding", ding)]:
        sf.write(out / f"{name}.wav", fn().astype(np.float32), SR)
        print("✓", f"public/sfx/{name}.wav")


if __name__ == "__main__":
    main()
