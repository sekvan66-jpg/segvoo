# Xiaomi China-ROM "globaler" machen – ohne Root, ohne Bootloader-Unlock.
#
# Aufruf (PowerShell im Ordner xiaomi-global):
#   .\xiaomi-global.ps1 check                Gerät prüfen (Region, ROM, Google, Bootloader)
#   .\xiaomi-global.ps1 debloat [-Alle]      China-Apps für Benutzer 0 entfernen
#   .\xiaomi-global.ps1 debloat -Test        nur anzeigen, nichts ändern
#   .\xiaomi-global.ps1 restore [-Datei x]   entfernte Apps wiederherstellen
#   .\xiaomi-global.ps1 tweaks               Gboard, 24h, Zeitzone, MoreLocale
#
# Falls Skripte blockiert sind:  Set-ExecutionPolicy -Scope Process Bypass
# Voraussetzung: adb.exe (Android Platform Tools) im PATH oder in diesem Ordner.
param(
  [Parameter(Position = 0)][ValidateSet('check', 'debloat', 'restore', 'tweaks')][string]$Befehl,
  [switch]$Alle,
  [switch]$Test,
  [string]$Datei
)
# 'Continue', damit adb-Ausgaben auf stderr das Skript nicht abbrechen (PowerShell 5.1).
$ErrorActionPreference = 'Continue'
$Dir = $PSScriptRoot
$Liste = Join-Path $Dir 'pakete.txt'

$Adb = if (Test-Path (Join-Path $Dir 'adb.exe')) { Join-Path $Dir 'adb.exe' } else { 'adb' }

function Sh { (& $Adb shell @args 2>&1 | ForEach-Object { "$_" } | Out-String).Trim() }

function Need-Device {
  if (-not (Get-Command $Adb -ErrorAction SilentlyContinue)) {
    throw 'adb nicht gefunden – Android Platform Tools installieren.'
  }
  $state = (& $Adb get-state 2>$null | Out-String).Trim()
  if ($state -ne 'device') {
    Write-Host 'Kein Gerät verbunden oder nicht autorisiert.'
    Write-Host "→ USB-Debugging aktivieren und am Handy 'Zulassen' tippen. Dann: adb devices"
    exit 1
  }
}

function Prop($name) { Sh getprop $name }

function Installed {
  (Sh pm list packages '--user' 0) -split "`r?`n" | ForEach-Object { $_ -replace '^package:', '' }
}

function Read-Liste {
  Get-Content $Liste -Encoding UTF8 | Where-Object { $_ -and $_ -notmatch '^\s*#' -and $_.Trim() } |
    ForEach-Object {
      $t = $_ -split '\|', 3
      [pscustomobject]@{ Paket = $t[0]; Stufe = $t[1]; Beschr = $t[2] }
    }
}

function Cmd-Check {
  Need-Device
  Write-Host '== Gerät =='
  Write-Host "Modell:          $(Prop ro.product.marketname) ($(Prop ro.product.model))"
  Write-Host "Codename:        $(Prop ro.product.device)"
  Write-Host "ROM-Variante:    $(Prop ro.product.mod_device)"
  Write-Host "HyperOS:         $(Prop ro.mi.os.version.name) $(Prop ro.mi.os.version.incremental)"
  Write-Host "Android:         $(Prop ro.build.version.release)"
  Write-Host "ROM-Region:      $(Prop ro.miui.build.region) / Locale $(Prop ro.product.locale)"
  Write-Host "Eingestellte Region: $(Prop ro.miui.region) $(Sh settings get global miui_region)"
  Write-Host ''
  Write-Host '== Bootloader =='
  $locked = Prop ro.boot.flash.locked
  Write-Host "flash.locked=$locked  verifiedbootstate=$(Prop ro.boot.verifiedbootstate)"
  if ($locked -eq '1') { Write-Host '→ Bootloader gesperrt (normal). Kein Global-ROM flashen – Brick-Gefahr!' }
  Write-Host ''
  Write-Host '== Google =='
  $pk = Installed
  foreach ($p in 'com.google.android.gms', 'com.google.android.gsf', 'com.android.vending',
    'com.google.android.inputmethod.latin', 'com.google.android.apps.messaging',
    'com.google.android.dialer') {
    if ($pk -contains $p) { Write-Host "  [x] $p" } else { Write-Host "  [ ] $p" }
  }
  Write-Host ''
  Write-Host '== China-Apps aus pakete.txt, die noch installiert sind =='
  $n = 0
  foreach ($e in Read-Liste) {
    if ($pk -contains $e.Paket) { Write-Host "  ($($e.Stufe)) $($e.Paket) – $($e.Beschr)"; $n++ }
  }
  Write-Host "→ $n Pakete gefunden."
}

