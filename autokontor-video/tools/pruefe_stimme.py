"""
Prüft eine erzeugte Stimme mit Spracherkennung (Whisper, offline): Wird jede Skript-Zeile verstanden?
Aufruf:   .venv/bin/python tools/pruefe_stimme.py premium30
Modell (einmalig, ~350 MB): models/asr/sherpa-onnx-whisper-small (siehe CLAUDE.md)
"""
import json
import sys
from pathlib import Path

import numpy as np
import sherpa_onnx
import soundfile as sf
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parent.parent
fassung = sys.argv[1] if len(sys.argv) > 1 else ""
d = ROOT / "public" / fassung if fassung else ROOT / "public"
A = next((ROOT / "models" / "asr").glob("sherpa-onnx-whisper-*"))
rec = sherpa_onnx.OfflineRecognizer.from_whisper(
    encoder=str(A / f"{A.name.split('-')[-1]}-encoder.int8.onnx"),
    decoder=str(A / f"{A.name.split('-')[-1]}-decoder.int8.onnx"),
    tokens=str(A / f"{A.name.split('-')[-1]}-tokens.txt"),
    language="de",
    task="transcribe",
)
x, sr = sf.read(d / "voice.wav", dtype="float32")
if x.ndim > 1:
    x = x.mean(1)
from math import gcd

g = gcd(16000, sr)
x16 = resample_poly(x, 16000 // g, sr // g).astype(np.float32)
for s in json.loads((d / "voice-segments.json").read_text(encoding="utf-8")):
    a, b = int(max(0, s["start"] - 0.1) * 16000), int((s["end"] + 0.15) * 16000)
    st = rec.create_stream()
    st.accept_waveform(16000, x16[a:b])
    rec.decode_stream(st)
    print(f'{s["text"].replace("*", "").replace("~", "")[:58]:60} → {st.result.text.strip()}')
print(f"Dauer: {len(x) / sr:.1f} s")
