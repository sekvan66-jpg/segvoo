@echo off
chcp 65001 >nul
title AutoKontor Video - Rendern
cd /d "%~dp0"
call npm run render:alle || (echo FEHLER. In Claude Code tippen: /video & pause & exit /b)
echo.
echo  FERTIG:
echo   out\autokontor-tiktok.mp4   (Hochformat fuer TikTok/Reels)
echo   out\autokontor-youtube.mp4  (Querformat fuer YouTube/Website)
start "" out
pause
