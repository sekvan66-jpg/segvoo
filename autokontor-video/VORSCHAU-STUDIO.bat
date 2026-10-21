@echo off
cd /d "%~dp0"
call node tools\build-timeline.mjs
call npx remotion studio