function Cmd-Debloat {
  Need-Device
  $pk = Installed
  $ime = Sh settings get secure default_input_method
  $log = Join-Path $Dir ("entfernt-{0}.txt" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))

  $ziel = @()
  foreach ($e in Read-Liste) {
    if ($e.Stufe -eq 'optional' -and -not $Alle) { continue }
    if ($pk -notcontains $e.Paket) { continue }
    if ($ime.StartsWith("$($e.Paket)/")) {
      Write-Host "Übersprungen: $($e.Paket) ist die aktive Tastatur – erst Gboard einrichten (tweaks)."
      continue
    }
    $ziel += $e
  }
  if ($ziel.Count -eq 0) { Write-Host 'Nichts zu entfernen.'; return }

  Write-Host "Folgende $($ziel.Count) Apps werden für Benutzer 0 entfernt:"
  $ziel | ForEach-Object { Write-Host "  $($_.Paket) – $($_.Beschr)" }
  if ($Test) { Write-Host '(Testlauf – nichts geändert)'; return }

  $ok = Read-Host 'Fortfahren? [j/N]'
  if ($ok -notmatch '^[jJyY]$') { Write-Host 'Abgebrochen.'; return }

  foreach ($e in $ziel) {
    $out = Sh pm uninstall '-k' '--user' 0 $e.Paket
    if ($out -match 'Success') {
      Write-Host "  entfernt:  $($e.Paket)"
      Add-Content -Path $log -Value $e.Paket
    } else {
      # Manche Pakete sind geschützt – dann wenigstens deaktivieren.
      $out = Sh pm disable-user '--user' 0 $e.Paket
      if ($out -match 'disabled') {
        Write-Host "  deaktiviert: $($e.Paket)"
        Add-Content -Path $log -Value $e.Paket
      } else {
        Write-Host "  FEHLER:    $($e.Paket) ($out)"
      }
    }
  }
  if (Test-Path $log) { Write-Host "Protokoll: $log  (für .\xiaomi-global.ps1 restore)" }
  Write-Host 'Tipp: Handy jetzt einmal neu starten.'
}

function Cmd-Restore {
  Need-Device
  if (-not $Datei) {
    $Datei = Get-ChildItem -Path $Dir -Filter 'entfernt-*.txt' -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
  }
  if ($Datei -and (Test-Path $Datei)) {
    $pakete = Get-Content $Datei | Where-Object { $_.Trim() }
  } else {
    $ok = Read-Host 'Kein Protokoll gefunden. Alle Pakete aus pakete.txt wiederherstellen? [j/N]'
    if ($ok -notmatch '^[jJyY]$') { return }
    $pakete = Read-Liste | ForEach-Object { $_.Paket }
  }
  foreach ($p in $pakete) {
    Sh cmd package install-existing '--user' 0 $p | Out-Null
    Sh pm enable '--user' 0 $p | Out-Null
    Write-Host "  wiederhergestellt: $p"
  }
}

function Cmd-Tweaks {
  Need-Device
  $pk = Installed

  if ($pk -contains 'com.google.android.inputmethod.latin') {
    $gb = 'com.google.android.inputmethod.latin/com.android.inputmethod.latin.LatinIME'
    Sh ime enable $gb | Out-Null
    Sh ime set $gb | Out-Null
    Write-Host 'Gboard als Standard-Tastatur gesetzt.'
  } else {
    Write-Host 'Gboard fehlt – im Play Store installieren, dann tweaks erneut ausführen.'
  }

  Sh settings put system time_12_24 24 | Out-Null
  Write-Host '24-Stunden-Format aktiviert.'
  Sh settings put global auto_time 1 | Out-Null
  Sh settings put global auto_time_zone 1 | Out-Null
  Write-Host 'Uhrzeit/Zeitzone automatisch über Netz.'

  if ($pk -contains 'jp.co.c_lis.ccl.morelocale') {
    Sh pm grant jp.co.c_lis.ccl.morelocale android.permission.CHANGE_CONFIGURATION | Out-Null
    Write-Host "MoreLocale 2 berechtigt – dort 'Deutsch (Deutschland)' wählen."
  } else {
    Write-Host "Hinweis: Für Deutsch systemweit 'MoreLocale 2' installieren und tweaks erneut ausführen."
  }
}

switch ($Befehl) {
  'check'   { Cmd-Check }
  'debloat' { Cmd-Debloat }
  'restore' { Cmd-Restore }
  'tweaks'  { Cmd-Tweaks }
  default   { Get-Content $PSCommandPath -TotalCount 11 | ForEach-Object { $_ -replace '^# ?', '' } }
}
