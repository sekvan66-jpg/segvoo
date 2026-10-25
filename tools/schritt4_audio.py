#!/usr/bin/env python3
"""Schritt 4: Stimme, Musik und Soundeffekte über ElevenLabs.

Der Schlüssel kommt nur aus der Umgebungsvariable ELEVENLABS_API_KEY und wird nie ausgegeben.

Aufrufe:
  python3 tools/schritt4_audio.py proben            # 3 Erzähler- und 2 Mehmet-Hörproben
  python3 tools/schritt4_audio.py musik             # Musikspur, ca. 85 s
  python3 tools/schritt4_audio.py sfx               # Soundeffekte laut Skript
  python3 tools/schritt4_audio.py sprache --erzaehler E1 --mehmet M1
                                                    # alle Skriptzeilen mit den gewählten Stimmen
  python3 tools/schritt4_audio.py alles             # proben + musik + sfx
  --dry-run zeigt nur, was angefragt würde (kein Schlüssel nötig).

Ausgabe in audio/ plus audio/manifest.json (Stimmen, Dateien, Längen).
"""
import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

API = "https://api.elevenlabs.io"
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "audio"
TTS_MODEL = "eleven_multilingual_v2"
FORMAT = "mp3_44100_128"

# Stimmen aus der ElevenLabs-Standardbibliothek; eleven_multilingual_v2 spricht damit Deutsch.
# Auswahl über die IDs, die Namen dienen nur der Lesbarkeit.
ERZAEHLER = {
    "E1": {"name": "Daniel", "id": "onwK4e9ZLuTAKqWW03F9", "art": "ruhig, sachlich"},
    "E2": {"name": "George", "id": "JBFqnCBsd6RMkjVDRZzb", "art": "warm, erzählend"},
    "E3": {"name": "Brian", "id": "nPczCjzI2devNBz1zQrb", "art": "tief, vertrauensvoll"},
}
MEHMET = {
    "M1": {"name": "Liam", "id": "TX3LPaxmHKxFdv7VOQHJ", "art": "jung, nahbar"},
    "M2": {"name": "Chris", "id": "iP95p4xoKVk53GoZ742B", "art": "locker, natürlich"},
}

# Einfühlsam erzählen (Szenen 1–3), Mehmet leise und müde.
SETTINGS_ERZAEHLER = {"stability": 0.5, "similarity_boost": 0.75, "style": 0.2, "use_speaker_boost": True}
SETTINGS_MEHMET = {"stability": 0.4, "similarity_boost": 0.75, "style": 0.35, "use_speaker_boost": True}

PROBE_ERZAEHLER = "Mehmet verkauft gute Autos. Und trotzdem hat er jede Nacht Angst vor dem Briefkasten."
PROBE_MEHMET = "Ich arbeite mehr als alle und habe trotzdem nichts im Griff."

# Sprechertext wörtlich aus obsidian/Skript.md (freigegeben). Die mobile.de-Zeile ist eine eigene Datei,
# damit sie ohne Neuaufnahme wegfallen kann, falls der Knopf bis zur Veröffentlichung nicht getestet ist.
ZEILEN = [
    ("01_hook", "E", "Mehmet verkauft gute Autos. Und trotzdem hat er jede Nacht Angst vor dem Briefkasten."),
    ("02a_problem", "E", "Das Finanzamt will Belege sehen. Mehmet findet sie nicht. Rechnungen in der Schublade, "
                         "Verträge im Handschuhfach, der Rest im Kopf."),
    ("02b_problem", "E", "Beim Einkauf ist er zu langsam. Der andere Händler schnappt sich das Auto. "
                         "Und was genau er im Bestand hat, weiß er nur ungefähr."),
    ("02c_mehmet", "M", "Ich arbeite mehr als alle und habe trotzdem nichts im Griff."),
    ("03_tiefpunkt", "E", "So kann es nicht weitergehen."),
    ("04a_wende", "E", "Dann findet er DB-Automobile. Alles auf Deutsch, alles an einem Ort."),
    ("04b1_funktionen", "E", "Fahrzeug anlegen, Fotos dazu. Kaufvertrag als PDF, mit einem Klick. "
                             "Rechnungen, auch als E-Rechnung."),
    ("04b2_mobilede_OPTIONAL", "E", "Ein Auto von mobile.de? Ein Klick, und es ist mit Fotos im Bestand."),
    ("04b3_fahrzeugcheck", "E", "Fahrgestellnummer eingeben, Fahrzeug-Check als PDF."),
    ("04c_sicherheit", "E", "Rechnungen werden gesperrt und protokolliert, Sicherungen laufen jeden Tag automatisch. "
                            "Und per Google-Konto hat er alles auch auf dem Handy."),
    ("05a_happyend", "E", "Mehmet kauft schneller ein, weil er seinen Bestand sieht. "
                          "Und als der nächste Brief kommt, hat er die Unterlagen in Sekunden."),
    ("05b_mehmet", "M", "Zum ersten Mal schlafe ich gut."),
    ("06_ehrlich", "E", "Fair gesagt: DB-Automobile ersetzt keinen Steuerberater. Der Fahrzeug-Check zeigt bei "
                        "EU-Autos oft nur Hersteller und Basisdaten, Rückrufdaten kommen nur aus den USA. "
                        "Ein voller Verlaufsbericht, etwa bei carVertical, kostet Geld. "
                        "Dafür: einfach, deutsch, für kleine Händler."),
]

