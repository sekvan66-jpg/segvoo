@echo off
chcp 65001 >nul
title AutoKontor Video - Stimme
cd /d "%~dp0"
if exist public\sprecher.mp3 (
  echo public\sprecher.mp3 gefunden - nutze diese Aufnahme statt KI-Stimme.
) else (
  call .venv\Scripts\python tools\voice.py || goto fehler
)
call .venv\Scripts\python tools\timing.py || goto fehler
call node tools\build-timeline.mjs
echo.
echo  FERTIG. Anhoeren: public\voice.wav  -  Naechster Schritt: 3-VIDEO.bat
pause
exit /b
:fehler
echo FEHLER. Oeffne Claude Code in diesem Ordner und tippe:  /stimme
pause
