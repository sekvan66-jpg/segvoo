"""
Erzeugt die Sprecherstimme aus skript.txt mit Chatterbox Multilingual (Deutsch).

- Jede Skript-Zeile wird einzeln gesprochen (bessere Betonung) und dann zusammengesetzt.
- Wenn public/meine-stimme.wav existiert, wird diese Stimme geklont (10–20 s, klar gesprochen).
- Ergebnis: public/voice.wav + public/voice-segments.json (Start/Ende jeder Zeile)

Aufruf:   .venv\\Scripts\\python tools\\voice.py            (Windows)
          .venv/bin/python tools/voice.py                  (Mac/Linux)
Optionen: --energie 0.7   (0.3 ruhig … 1.0 sehr energisch)
          --tempo 0.4     (cfg_weight: kleiner = schneller/lebendiger)
          --pause 0.12    (Sekunden Pause zwischen Zeilen)
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"


def read_script():
    lines = []
    for raw in (ROOT / "skript.txt").read_text(encoding="utf-8").splitlines():
        raw = raw.strip()
        if not raw or raw.startswith("#"):
            continue
        m = re.match(r"^(\w+)\s*\|\s*(.+)$", raw)
        if not m:
            sys.exit(f'Zeile hat falsches Format (effekt | Text): "{raw}"')
        lines.append(m.group(2).strip())
    return lines


def trim(wav, sr, thresh=0.01, pad=0.04):
    import numpy as np

    a = np.abs(wav)
    idx = np.where(a > thresh * a.max())[0]
    if len(idx) == 0:
        return wav
    s = max(0, idx[0] - int(pad * sr))
    e = min(len(wav), idx[-1] + int(pad * sr))
    return wav[s:e]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--energie", type=float, default=0.7)
    ap.add_argument("--tempo", type=float, default=0.4)
    ap.add_argument("--pause", type=float, default=0.12)
    args = ap.parse_args()

    import numpy as np
    import torch
    import soundfile as sf
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS

    device = "cuda" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu")
    print(f"Lade Chatterbox auf {device} … (beim ersten Mal wird das Modell heruntergeladen, ~3 GB)")
    model = ChatterboxMultilingualTTS.from_pretrained(device=device)
    sr = model.sr

    ref = PUBLIC / "meine-stimme.wav"
    ref_path = str(ref) if ref.exists() else None
    print("Stimme:", "eigene (meine-stimme.wav)" if ref_path else "Standard-Stimme")

    lines = read_script()
    out, segs, t = [], [], 0.0
    gap = np.zeros(int(args.pause * sr), dtype=np.float32)
    for i, text in enumerate(lines, 1):
        print(f"[{i}/{len(lines)}] {text}")
        wav = model.generate(
            text,
            language_id="de",
            audio_prompt_path=ref_path,
            exaggeration=args.energie,
            cfg_weight=args.tempo,
        )
        wav = trim(wav.squeeze(0).cpu().numpy().astype(np.float32), sr)
        segs.append({"text": text, "start": round(t, 3), "end": round(t + len(wav) / sr, 3)})
        out += [wav, gap]
        t += len(wav) / sr + args.pause

    full = np.concatenate(out)
    full = full / max(1e-6, np.abs(full).max()) * 0.95
    sf.write(PUBLIC / "voice.wav", full, sr)
    (PUBLIC / "voice-segments.json").write_text(json.dumps(segs, ensure_ascii=False, indent=2), encoding="utf-8")
    old = PUBLIC / "voice-words.json"
    if old.exists():
        old.unlink()  # altes Wort-Timing passt nicht mehr
    print(f"Fertig: public/voice.wav ({t:.1f} s). Jetzt: python tools/timing.py")


if __name__ == "__main__":
    main()
