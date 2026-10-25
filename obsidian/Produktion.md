# Produktion: „Mehmet und der Zettelberg“

Arbeitsweise: 7 Schritte. Nach jedem Schritt auf das OK warten. Auf Deutsch kommunizieren, Antworten kurz halten.
Regeln: keine erfundenen Fakten, keine urheberrechtlich geschützte Musik oder Bilder, nichts ohne OK veröffentlichen, den API-Schlüssel nie im Chat ausgeben.

| Schritt | Stand |
|---|---|
| 1 Briefing | ✅ `obsidian/Briefing.md` |
| 2 Fragen | ✅ alle Entscheidungen im Briefing |
| 3 Skript | ✅ freigegeben, `obsidian/Skript.md` |
| 4 Stimme und Musik | ⏳ Skript fertig (`tools/schritt4_audio.py`), Erzeugung wartet auf Schlüssel und Netzfreigabe |
| 5 Wortzeiten (Whisper) | ⏳ Skript fertig (`tools/schritt5_whisper.py`), wartet auf Schritt 4 und Netzfreigabe |
| 6 Video bauen (Remotion) | ✅ `video/`, Zeiten vorerst geschätzt, Tonspuren vorbereitet |
| 7 Rendern (MP4, 9:16) | ⏳ stumme Vorschau gerendert (85 s, 1080×1920); endgültige Fassung nach Schritt 4 und 5 |

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

## Schritt 4 und 5: zweiter Versuch (2026-10-25)
- Wieder blockiert: `ELEVENLABS_API_KEY` ist nicht gesetzt, `api.elevenlabs.io` und `openaipublic.azureedge.net` lehnt die Netzwerkregel ab (403). Ohne Sprachdateien gibt es nichts zu messen; `video/src/timing-whisper.json` bleibt leer, das Video nutzt die geschätzten Zeiten.
- Neu: `tools/schritt5_whisper.py` misst die Wortzeiten mit Whisper (`pip install openai-whisper`, Modell `small`, umstellbar mit `--modell`) und schreibt Szenen und Untertitel nach `video/src/timing-whisper.json`.
  - Text und `SHOW_MOBILEDE` liest es aus `video/src/timing.ts`; weicht der Text vom Skript ab, bricht es ab.
  - Szenen werden zwischen den Musik-Ankern verteilt (Bruch 29–32 s, Schluss ab 81 s, Gesamtlänge 85 s). Passt die Sprache nicht hinein, rückt alles danach und es kommt eine Warnung.
  - Offline mit stillen Platzhalterdateien getestet, die echte Messung steht noch aus.
- Ablauf in einer Sitzung mit Schlüssel und Netz:
  1. `python3 tools/schritt4_audio.py alles`
  2. `python3 tools/schritt4_audio.py sprache --erzaehler E1 --mehmet M1`
  3. `pip install openai-whisper && python3 tools/schritt5_whisper.py`
  4. `cd video && npm install && npm run render`

## Schritt 6/7: Stand (2026-10-25)
- Remotion-Projekt in `video/`: alle Szenen als Motion Graphics, Untertitel, App-Nachbau mit erfundenen Beispieldaten, Logo als vereinfachte Nachbildung.
- mobile.de-Zeile ist ausgeblendet (`SHOW_MOBILEDE = false` in `video/src/timing.ts`), solange der Knopf nicht getestet ist.
- Zeiten: Schätzungen aus dem Skript. Schritt 5 schreibt gemessene Zeiten nach `video/src/timing-whisper.json`, die dann Vorrang haben.
- Ton: `npm run render` kopiert vorhandene Dateien aus `audio/` und legt Sprache, Musik und SFX automatisch an. Fehlt eine Datei, bleibt die Stelle still.
- Rendern: `cd video && npm install && npm run render` → `video/out/mehmet_und_der_zettelberg.mp4` (nicht im Repo). Ohne heruntergeladenen Browser: `REMOTION_BROWSER=<Pfad zu chrome-headless-shell>` setzen.
- Die Vorschau ist nicht veröffentlicht.

## Schritt 6: Qualitätsschub (2026-10-25)
Wunsch: Qualität wie das revid.ai-Beispiel „Claude Motion Graphics“. Die Seite war aus der Umgebung nicht erreichbar, umgesetzt sind die typischen Merkmale solcher Clips:
- Kamera: langsamer Push-in mit leichtem Schweben je Szene, Szenenwechsel als Zoom-Blur statt harter Schnitte, Lichtblitz zur Wende (`video/src/Video.tsx`).
- Licht und Tiefe: Lampen-Lichtkegel, Staub- und Bokeh-Partikel, unscharfe Vordergrund-Blätter, Vignette, Filmkorn, wandernde Farbflächen in den App-Szenen (`video/src/components/fx.tsx`).
- Schrift: Überschriften gleiten wortweise aus einer Maske, im Markenverlauf Blau–Violett.
- Untertitel im TikTok-Stil: Wort für Wort, das gesprochene Wort leuchtet gelb (Mehmet: lila).
- App-Teile fliegen in 3D herein (Kippen aus der Tiefe), Klick-Wellen, Lichtschimmer über Logo und PDFs.
- Schluss: Logo mit Glow, pulsierenden Ringen und Lichtschimmer.

## Datenschutz
Die Screenshots der App dienen nur als Vorlage und kommen nicht ins Repo (es ist öffentlich). Im Video stehen nur erfundene Beispieldaten.
