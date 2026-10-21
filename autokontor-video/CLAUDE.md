# AutoKontor Werbevideo – Projektanleitung für Claude Code

Dieses Projekt erzeugt einen Kinetic-Typography-Werbespot (Stil: virale TikTok-Edits, schwarz/rot/weiß, Glitch, Stretch, Morph, harte Schnitte) für die Händlersoftware **AutoKontor**. Der Nutzer heißt Segvan, spricht Deutsch und ist kein Programmierer: antworte immer auf Deutsch, kurz und ohne Fachchinesisch. Er arbeitet auf Windows.

## Ablauf (Pipeline)
1. `skript.txt` – Sprechertext + Storyboard. Eine Zeile = ein Bild: `effekt | Text`.
2. `tools/voice.py` – Chatterbox Multilingual (Deutsch) spricht jede Zeile → `public/voice.wav` + `public/voice-segments.json`. Klont `public/meine-stimme.wav`, falls vorhanden. Alternativ legt der Nutzer `public/sprecher.mp3` ab (z. B. ElevenLabs) – dann voice.py überspringen.
3. `tools/timing.py` – Whisper ermittelt die Zeit jedes Worts → `public/voice-words.json`.
4. `tools/build-timeline.mjs` (`npm run timeline`) – baut `src/data/timeline.json` aus Skript + Timing. Ohne Audio wird das Timing geschätzt (nur Vorschau).
5. Remotion rendert: `npm run render` (1080x1920 TikTok) / `npm run render:yt` (1920x1080) / `npm run render:alle`.
6. Qualitätskontrolle: `npm run check` → Standbilder in `out/check/` – **immer ansehen** (Read-Tool) bevor du final renderst.

Python immer aus der venv: Windows `.venv\Scripts\python`, Mac/Linux `.venv/bin/python`.

## Code-Struktur
- `src/theme.ts` – Markenname, Slogan, Button-Text, Farben, Schriften. Texte im Endbild hier ändern.
- `src/Spot.tsx` – Zusammenbau: Bilder, Kamera-Punch, Filmkorn/Vignette, Sound (Stimme, Musik, SFX).
- `src/effects/text.tsx` – slam, glitch, stretch, flash, morph, type.
- `src/effects/scenes.tsx` – laptop, lock, os, end.
- `src/lib.tsx` – Wort-Timing, Zeilenumbruch, automatische Schriftgröße, Kamerawackler.
- `public/fonts` – Schriften lokal (Anton, Inter, JetBrains Mono). `public/sfx` – impact/whoosh/glitch.
- Optional in `public/`: `screenshot.png` (echte Software im Laptop), `musik.mp3`, `meine-stimme.wav`, `sprecher.mp3`.

## Regeln
- Jedes Wort muss exakt zu seinem gesprochenen Zeitpunkt erscheinen – Timing nie per Hand in timeline.json ändern, sondern über die Pipeline neu bauen.
- Nach jeder Änderung an Skript, Effekten oder Layout: `npm run check` und die Standbilder prüfen: kein Text abgeschnitten oder am Rand klebend, alles lesbar, Look wirkt wie ein Premium-Edit.
- Keine fremden Logos (Windows/Apple/Linux) und keine fremden Marken – eigene, schlichte Icons.
- Neue Effekte: als Komponente in `src/effects/` anlegen, in `EFFECTS` (Spot.tsx), `SFX_FOR` und in `tools/build-timeline.mjs` (EFFECTS-Liste) eintragen und in `skript.txt` dokumentieren.
- Remotion-Skills sind installiert (`npx skills add remotion-dev/skills`) – nutze sie bei Fragen zu Remotion.
- Rendern auf schwachen PCs: `--concurrency 2` anhängen, wenn der Rechner hängt.
- Lizenz-Hinweis: Remotion ist kostenlos für Einzelpersonen und Firmen bis 3 Mitarbeiter, darüber braucht es eine Firmenlizenz.
