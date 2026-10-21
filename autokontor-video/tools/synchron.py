"""
Synchronisiert eine ECHTE Sprachaufnahme (ElevenLabs, Suno, Sprecherin, eigene Stimme …) Wort für Wort mit dem Video.

So geht's: Die Computerstimme dieser Fassung spricht denselben Text – bei ihr kennen wir jede Wortzeit.
Dann wird der Klangverlauf beider Aufnahmen verglichen (Dynamic Time Warping auf MFCC-Merkmalen) und die
Wortzeiten werden auf die echte Aufnahme übertragen. Kein Internet, kein Whisper nötig.

Voraussetzung: Die Aufnahme spricht genau den Text aus dem Skript (gleiche Wörter, gleiche Reihenfolge).

Aufruf:
  .venv/bin/python tools/synchron.py premium30 pfad/zur/aufnahme.mp3
  → public/premium30/voice.wav (die echte Aufnahme), voice-words.json, voice-segments.json
  → danach: node tools/build-timeline.mjs premium30  (und ggf. tools/musik.py premium30)
Die bisherige Computerstimme wird als Referenz nach public/<fassung>/referenz/ gesichert.
Wenn dort noch keine Referenz liegt, vorher die Computerstimme erzeugen (voice_offline.py / voice_piper.py).
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SR = 16000
HOP = 160  # 10 ms


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def features(x):
    import librosa

    x = x / max(1e-6, np.abs(x).max())
    mf = librosa.feature.mfcc(y=x, sr=SR, n_mfcc=20, n_fft=512, hop_length=HOP, n_mels=40)[1:]  # ohne Lautstärke-Koeffizient
    d = librosa.feature.delta(mf)
    f = np.vstack([mf, d])
    f = (f - f.mean(1, keepdims=True)) / (f.std(1, keepdims=True) + 1e-6)
    # Stille-Merkmal, damit Pausen sauber aufeinander passen
    rms = librosa.feature.rms(y=x, frame_length=512, hop_length=HOP)[0]
    sil = (20 * np.log10(rms + 1e-6) < -40).astype(float) * 3.0
    return np.vstack([f, sil[None, : f.shape[1]]])


def warp_map(ref, tgt):
    """Liefert eine Funktion Referenz-Zeit → Ziel-Zeit."""
    import librosa

    _, wp = librosa.sequence.dtw(X=ref, Y=tgt, metric="cosine", step_sizes_sigma=np.array([[1, 1], [1, 2], [2, 1]]), weights_mul=np.array([1, 1.2, 1.2]))
    wp = wp[::-1]
    # pro Referenz-Frame die mittlere Ziel-Zeit, dann monoton glätten
    frames = np.unique(wp[:, 0])
    ur = frames * HOP / SR
    ut = np.array([wp[wp[:, 0] == k, 1].mean() for k in frames]) * HOP / SR
    ut = np.maximum.accumulate(ut)
    return lambda q: float(np.interp(q, ur, ut))


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    fassung, aufnahme = sys.argv[1], Path(sys.argv[2])
    d = ROOT / "public" / fassung
    ref_dir = d / "referenz"
    if not (ref_dir / "voice-words.json").exists():
        if not (d / "voice-words.json").exists():
            sys.exit("Keine Referenz gefunden – erst die Computerstimme für diese Fassung erzeugen.")
        ref_dir.mkdir(exist_ok=True)
        for f in ["voice.wav", "voice-words.json", "voice-segments.json"]:
            shutil.copy(d / f, ref_dir / f)
    ref_words = json.loads((ref_dir / "voice-words.json").read_text(encoding="utf-8"))
    ref_segs = json.loads((ref_dir / "voice-segments.json").read_text(encoding="utf-8"))
    ref_x, tgt_x = load(ref_dir / "voice.wav"), load(aufnahme)
    print(f"Referenz {len(ref_x) / SR:.1f} s · Aufnahme {len(tgt_x) / SR:.1f} s – vergleiche …")
    m = warp_map(features(ref_x), features(tgt_x))
    words = [{"word": w["word"], "start": round(m(w["start"]), 3), "end": round(max(m(w["end"]), m(w["start"]) + 0.05), 3)} for w in ref_words]
    segs = [{"text": s["text"], "start": round(m(s["start"]), 3), "end": round(m(s["end"]), 3)} for s in ref_segs]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(aufnahme), "-ar", "44100", str(d / "voice.wav")], check=True)
    (d / "voice-words.json").write_text(json.dumps(words, ensure_ascii=False, indent=2), encoding="utf-8")
    (d / "voice-segments.json").write_text(json.dumps(segs, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Fertig: {len(words)} Wörter synchronisiert → public/{fassung}/voice.wav + voice-words.json")
    print(f"Jetzt: node tools/build-timeline.mjs {fassung}")


if __name__ == "__main__":
    main()
