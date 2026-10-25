# Produktion: „Mehmet und der Zettelberg“

Arbeitsweise: 7 Schritte. Nach jedem Schritt auf das OK warten. Auf Deutsch kommunizieren, Antworten kurz halten.
Regeln: keine erfundenen Fakten, keine urheberrechtlich geschützte Musik oder Bilder, nichts ohne OK veröffentlichen, den API-Schlüssel nie im Chat ausgeben.

| Schritt | Stand |
|---|---|
| 1 Briefing | ✅ `obsidian/Briefing.md` |
| 2 Fragen | ✅ alle Entscheidungen im Briefing |
| 3 Skript | ✅ freigegeben, `obsidian/Skript.md` |
| 4 Stimme und Musik | ⏳ Skript fertig (`tools/schritt4_audio.py`), Erzeugung wartet auf Schlüssel und Netzfreigabe |
| 5 Wortzeiten (Whisper) | offen |
| 6 Video bauen (Remotion) | offen |
| 7 Rendern (MP4, 9:16) | offen |

## Schritt 4: Plan
- ElevenLabs-Schlüssel aus der Umgebungsvariable `ELEVENLABS_API_KEY` lesen.
- Freigegebene Domains: `api.elevenlabs.io`, `openaipublic.azureedge.net` (Whisper-Modell).
- 3 deutsche Erzähler-Varianten und 2 Mehmet-Varianten erzeugen, jeweils mit einem Probesatz aus dem Skript.
- 1 Musikspur über ca. 85 s: nachdenklich, Bruch bei Szene 3, ab Szene 4 hell und optimistisch.
- Soundeffekte laut Skript: Briefkastenklappe, Papierrascheln, Kugelschreiber, Motor, Klick, Swoosh, Erfolgston.
- Die mobile.de-Zeile in Szene 4b erst einmal mit aufnehmen und als eigene Datei trennbar halten. Sie kommt nur ins Video, wenn der Knopf getestet ist.
- Die Hörproben anbieten und auf die Auswahl warten.

## Schritt 4: Stand (2026-10-25)
- Blockiert: `ELEVENLABS_API_KEY` ist in der Sitzung nicht gesetzt, und `api.elevenlabs.io` wird von der Netzwerkregel der Umgebung abgelehnt. Beides in den Einstellungen der Umgebung eintragen, dann eine neue Sitzung starten.
- Fertig: `tools/schritt4_audio.py` erzeugt Hörproben, Musik, Soundeffekte und danach alle Skriptzeilen. Getestet mit `--dry-run`, die Texte stimmen wörtlich mit dem Skript überein.
- Stimmen (ElevenLabs-Standardstimmen, Modell `eleven_multilingual_v2`): Erzähler E1 Daniel, E2 George, E3 Brian · Mehmet M1 Liam, M2 Chris.
- Die mobile.de-Zeile wird als eigene Datei `audio/sprache/04b2_mobilede_OPTIONAL.mp3` erzeugt.
- Musik: Kompositionsplan mit 85 s (29 s nachdenklich, 3 s Bruch, ab 32 s hell). Wird der Plan abgelehnt, nimmt das Skript automatisch eine Textbeschreibung.

Ablauf in der neuen Sitzung:
1. `python3 tools/schritt4_audio.py alles` → Proben, Musik und SFX in `audio/`, Übersicht in `audio/manifest.json`
2. Hörproben anbieten, Auswahl abwarten
3. `python3 tools/schritt4_audio.py sprache --erzaehler E? --mehmet M?`

## Datenschutz
Die Screenshots der App dienen nur als Vorlage und kommen nicht ins Repo (es ist öffentlich). Im Video stehen nur erfundene Beispieldaten.
