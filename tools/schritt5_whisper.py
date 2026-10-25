#!/usr/bin/env python3
"""Schritt 5: Wortzeiten mit Whisper messen und nach video/src/timing-whisper.json schreiben.

Voraussetzung: Schritt 4 ist durch (audio/sprache/*.mp3) und `pip install openai-whisper`.
Das Whisper-Modell wird beim ersten Lauf von openaipublic.azureedge.net geladen.

Aufrufe:
  python3 tools/schritt5_whisper.py                 # misst alle Sprachdateien, Modell "small"
  python3 tools/schritt5_whisper.py --modell medium

Ablauf:
- Die Untertitel-Häppchen und SHOW_MOBILEDE kommen aus video/src/timing.ts (eine Quelle für Text und Video).
- Whisper liefert je Datei die Wortzeiten; die Häppchen werden über den bekannten Skripttext darauf abgebildet.
- Die Szenen werden so verteilt, dass jede Sprachzeile hineinpasst, der Musikbruch (29–32 s) möglichst
  bleibt und das Video 85 s lang ist. Die Sprache liegt wie in video/src/AudioLayer.tsx:
  Beginn 0,3 s nach Szenenstart, 0,25 s Pause zwischen den Zeilen einer Szene.
"""
import argparse
import difflib
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from schritt4_audio import ZEILEN, dauer  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SPRACHE = ROOT / "audio" / "sprache"
TIMING_TS = ROOT / "video" / "src" / "timing.ts"
ZIEL = ROOT / "video" / "src" / "timing-whisper.json"

# Gleiche Abstände wie AudioLayer.tsx und estimateCaptions() in timing.ts.
VORLAUF, PAUSE, NACHLAUF = 0.3, 0.25, 0.3
GESAMT, SCHLUSS = 85.0, 4.0
# Szenengruppen zwischen festen Ankern der Musik (29 s Bruch, 32 s hell, Schluss ab 81 s).
GRUPPEN = [
    (["s1", "s2a", "s2b", "s2c"], 0.0, 29.0),
    (["s3"], 29.0, 32.0),
    (["s4a", "s4b", "s4c", "s5", "s6"], 32.0, GESAMT - SCHLUSS),
]
SCHAETZUNG = {"s1": 6, "s2a": 8, "s2b": 10, "s2c": 5, "s3": 3, "s4a": 5, "s4b": 13, "s4c": 7, "s5": 11, "s6": 13}


def lies_timing_ts():
    """Liest LINES (Szene, Sprecher, Häppchen, optional) und SHOW_MOBILEDE aus timing.ts."""
    ts = TIMING_TS.read_text()
    zeigen = re.search(r"export const SHOW_MOBILEDE = (true|false);", ts).group(1) == "true"
    zeilen = []
    for m in re.finditer(r"\{scene: '(\w+)', speaker: '([EM])',( optional: true,)? chunks: \[(.*?)\]\}", ts):
        chunks = re.findall(r"'((?:[^'\\]|\\.)*)'", m.group(4))
        zeilen.append({"szene": m.group(1), "sprecher": m.group(2), "optional": bool(m.group(3)), "chunks": chunks})
    if len(zeilen) != len(ZEILEN):
        sys.exit(f"timing.ts hat {len(zeilen)} Zeilen, schritt4_audio.py {len(ZEILEN)}.")
    for z, (name, wer, text) in zip(zeilen, ZEILEN):
        if " ".join(z["chunks"]) != text or z["sprecher"] != wer:
            sys.exit(f"Text in timing.ts weicht vom Skript ab: {name}")
        z["datei"] = SPRACHE / f"{name}.mp3"
    return zeilen, zeigen


def norm(s):
    return re.sub(r"[^0-9a-zäöüß]", "", s.lower())


def haeppchen_zeiten(chunks, woerter, laenge):
    """Bildet die Häppchen über den Zeichenstrom auf Whisper-Wörter ab: [(von, bis)] relativ zur Datei."""
    s, bereiche = "", []
    for c in chunks:
        bereiche.append((len(s), len(s) + len(norm(c))))
        s += norm(c)
    w, wort_von_zeichen = "", []
    for i, wort in enumerate(woerter):
        n = norm(wort["word"])
        w += n
        wort_von_zeichen += [i] * len(n)
    abbild = {}
    for a, b, n in difflib.SequenceMatcher(None, s, w, autojunk=False).get_matching_blocks():
        for k in range(n):
            abbild[a + k] = wort_von_zeichen[b + k]
    zeiten = []
    for i, (a, b) in enumerate(bereiche):
        treffer = [abbild[k] for k in range(a, b) if k in abbild]
        if treffer:
            zeiten.append((woerter[treffer[0]]["start"], woerter[treffer[-1]]["end"]))
        else:
            # Nicht erkannt: nach Zeichenanteil schätzen.
            zeiten.append((laenge * a / max(len(s), 1), laenge * b / max(len(s), 1)))
            print(f"Warnung: „{chunks[i]}“ nicht erkannt, Zeit geschätzt.")
    return zeiten


