---
description: Erzeugt die Sprecherstimme und das Wort-Timing aus skript.txt
argument-hint: "[optional: ruhiger | energischer | schneller | langsamer]"
---
Erzeuge die Stimme für das Video. Wunsch des Nutzers (optional): $ARGUMENTS

1. Wenn `public/sprecher.mp3` existiert: keine KI-Stimme erzeugen, direkt zu Schritt 3.
2. Sonst `tools/voice.py` mit der venv-Python ausführen. Passe die Optionen an den Wunsch an:
   - energischer → `--energie 0.85 --tempo 0.3`, ruhiger → `--energie 0.45 --tempo 0.5`
   - schneller → `--tempo 0.25 --pause 0.06`, langsamer → `--tempo 0.6 --pause 0.2`
   - Standard: `--energie 0.7 --tempo 0.4`
   Beim ersten Mal lädt Chatterbox das Modell (~3 GB) – vorher kurz Bescheid sagen.
3. `tools/timing.py` ausführen (Whisper, Modell medium; auf schwachen PCs ohne Grafikkarte `--modell small`).
4. `npm run timeline` – prüfe in der Ausgabe, dass „Timing: whisper“ steht.
5. Prüfe `public/voice-words.json` grob gegen `skript.txt`: Fehlen viele Wörter oder klingt etwas falsch, sag es dem Nutzer und biete an, die betroffene Zeile neu zu erzeugen.
6. Sag dem Nutzer: Stimme anhören unter `public/voice.wav`, dann `/video`.
