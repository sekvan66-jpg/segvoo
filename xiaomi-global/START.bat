@echo off
rem Menue fuer Windows: einfach doppelklicken.
cd /d "%~dp0"
title Xiaomi global machen

if not exist adb.exe (
  where adb >nul 2>nul || (
    echo adb.exe fehlt!
    echo Lade die Platform Tools von Google:
    echo   https://dl.google.com/android/repository/platform-tools-latest-windows.zip
    echo und kopiere adb.exe, AdbWinApi.dll und AdbWinUsbApi.dll in diesen Ordner:
    echo   %~dp0
    echo.
    pause
    exit /b 1
  )
)

:menu
cls
echo ================================================
echo   Xiaomi 18 Pro Max - China-ROM global machen
echo ================================================
echo   1  Pruefen (Ergebnis wird in check-ergebnis.txt gespeichert)
echo   2  Vorschau: was wuerde entfernt
echo   3  China-Apps entfernen (sicher)
echo   4  China-Apps entfernen (sicher + optional)
echo   5  Tweaks (Gboard, 24h, Zeitzone, MoreLocale)
echo   6  Alles wiederherstellen
echo   0  Beenden
echo.
set "wahl="
set /p wahl=Auswahl: 

if "%wahl%"=="1" powershell -NoProfile -ExecutionPolicy Bypass -Command "& '.\xiaomi-global.ps1' check *>&1 | Tee-Object -FilePath check-ergebnis.txt"
if "%wahl%"=="2" powershell -NoProfile -ExecutionPolicy Bypass -File xiaomi-global.ps1 debloat -Test
if "%wahl%"=="3" powershell -NoProfile -ExecutionPolicy Bypass -File xiaomi-global.ps1 debloat
if "%wahl%"=="4" powershell -NoProfile -ExecutionPolicy Bypass -File xiaomi-global.ps1 debloat -Alle
if "%wahl%"=="5" powershell -NoProfile -ExecutionPolicy Bypass -File xiaomi-global.ps1 tweaks
if "%wahl%"=="6" powershell -NoProfile -ExecutionPolicy Bypass -File xiaomi-global.ps1 restore
if "%wahl%"=="0" exit /b 0
echo.
pause
goto menu
