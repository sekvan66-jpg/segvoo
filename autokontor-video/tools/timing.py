"""
Ermittelt mit Whisper, wann genau jedes Wort gesprochen wird.
Nimmt public/voice.wav (Chatterbox) oder public/sprecher.mp3 (z. B. ElevenLabs).
Ergebnis: public/voice-words.json  → danach: npm run timeline

Aufruf:   .venv\\Scripts\\python tools\\timing.py  [--modell medium]
"""
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--modell", default="medium", help="tiny, base, small, medium, large-v3")
    args = ap.parse_args()

    audio = next((p for p in [PUBLIC / "voice.wav", PUBLIC / "sprecher.mp3"] if p.exists()), None)
    if not audio:
        sys.exit("Keine Stimme gefunden. Erst tools/voice.py ausführen oder public/sprecher.mp3 ablegen.")

    import whisper
    import torch

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Whisper {args.modell} auf {device} – analysiere {audio.name} …")
    model = whisper.load_model(args.modell, device=device)
    script = " ".join(
        l.split("|", 1)[1].strip()
        for l in (ROOT / "skript.txt").read_text(encoding="utf-8").splitlines()
        if "|" in l and not l.strip().startswith("#")
    )
    res = model.transcribe(str(audio), language="de", word_timestamps=True, initial_prompt=script, fp16=(device == "cuda"))
    words = [
        {"word": w["word"].strip(), "start": round(w["start"], 3), "end": round(w["end"], 3)}
        for seg in res["segments"]
        for w in seg.get("words", [])
    ]
    (PUBLIC / "voice-words.json").write_text(json.dumps(words, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Fertig: {len(words)} Wörter erkannt → public/voice-words.json. Jetzt: npm run timeline")


if __name__ == "__main__":
    main()
