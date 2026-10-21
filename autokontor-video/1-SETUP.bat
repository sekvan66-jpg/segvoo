@echo off
chcp 65001 >nul
title AutoKontor Video - Setup
cd /d "%~dp0"
echo.
echo  ==========================================
echo   AutoKontor Werbevideo - Einrichtung
echo  ==========================================
echo.
set NEUSTART=0

where node >nul 2>nul || (
  echo [1/3] Node.js fehlt - wird installiert ...
  winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
  set NEUSTART=1
)
py -3.11 --version >nul 2>nul || (
  echo [2/3] Python 3.11 fehlt - wird installiert ...
  winget install -e --id Python.Python.3.11 --accept-source-agreements --accept-package-agreements
  set NEUSTART=1
)
where ffmpeg >nul 2>nul || (
  echo [3/3] ffmpeg fehlt - wird installiert ...
  winget install -e --id Gyan.FFmpeg --accept-source-agreements --accept-package-agreements
  set NEUSTART=1
)
if "%NEUSTART%"=="1" (
  echo.
  echo  Programme wurden installiert. Bitte dieses Fenster schliessen
  echo  und 1-SETUP.bat NOCHMAL starten.
  pause
  exit /b
)

echo Node, Python und ffmpeg sind da.
echo.
echo Installiere Video-Programm (Remotion) ...
call npm install || goto fehler

if not exist .venv (
  echo Erstelle Python-Umgebung ...
  py -3.11 -m venv .venv || goto fehler
)
call .venv\Scripts\python -m pip install --upgrade pip

where nvidia-smi >nul 2>nul && (
  echo NVIDIA-Grafikkarte gefunden - installiere schnelle GPU-Version ...
  call .venv\Scripts\pip install torch==2.6.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cu124
)
echo Installiere Stimme (Chatterbox) und Wort-Timing (Whisper) ...
call .venv\Scripts\pip install chatterbox-tts openai-whisper || goto fehler

call node tools\build-timeline.mjs
echo.
echo  ==========================================
echo   FERTIG. Naechster Schritt: 2-STIMME.bat
echo  ==========================================
pause
exit /b

:fehler
echo.
echo  FEHLER beim Einrichten. Oeffne Claude Code in diesem Ordner
echo  und tippe:  /vorbereiten
pause
