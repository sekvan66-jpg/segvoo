"""Generates the background music (musik.wav) for the AutoKontor promo video.

Pure numpy synthesis, so the soundtrack is royalty-free and reproducible:
tense pad during the hook, riser + impact on the logo reveal, then a light
100-bpm groove (Am - F - C - G) until the outro.
"""
import wave
import numpy as np

SR = 44100
DUR = 42.0
BPM = 100
BEAT = 60 / BPM
DROP = 4.0  # logo reveal in the video
N = int(SR * DUR)
rng = np.random.default_rng(7)

L = np.zeros(N)
R = np.zeros(N)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def add(sig, start, gain=1.0, pan=0.0):
    i = int(start * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    L[i:i + len(sig)] += sig * gain * (1 - pan) / 2 * 2 ** .5
    R[i:i + len(sig)] += sig * gain * (1 + pan) / 2 * 2 ** .5


def env(n, a, r, sustain=1.0):
    e = np.full(n, sustain)
    ai, ri = int(a * SR), int(r * SR)
    e[:ai] = np.linspace(0, sustain, ai)
    if ri:
        e[-ri:] *= np.linspace(1, 0, ri)
    return e


def saw(freq, n, detune=0.0):
    t = np.arange(n) / SR
    ph = (t * freq * (1 + detune)) % 1
    return 2 * ph - 1


def pad(notes, length, cutoff):
    n = int(length * SR)
    s = np.zeros(n)
    for m in notes:
        for d in (-0.004, 0.0, 0.005):
            s += saw(midi(m), n, d)
    s = lowpass(s / (len(notes) * 3), cutoff)
    return s * env(n, 0.35, 0.6)


def pluck(m, length=0.45):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = midi(m)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    return s * np.exp(-t * 9) * env(n, 0.003, 0.05)


def kick():
    n = int(0.4 * SR)
    t = np.arange(n) / SR
    f = 45 + 85 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 9)


def hat():
    n = int(0.06 * SR)
    noise = rng.standard_normal(n)
    hp = noise - lowpass(noise, 6000)
    return hp * np.exp(-np.arange(n) / SR * 70)


def boom():
    n = int(2.2 * SR)
    t = np.arange(n) / SR
    f = 35 + 60 * np.exp(-t * 6)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)


# --- Hook (0-4 s): low, filtered pad + riser ---
add(pad([45, 52, 57, 60], DROP + 0.4, 500), 0.0, 0.32)
rn = int(1.6 * SR)
riser = lowpass(rng.standard_normal(rn), 2500) * np.linspace(0, 1, rn) ** 2
add(riser, DROP - 1.6, 0.18)
add(boom(), DROP, 0.55)

# --- Groove (4 s - outro) ---
chords = [
    [57, 60, 64, 69],  # Am
    [53, 57, 60, 65],  # F
    [48, 55, 60, 64],  # C
    [55, 59, 62, 67],  # G
]
bass = [45, 41, 36, 43]
arp_pattern = [0, 2, 1, 3, 2, 1, 3, 2]
BAR = 4 * BEAT
end = 40.4
bar = 0
t0 = DROP
while t0 < end:
    c = chords[bar % 4]
    add(pad(c, BAR + 0.5, 1800), t0, 0.26)
    add(pad([bass[bar % 4]], BAR, 400), t0, 0.5)
    for b in range(4):
        tb = t0 + b * BEAT
        if tb >= end:
            break
        add(kick(), tb, 0.55)
        add(hat(), tb + BEAT / 2, 0.10, pan=0.3)
    for k in range(8):
        tk = t0 + k * BEAT / 2
        if tk >= end:
            break
        note = c[arp_pattern[k]] + 12
        add(pluck(note), tk, 0.13, pan=-0.35 if k % 2 else 0.35)
    t0 += BAR
    bar += 1

# Final chord rings out under the CTA
add(pad([57, 60, 64, 69, 72], 3.2, 1500), end, 0.3)

# Master: fade, soft-clip, normalise
mix = np.stack([L, R], axis=1)
fade = np.ones(N)
fi = int(0.05 * SR)
fade[:fi] = np.linspace(0, 1, fi)
fo = int(2.0 * SR)
fade[-fo:] = np.linspace(1, 0, fo) ** 1.5
mix *= fade[:, None]
mix = np.tanh(mix * 1.2)
mix /= np.max(np.abs(mix)) / 0.89

with wave.open("musik.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("musik.wav geschrieben")