# Musik: ca. 85 s, nachdenklich bis Szene 3, Bruch mit kurzer Stille, ab Szene 4 hell und optimistisch.
MUSIK_PLAN = {
    "positive_global_styles": ["instrumental", "modern explainer video score", "soft piano", "light synth pads"],
    "negative_global_styles": ["vocals", "lyrics", "aggressive drums", "dramatic orchestral"],
    "sections": [
        {"section_name": "Nacht und Zettelberg", "duration_ms": 29000, "lines": [],
         "positive_local_styles": ["thoughtful", "melancholic", "sparse piano", "slow tempo", "subtle tension"],
         "negative_local_styles": ["upbeat", "bright"]},
        {"section_name": "Tiefpunkt", "duration_ms": 3000, "lines": [],
         "positive_local_styles": ["music stops abruptly", "near silence", "single fading note"],
         "negative_local_styles": ["drums", "melody"]},
        {"section_name": "Wende", "duration_ms": 25000, "lines": [],
         "positive_local_styles": ["bright", "optimistic", "energetic", "plucky synths", "light percussion",
                                   "medium-fast tempo"],
         "negative_local_styles": ["sad", "dark"]},
        {"section_name": "Happy End", "duration_ms": 11000, "lines": [],
         "positive_local_styles": ["warm", "uplifting", "relieved", "full but gentle"],
         "negative_local_styles": ["dark"]},
        {"section_name": "Ehrlich bleiben und Schluss", "duration_ms": 17000, "lines": [],
         "positive_local_styles": ["calm", "friendly", "steady", "quiet under narration", "clean ending"],
         "negative_local_styles": ["loud", "dramatic"]},
    ],
}
MUSIK_PROMPT_FALLBACK = (
    "Instrumental explainer video score, about 85 seconds, no vocals. First 29 seconds thoughtful and "
    "melancholic with sparse piano; at 29 seconds the music stops abruptly for about 3 seconds of near silence; "
    "from 32 seconds bright, optimistic and energetic with plucky synths and light percussion; "
    "the last 17 seconds calm and friendly under narration with a clean ending."
)

SFX = [
    ("briefkastenklappe", "Metal mailbox flap snapping shut, single sound, indoor", 1.5),
    ("papierrascheln", "Papers rustling and flying off a desk, several sheets", 2.5),
    ("kugelschreiber", "Ballpoint pen writing quickly on paper, close up", 2.5),
    ("motor", "Car engine starting and driving away", 3.0),
    ("klick", "Soft computer mouse click, single click, clean", 0.5),
    ("swoosh", "Clean soft UI swoosh transition", 1.0),
    ("erfolgston", "Short bright positive UI success chime", 1.5),
]


class Client:
    def __init__(self, dry_run):
        self.dry_run = dry_run
        self.key = os.environ.get("ELEVENLABS_API_KEY", "")
        if not dry_run and not self.key:
            sys.exit("ELEVENLABS_API_KEY ist nicht gesetzt (Einstellungen der Umgebung, neue Sitzung).")
        if not dry_run:
            import requests
            self.http = requests.Session()
            self.http.headers["xi-api-key"] = self.key

    def post_audio(self, path, body, ziel, params=None):
        if self.dry_run:
            print(f"[dry-run] POST {path} -> {ziel.relative_to(ROOT)}")
            print("          " + json.dumps(body, ensure_ascii=False)[:300])
            return False
        for versuch in range(4):
            r = self.http.post(API + path, json=body, params=params, timeout=300)
            if r.status_code in (429, 500, 502, 503) and versuch < 3:
                time.sleep(2 ** (versuch + 1))
                continue
            if r.status_code != 200:
                # Antworttext kann Details enthalten, aber nie den Schlüssel.
                raise RuntimeError(f"{path}: HTTP {r.status_code}: {r.text[:500]}")
            ziel.parent.mkdir(parents=True, exist_ok=True)
            ziel.write_bytes(r.content)
            print(f"ok  {ziel.relative_to(ROOT)}")
            return True

    def tts(self, voice_id, text, settings, ziel):
        body = {"text": text, "model_id": TTS_MODEL, "voice_settings": settings}
        return self.post_audio(f"/v1/text-to-speech/{voice_id}", body, ziel, params={"output_format": FORMAT})


