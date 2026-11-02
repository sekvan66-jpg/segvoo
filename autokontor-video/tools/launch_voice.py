"""
Launch-Film: legt jede Sprecherzeile (skript-launch.txt) genau auf ihren Beat (120 BPM) und baut eine 60-s-Tonspur.

Eingang:  public/launch/voice.wav + voice-segments.json + voice-words.json  (aus tools/voice_piper.py --fassung launch)
          public/launch/opener.wav + opener-words.json (aus tools/launch_opener.py, klarere Einzelwörter für Zeile 1)
Ausgang:  public/launch/voice-placed.wav (60 s)  +  public/launch/voice-placed.json (Wortzeiten im Film, für Ducking/Prüfung)

Aufruf:   .venv/bin/python tools/launch_voice.py
"""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
D = ROOT / "public" / "launch"
DUR = 60.0
BEAT = 0.5  # 120 BPM
# Einsatz jeder Skript-Zeile in Sekunden (immer auf einem Beat) – muss zu src/launch/Launch.tsx passen.
# Eine Liste statt einer Zahl = jedes Wort der Zeile einzeln auf seinen Beat (Kinetic Type am Anfang).
PLACE = [[0.5, 1.5, 2.5, 3.5], 7.0, 13.0, 23.0, 27.0, 33.0, 36.0, 41.0, 43.5, 45.5, 49.0, 56.0, 57.0]


def main():
    x, sr = sf.read(D / "voice.wav", dtype="float32")
    if x.ndim > 1:
        x = x.mean(1)
    segs = json.loads((D / "voice-segments.json").read_text(encoding="utf-8"))
    words = json.loads((D / "voice-words.json").read_text(encoding="utf-8"))
    opener = None
    if (D / "opener-words.json").exists():
        ox, osr = sf.read(D / "opener.wav", dtype="float32")
        if osr != sr:
            sys.exit("opener.wav hat eine andere Abtastrate als voice.wav")
        opener = (ox.mean(1) if ox.ndim > 1 else ox, json.loads((D / "opener-words.json").read_text(encoding="utf-8")))
    if len(segs) != len(PLACE):
        sys.exit(f"{len(segs)} Zeilen im Skript, aber {len(PLACE)} Einsatzzeiten in PLACE")
    out = np.zeros(int(DUR * sr), dtype=np.float32)
    placed, prev_end = [], 0.0
    pre, post, fade = 0.04, 0.14, int(0.012 * sr)
    pieces = []  # (Zeile, Quelle, Wortliste, Ausschnitt-Start, Ausschnitt-Ende, Einsatz, Text)
    for i, (s, t) in enumerate(zip(segs, PLACE)):
        if isinstance(t, list):
            ws = [w for w in words if w["start"] >= s["start"] - 1e-3 and w["end"] <= s["end"] + 1e-3]
            src, wl = x, words
            if opener and len(opener[1]) == len(t):  # einzeln gesprochene Wörter sind deutlicher
                src, wl = opener
                ws = wl
            if len(ws) != len(t):
                sys.exit(f"Zeile {i + 1}: {len(ws)} Wörter, aber {len(t)} Einsatzzeiten")
            pieces += [(i, src, [w], w["start"], w["end"], tt, w["word"]) for w, tt in zip(ws, t)]
        else:
            pieces.append((i, x, words, s["start"], s["end"], t, s["text"]))
    for i, src, wl, s0, s1, t, text in pieces:
        s = {"start": s0, "end": s1, "text": text}
        if t < prev_end + 0.05:  # würde den vorigen Satz überlappen → auf den nächsten freien Beat schieben
            nt = np.ceil((prev_end + 0.05) / BEAT) * BEAT
            print(f"Hinweis: Zeile {i + 1} von {t:.2f} s auf {nt:.2f} s verschoben (vorige endet {prev_end:.2f} s)")
            t = nt
        a, b = int(max(0, s["start"] - pre) * sr), int(min(len(src) / sr, s["end"] + post) * sr)
        clip = src[a:b].copy()
        clip[:fade] *= np.linspace(0, 1, fade)
        clip[-fade:] *= np.linspace(1, 0, fade)
        o = int((t - pre) * sr)
        e = min(len(out), o + len(clip))
        out[o:e] += clip[: e - o]
        shift = t - s["start"]
        for w in wl:
            if w["start"] >= s["start"] - 1e-3 and w["end"] <= s["end"] + 1e-3:
                placed.append({"word": w["word"], "start": round(w["start"] + shift, 3), "end": round(w["end"] + shift, 3), "line": i})
        prev_end = s["end"] + shift
        print(f"Zeile {i + 1:2d}: {t:5.2f} – {prev_end:5.2f} s  {s['text']}")
    if prev_end > DUR - 0.5:
        sys.exit(f"Sprecher endet zu spät ({prev_end:.2f} s)")
    sf.write(D / "voice-placed.wav", out, sr)
    (D / "voice-placed.json").write_text(json.dumps(placed, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Fertig: public/launch/voice-placed.wav ({DUR:.0f} s) + voice-placed.json ({len(placed)} Wörter)")


if __name__ == "__main__":
    main()
