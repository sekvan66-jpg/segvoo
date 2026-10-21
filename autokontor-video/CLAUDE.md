# AutoKontor Werbevideo – Projektanleitung für Claude Code

Dieses Projekt erzeugt einen Kinetic-Typography-Werbespot (Stil: virale TikTok-Edits, schwarz/rot/weiß, Glitch, Stretch, Morph, harte Schnitte) für die Händlersoftware **AutoKontor**. Der Nutzer heißt Segvan, spricht Deutsch und ist kein Programmierer: antworte immer auf Deutsch, kurz und ohne Fachchinesisch. Er arbeitet auf Windows.

## Ablauf (Pipeline)
1. `skript.txt` – Sprechertext + Storyboard. Eine Zeile = ein Bild: `effekt | Text`.
2. `tools/voice.py` – Chatterbox Multilingual (Deutsch) spricht jede Zeile → `public/voice.wav` + `public/voice-segments.json`. Klont `public/meine-stimme.wav`, falls vorhanden. Alternativ legt der Nutzer `public/sprecher.mp3` ab (z. B. ElevenLabs) – dann voice.py überspringen.
   **Offline-Alternative:** `tools/voice_offline.py` – Coqui-TTS „Thorsten“ (deutsche Männerstimme, läuft ohne Internet). Liefert Stimme **und** exaktes Wort-Timing direkt aus dem Modell → Schritt 3 entfällt. Aussprache schwieriger Wörter (PC, GoBD, ZUGFeRD …) steht in `aussprache.txt` (Text oder Lautschrift `/…/`). Einmalig: `pip install "coqui-tts[codec]" "gruut[de]"`; das Modell (~330 MB) lädt das Skript selbst nach `models/`.
   **Realistischere Offline-Stimme (empfohlen):** `tools/voice_piper.py [--fassung name]` – Piper „Thorsten high“ (CC0, werbetauglich), Sätze am Stück mit natürlicher Betonung, exaktes Wort-Timing aus dem Modell, Studio-Bearbeitung (EQ, Kompressor). Aussprache: `aussprache-piper.txt`. Stimmen lädt das Skript von GitHub nach `models/piper/`. Einmalig: `pip install piper-tts onnx`.
3. `tools/timing.py` – Whisper ermittelt die Zeit jedes Worts → `public/voice-words.json`.
4. `tools/build-timeline.mjs` (`npm run timeline`) – baut `src/data/timeline.json` aus Skript + Timing. Ohne Audio wird das Timing geschätzt (nur Vorschau).
5. Remotion rendert: `npm run render` (1080x1920 TikTok) / `npm run render:yt` (1920x1080) / `npm run render:alle`.
6. Qualitätskontrolle: `npm run check` → Standbilder in `out/check/` – **immer ansehen** (Read-Tool) bevor du final renderst.

Python immer aus der venv: Windows `.venv\Scripts\python`, Mac/Linux `.venv/bin/python`.

## Fassungen und Stile
- Fassung = `skript-<name>.txt` → Stimme in `public/<name>/` → `src/data/timeline-<name>.json` (`node tools/build-timeline.mjs <name>`), Komposition in `src/Root.tsx` eintragen. Ohne Name: `skript.txt` (Erklärvideo, ~56 s).
- Vorhanden: Erklärvideo (`AutoKontorYouTube`/`AutoKontorTikTok`), `tiktok30` (`AutoKontorTikTok30`), `premium30` (`AutoKontorPremium30`).
- Skript-Kopf steuert pro Fassung: `# stil: premium` (sonst TikTok-Glitch-Stil), `# musik: musik-hell.mp3`, `# stimme: tiktok30` (Stimme einer anderen Fassung mit gleichem Text übernehmen).
- **Premium-Stil** (`src/premium/`): heller Look nach Referenzvideo – glänzende orange Kugeln (`Orb`), Bokeh-Hintergrund (`Stage`), Schlagzeile mit kursiven Akzentwörtern (`Headline`, `*Wort*`), 3D-Karten. Eine Szene pro Effekt-Name (`PREMIUM_EFFECTS`), Sounds in `SFX_PREMIUM` (Spot.tsx), weiche SFX aus `tools/sounds.py`, Musik `tools/beat.py --stil hell`.

## Code-Struktur
- `src/theme.ts` – Markenname, Slogan, Button-Text, Preis + „zzgl. MwSt.“, Farben, Schriften. Texte im Endbild hier ändern.
- `src/Spot.tsx` – Zusammenbau: Bilder, Kamera-Punch, Filmkorn/Vignette, Sound (Stimme, Musik, SFX).
- `src/effects/text.tsx` – slam, glitch, stretch, flash, morph, type.
- `src/effects/scenes.tsx` – laptop, lock, os, doc, preis, end.
- `src/lib.tsx` – Wort-Timing, Zeilenumbruch, automatische Schriftgröße, Kamerawackler.
- `public/fonts` – Schriften lokal (Anton, Inter, JetBrains Mono). `public/sfx` – impact/whoosh/glitch.
- Optional in `public/`: `screenshot.png` (echte Software im Laptop), `musik.mp3`, `meine-stimme.wav`, `sprecher.mp3`.
- `tools/beat.py` – erzeugt einen lizenzfreien Trap-Beat (150 BPM) als `public/musik.mp3`; eigene Musik einfach darüber ablegen.
- Dynamik (Spot.tsx `BeatView`): Wisch-Übergang + Blitz bei jedem Schnitt, Kamera-Kick auf jedem Wort. Kurze Skript-Zeilen (1–4 Wörter) = mehr Schnitte = mehr Tempo.

## Regeln
- Jedes Wort muss exakt zu seinem gesprochenen Zeitpunkt erscheinen – Timing nie per Hand in timeline.json ändern, sondern über die Pipeline neu bauen.
- Nach jeder Änderung an Skript, Effekten oder Layout: `npm run check` und die Standbilder prüfen: kein Text abgeschnitten oder am Rand klebend, alles lesbar, Look wirkt wie ein Premium-Edit.
- Preise immer mit Hinweis „zzgl. MwSt.“ im Bild (Bild `preis` und Endbild machen das automatisch).
- In `skript.txt` markiert `*Wort*` ein Wort rot (Effekt `type`); die Sternchen werden nicht gesprochen.
- Keine fremden Logos (Windows/Apple/Linux) und keine fremden Marken – eigene, schlichte Icons.
- Neue Effekte: als Komponente in `src/effects/` anlegen, in `EFFECTS` (Spot.tsx), `SFX_FOR` und in `tools/build-timeline.mjs` (EFFECTS-Liste) eintragen und in `skript.txt` dokumentieren.
- Remotion-Skills sind installiert (`npx skills add remotion-dev/skills`) – nutze sie bei Fragen zu Remotion.
- Rendern auf schwachen PCs: `--concurrency 2` anhängen, wenn der Rechner hängt.
- Lizenz-Hinweis: Remotion ist kostenlos für Einzelpersonen und Firmen bis 3 Mitarbeiter, darüber braucht es eine Firmenlizenz.
