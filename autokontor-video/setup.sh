#!/usr/bin/env bash
# Setup für Mac/Linux (Windows: 1-SETUP.bat)
set -e
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Bitte Node.js 20+ installieren"; exit 1; }
command -v ffmpeg >/dev/null || { echo "Bitte ffmpeg installieren"; exit 1; }
PY=$(command -v python3.11 || command -v python3)
npm install
[ -d .venv ] || $PY -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install chatterbox-tts openai-whisper
node tools/build-timeline.mjs
echo "Fertig. Weiter: .venv/bin/python tools/voice.py && .venv/bin/python tools/timing.py && npm run render:alle"
