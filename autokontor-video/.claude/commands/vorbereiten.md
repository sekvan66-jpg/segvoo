---
description: Richtet alles für das AutoKontor-Video ein (Node, Python, ffmpeg, Remotion, Stimme, Whisper)
---
Richte dieses Projekt komplett ein und erkläre dem Nutzer am Ende auf Deutsch in 3–5 Sätzen, was fertig ist.

1. Prüfe, ob Node.js (≥ 20), Python 3.11 (`py -3.11 --version` auf Windows) und ffmpeg vorhanden sind. Fehlt etwas, installiere es auf Windows mit winget (`OpenJS.NodeJS.LTS`, `Python.Python.3.11`, `Gyan.FFmpeg`). Wenn danach ein neues Terminal nötig ist, sag das klar.
2. `npm install`
3. Remotion-Skills installieren: `npx skills add remotion-dev/skills` (bei Rückfragen Claude Code als Ziel wählen).
4. Python-Umgebung `.venv` mit Python 3.11 anlegen (falls nicht vorhanden).
5. Wenn `nvidia-smi` existiert: zuerst `torch==2.6.0 torchaudio==2.6.0` von `https://download.pytorch.org/whl/cu124` installieren.
6. `pip install chatterbox-tts openai-whisper` in der venv.
7. `npm run timeline`, dann `npm run check` und 3–4 der Standbilder aus `out/check/` ansehen, um zu prüfen, dass das Rendern funktioniert.
8. Sag dem Nutzer, welche Dateien er optional in `public/` legen kann: `meine-stimme.wav` (15–20 s eigene Stimme), `screenshot.png` (Software), `musik.mp3`, oder `sprecher.mp3` (fertige Sprachaufnahme). Nächster Befehl: `/stimme`.

Bei Fehlern: Ursache selbst beheben, nicht nur melden.
