"""
Launch-Film: spricht die vier Wörter des Anfangs („Zettel. Excel. Ordner. Chaos?“) einzeln und klar.
Im ganzen Satz verschluckt die Computerstimme „Zettel“ und „Chaos“. Hier wird jedes Wort viele Male erzeugt
(verschiedene Tempi, Lebendigkeit, Schreibweisen); Whisper hört jeden Take dreimal ab (unterschiedlicher Rand),
nur der am sichersten verstandene gewinnt. tools/launch_voice.py setzt diese Wörter dann auf ihre Beats.

Ausgang: public/launch/opener.wav + opener-words.json (Wortzeiten in opener.wav)
Aufruf:  .venv/bin/python tools/launch_opener.py
"""
import json
import re
import sys
from math import gcd
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parent.parent
D = ROOT / "public" / "launch"
sys.path.insert(0, str(ROOT / "tools"))
from klang import apply as apply_klang  # noqa: E402

MODEL = ROOT / "models" / "piper" / "vits-piper-de_DE-thorsten_emotional-medium" / "de_DE-thorsten_emotional-medium.onnx"
# Wort im Film → gesprochene Schreibweisen (Whisper versteht „Kaos“ öfter als „Chaos“)
WORDS = [("Zettel", ["Zettel.", "Zettel?"]), ("Excel", ["Excel.", "Excel?", "Ecksel.", "Ecksel?"]), ("Ordner", ["Ordner.", "Ordner?"]), ("Chaos", ["Chaos?", "Kaos?"])]
TEMPI, LEBEN, TAKES = (1.0, 1.15, 1.3), (0.45, 0.62), 5
GAP = 0.6  # Stille zwischen den Wörtern in opener.wav


def norm(t):
    return re.sub(r"[^a-zäöüß]", "", t.lower())


def main():
    import sherpa_onnx
    from piper import PiperVoice, SynthesisConfig

    A = next((ROOT / "models" / "asr").glob("sherpa-onnx-whisper-*"))
    n = A.name.split("-")[-1]
    rec = sherpa_onnx.OfflineRecognizer.from_whisper(
        encoder=str(A / f"{n}-encoder.int8.onnx"), decoder=str(A / f"{n}-decoder.int8.onnx"), tokens=str(A / f"{n}-tokens.txt"), language="de", task="transcribe"
    )

    def hear(x16, pad):
        st = rec.create_stream()
        z = np.zeros(int(pad * 16000), np.float32)
        st.accept_waveform(16000, np.concatenate([z, x16, z]))
        rec.decode_stream(st)
        return st.result.text.strip()

    voice = PiperVoice.load(str(MODEL))
    sr = voice.config.sample_rate
    spk = (voice.config.speaker_id_map or {}).get("neutral", 0)
    tmp_raw, tmp_out = ROOT / "out" / "opener-raw.wav", ROOT / "out" / "opener-take.wav"
    tmp_raw.parent.mkdir(exist_ok=True)

    # Zielpegel: mittlere Lautheit der Satz-Aufnahme (damit die Einzelwörter nicht herausstechen)
    ref, rsr = sf.read(D / "voice.wav", dtype="float32")
    ref = ref.mean(1) if ref.ndim > 1 else ref
    target_rms = float(np.sqrt(np.mean(ref[np.abs(ref) > 0.02] ** 2)))

    picked = []
    for word, texts in WORDS:
        best = None
        for text in texts:
            for ls in TEMPI:
                for ns in LEBEN:
                    syn = SynthesisConfig(speaker_id=spk, length_scale=ls, noise_scale=ns, noise_w_scale=0.8, normalize_audio=False)
                    for _ in range(TAKES):
                        audio = np.concatenate([c.audio_float_array for c in voice.synthesize(text, syn)])
                        sf.write(tmp_raw, audio / max(1e-6, np.abs(audio).max()) * 0.8, sr)
                        apply_klang(tmp_raw, tmp_out, "natuerlich", rsr)
                        x, _ = sf.read(tmp_out, dtype="float32")
                        g = gcd(16000, rsr)
                        x16 = resample_poly(x, 16000 // g, rsr // g).astype(np.float32)
                        heard = [hear(x16, p) for p in (0.1, 0.3, 0.6)]
                        score = sum(norm(h) == norm(word) for h in heard)
                        # Gleichstand: Länge nahe 0,55 s (passt auf einen Beat, klingt nicht gehetzt)
                        on = np.flatnonzero(np.abs(x) > 0.02)
                        dur = (on[-1] - on[0]) / rsr if len(on) else 9
                        key = (score, -abs(dur - 0.55))
                        if best is None or key > best[0]:
                            a, b = max(0, on[0] - int(0.03 * rsr)), min(len(x), on[-1] + int(0.08 * rsr))
                            best = (key, x[a:b], heard, text, ls, ns)
            if best[0][0] == 3:
                break
        (score, _), x, heard, text, ls, ns = best
        print(f"{word:7} {score}/3 verstanden  ({text} Tempo {ls} Leben {ns})  {heard}")
        picked.append((word, x))

    out, words, t = [np.zeros(int(0.1 * rsr), np.float32)], [], 0.1
    for word, x in picked:
        rms = float(np.sqrt(np.mean(x[np.abs(x) > 0.02] ** 2)))
        x = np.clip(x * (target_rms / max(rms, 1e-6)), -0.95, 0.95)
        words.append({"word": word, "start": round(t, 3), "end": round(t + len(x) / rsr, 3)})
        out += [x, np.zeros(int(GAP * rsr), np.float32)]
        t += len(x) / rsr + GAP
    sf.write(D / "opener.wav", np.concatenate(out), rsr)
    (D / "opener-words.json").write_text(json.dumps(words, ensure_ascii=False, indent=1), encoding="utf-8")
    print("Fertig: public/launch/opener.wav + opener-words.json")


if __name__ == "__main__":
    main()