def dauer(datei):
    try:
        out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                              "-of", "default=nw=1:nk=1", str(datei)], capture_output=True, text=True, check=True)
        return round(float(out.stdout.strip()), 2)
    except (subprocess.CalledProcessError, ValueError, FileNotFoundError):
        return None


def manifest_update(teil, eintraege):
    datei = OUT / "manifest.json"
    daten = json.loads(datei.read_text()) if datei.exists() else {}
    daten[teil] = eintraege
    datei.parent.mkdir(parents=True, exist_ok=True)
    datei.write_text(json.dumps(daten, ensure_ascii=False, indent=2) + "\n")


def eintrag(ziel, **extra):
    return {"datei": str(ziel.relative_to(ROOT)), "sekunden": dauer(ziel) if ziel.exists() else None, **extra}


def proben(c):
    liste = []
    for key, v in ERZAEHLER.items():
        ziel = OUT / "proben" / f"erzaehler_{key}_{v['name'].lower()}.mp3"
        c.tts(v["id"], PROBE_ERZAEHLER, SETTINGS_ERZAEHLER, ziel)
        liste.append(eintrag(ziel, variante=key, stimme=v["name"], voice_id=v["id"], art=v["art"]))
    for key, v in MEHMET.items():
        ziel = OUT / "proben" / f"mehmet_{key}_{v['name'].lower()}.mp3"
        c.tts(v["id"], PROBE_MEHMET, SETTINGS_MEHMET, ziel)
        liste.append(eintrag(ziel, variante=key, stimme=v["name"], voice_id=v["id"], art=v["art"]))
    if not c.dry_run:
        manifest_update("proben", liste)


def musik(c):
    ziel = OUT / "musik" / "musik_85s.mp3"
    laenge = sum(s["duration_ms"] for s in MUSIK_PLAN["sections"])
    assert laenge == 85000, laenge
    try:
        c.post_audio("/v1/music", {"composition_plan": MUSIK_PLAN, "model_id": "music_v1"}, ziel,
                     params={"output_format": FORMAT})
        art = "composition_plan"
    except RuntimeError as e:
        print(f"Kompositionsplan abgelehnt ({e}); versuche Textbeschreibung.")
        c.post_audio("/v1/music", {"prompt": MUSIK_PROMPT_FALLBACK, "music_length_ms": laenge,
                                   "model_id": "music_v1", "force_instrumental": True}, ziel,
                     params={"output_format": FORMAT})
        art = "prompt"
    if not c.dry_run:
        manifest_update("musik", [eintrag(ziel, erzeugt_mit=art)])


def sfx(c):
    liste = []
    for name, text, sek in SFX:
        ziel = OUT / "sfx" / f"{name}.mp3"
        c.post_audio("/v1/sound-generation", {"text": text, "duration_seconds": sek, "prompt_influence": 0.5},
                     ziel, params={"output_format": FORMAT})
        liste.append(eintrag(ziel, beschreibung=text))
    if not c.dry_run:
        manifest_update("sfx", liste)


def sprache(c, erzaehler, mehmet):
    e, m = ERZAEHLER[erzaehler], MEHMET[mehmet]
    liste = []
    for name, wer, text in ZEILEN:
        v, s = (e, SETTINGS_ERZAEHLER) if wer == "E" else (m, SETTINGS_MEHMET)
        ziel = OUT / "sprache" / f"{name}.mp3"
        c.tts(v["id"], text, s, ziel)
        liste.append(eintrag(ziel, sprecher=wer, stimme=v["name"], text=text,
                             optional=name.endswith("_OPTIONAL")))
    if not c.dry_run:
        manifest_update("sprache", {"erzaehler": erzaehler, "mehmet": mehmet, "zeilen": liste})


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("teil", choices=["proben", "musik", "sfx", "sprache", "alles"])
    p.add_argument("--erzaehler", choices=list(ERZAEHLER), default="E1")
    p.add_argument("--mehmet", choices=list(MEHMET), default="M1")
    p.add_argument("--dry-run", action="store_true")
    a = p.parse_args()
    c = Client(a.dry_run)
    if a.teil in ("proben", "alles"):
        proben(c)
    if a.teil in ("musik", "alles"):
        musik(c)
    if a.teil in ("sfx", "alles"):
        sfx(c)
    if a.teil == "sprache":
        sprache(c, a.erzaehler, a.mehmet)


if __name__ == "__main__":
    main()