def verteile(szenen, start, ende, bedarf):
    """Verteilt [start, ende] auf die Szenen: jede bekommt ihren Bedarf plus Anteil am Rest."""
    noetig = sum(bedarf[s] for s in szenen)
    rest = (ende - start) - noetig
    if rest < 0:
        print(f"Warnung: {', '.join(szenen)} brauchen {noetig:.2f} s statt {ende - start:.2f} s, alles danach rückt.")
        rest = 0.0
    gewicht = sum(SCHAETZUNG[s] for s in szenen)
    out, t = {}, start
    for s in szenen:
        d = bedarf[s] + rest * SCHAETZUNG[s] / gewicht
        out[s] = [round(t, 3), round(t + d, 3)]
        t += d
    return out, t


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--modell", default="small", help="Whisper-Modell (tiny, base, small, medium, large-v3)")
    a = p.parse_args()

    zeilen, zeigen = lies_timing_ts()
    zeilen = [z for z in zeilen if zeigen or not z["optional"]]
    fehlt = [str(z["datei"].relative_to(ROOT)) for z in zeilen if not z["datei"].exists()]
    if fehlt:
        sys.exit("Sprachdateien fehlen (erst Schritt 4): " + ", ".join(fehlt))

    import whisper
    modell = whisper.load_model(a.modell)
    for z in zeilen:
        z["laenge"] = dauer(z["datei"])
        text = " ".join(z["chunks"])
        r = modell.transcribe(str(z["datei"]), language="de", word_timestamps=True, initial_prompt=text)
        woerter = [w for seg in r["segments"] for w in seg.get("words", [])]
        z["zeiten"] = haeppchen_zeiten(z["chunks"], woerter, z["laenge"])
        print(f"ok  {z['datei'].name}: {z['laenge']:.2f} s, {len(woerter)} Wörter")

    # Bedarf je Szene: Vorlauf, alle Zeilen mit Pausen, Nachlauf.
    bedarf = {s: VORLAUF + NACHLAUF for s in SCHAETZUNG}
    anzahl = {}
    for z in zeilen:
        bedarf[z["szene"]] += z["laenge"] + (PAUSE if anzahl.get(z["szene"]) else 0)
        anzahl[z["szene"]] = anzahl.get(z["szene"], 0) + 1

    szenen, t = {}, 0.0
    for gruppe, start, ende in GRUPPEN:
        teil, t = verteile(gruppe, max(start, t), max(ende, t), bedarf)
        szenen.update(teil)
    szenen["end"] = [round(t, 3), round(max(GESAMT, t + SCHLUSS), 3)]

    # Untertitel auf die Zeitachse legen, so wie AudioLayer.tsx die Sprache platziert.
    captions, cursor = [], {}
    for z in zeilen:
        von = cursor.get(z["szene"], szenen[z["szene"]][0] + VORLAUF)
        for text, (a0, b0) in zip(z["chunks"], z["zeiten"]):
            captions.append({"text": text, "from": round(von + a0, 3), "to": round(von + b0, 3), "speaker": z["sprecher"]})
        cursor[z["szene"]] = von + z["laenge"] + PAUSE
    captions.sort(key=lambda c: c["from"])
    # Ein Untertitel bleibt bis zum nächsten stehen, höchstens 0,4 s nach dem letzten Wort.
    for c, n in zip(captions, captions[1:] + [None]):
        c["to"] = round(min(c["to"] + 0.4, n["from"]) if n else c["to"] + 0.4, 3)

    daten = {"quelle": f"Whisper {a.modell}, gemessen aus audio/sprache", "mobilede": zeigen,
             "scenes": szenen, "captions": captions}
    ZIEL.write_text(json.dumps(daten, ensure_ascii=False, indent="\t") + "\n")
    print(f"geschrieben: {ZIEL.relative_to(ROOT)} ({len(captions)} Untertitel, {szenen['end'][1]:.1f} s)")


if __name__ == "__main__":
    main()
