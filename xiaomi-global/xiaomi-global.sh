#!/usr/bin/env bash
# Xiaomi China-ROM "globaler" machen – ohne Root, ohne Bootloader-Unlock.
#
# Aufruf:
#   ./xiaomi-global.sh check              Gerät prüfen (Region, ROM, Google, Bootloader)
#   ./xiaomi-global.sh debloat [--alle]   China-Apps für Benutzer 0 entfernen
#   ./xiaomi-global.sh debloat --test     nur anzeigen, nichts ändern
#   ./xiaomi-global.sh restore [datei]    entfernte Apps wiederherstellen
#   ./xiaomi-global.sh tweaks             Gboard, 24h, Zeitzone, MoreLocale
#
# Voraussetzung: adb (Android Platform Tools) und USB-Debugging am Handy.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LISTE="$DIR/pakete.txt"

sh_adb() { adb shell "$@" </dev/null | tr -d '\r'; }

need_device() {
  command -v adb >/dev/null || { echo "adb nicht gefunden – Android Platform Tools installieren."; exit 1; }
  local state
  state="$(adb get-state 2>/dev/null || true)"
  if [[ "$state" != "device" ]]; then
    echo "Kein Gerät verbunden oder nicht autorisiert."
    echo "→ USB-Debugging aktivieren und am Handy 'Zulassen' tippen. Dann: adb devices"
    exit 1
  fi
}

prop() { sh_adb getprop "$1"; }

installed() {
  sh_adb pm list packages --user 0 | sed 's/^package://'
}

cmd_check() {
  need_device
  echo "== Gerät =="
  echo "Modell:          $(prop ro.product.marketname) ($(prop ro.product.model))"
  echo "Codename:        $(prop ro.product.device)"
  echo "ROM-Variante:    $(prop ro.product.mod_device)"
  echo "HyperOS:         $(prop ro.mi.os.version.name) $(prop ro.mi.os.version.incremental)"
  echo "Android:         $(prop ro.build.version.release)"
  echo "ROM-Region:      $(prop ro.miui.build.region) / Locale $(prop ro.product.locale)"
  echo "Eingestellte Region: $(prop ro.miui.region) $(sh_adb settings get global miui_region 2>/dev/null || true)"
  echo
  echo "== Bootloader =="
  local locked
  locked="$(prop ro.boot.flash.locked)"
  echo "flash.locked=$locked  verifiedbootstate=$(prop ro.boot.verifiedbootstate)"
  [[ "$locked" == "1" ]] && echo "→ Bootloader gesperrt (normal). Kein Global-ROM flashen – Brick-Gefahr!"
  echo
  echo "== Google =="
  local pk
  pk="$(installed)"
  for p in com.google.android.gms com.google.android.gsf com.android.vending \
           com.google.android.inputmethod.latin com.google.android.apps.messaging \
           com.google.android.dialer; do
    if grep -qx "$p" <<<"$pk"; then echo "  [x] $p"; else echo "  [ ] $p"; fi
  done
  echo
  echo "== China-Apps aus pakete.txt, die noch installiert sind =="
  local n=0
  while IFS='|' read -r paket stufe beschr; do
    if grep -qx "$paket" <<<"$pk"; then echo "  ($stufe) $paket – $beschr"; n=$((n+1)); fi
  done < <(grep -v '^\s*#' "$LISTE" | grep -v '^\s*$')
  echo "→ $n Pakete gefunden."
}

cmd_debloat() {
  local alle=0 test=0
  for a in "$@"; do
    case "$a" in
      --alle) alle=1 ;;
      --test) test=1 ;;
      *) echo "Unbekannte Option: $a"; exit 1 ;;
    esac
  done
  need_device

  local pk ime log
  pk="$(installed)"
  ime="$(sh_adb settings get secure default_input_method)"
  log="$DIR/entfernt-$(date +%Y%m%d-%H%M%S).txt"

  local ziel=()
  while IFS='|' read -r paket stufe beschr; do
    [[ "$stufe" == "optional" && $alle -eq 0 ]] && continue
    grep -qx "$paket" <<<"$pk" || continue
    if [[ "$ime" == "$paket/"* ]]; then
      echo "Übersprungen: $paket ist die aktive Tastatur – erst Gboard einrichten (tweaks)."
      continue
    fi
    ziel+=("$paket|$beschr")
  done < <(grep -v '^\s*#' "$LISTE" | grep -v '^\s*$')

  if [[ ${#ziel[@]} -eq 0 ]]; then echo "Nichts zu entfernen."; return; fi

  echo "Folgende ${#ziel[@]} Apps werden für Benutzer 0 entfernt:"
  printf '  %s\n' "${ziel[@]//|/ – }"
  if [[ $test -eq 1 ]]; then echo "(Testlauf – nichts geändert)"; return; fi

  read -r -p "Fortfahren? [j/N] " ok
  [[ "$ok" =~ ^[jJyY]$ ]] || { echo "Abgebrochen."; return; }

  for e in "${ziel[@]}"; do
    local paket="${e%%|*}" out
    out="$(sh_adb pm uninstall -k --user 0 "$paket" 2>&1 || true)"
    if [[ "$out" == *Success* ]]; then
      echo "  entfernt:  $paket"
      echo "$paket" >> "$log"
    else
      # Manche Pakete sind geschützt – dann wenigstens deaktivieren.
      out="$(sh_adb pm disable-user --user 0 "$paket" 2>&1 || true)"
      if [[ "$out" == *disabled* ]]; then
        echo "  deaktiviert: $paket"
        echo "$paket" >> "$log"
      else
        echo "  FEHLER:    $paket ($out)"
      fi
    fi
  done
  [[ -f "$log" ]] && echo "Protokoll: $log  (für ./xiaomi-global.sh restore)"
  echo "Tipp: Handy jetzt einmal neu starten."
}

cmd_restore() {
  need_device
  local datei="${1:-}"
  if [[ -z "$datei" ]]; then
    datei="$(ls -1t "$DIR"/entfernt-*.txt 2>/dev/null | head -n1 || true)"
  fi
  if [[ -z "$datei" || ! -f "$datei" ]]; then
    echo "Kein Protokoll gefunden. Alle Pakete aus pakete.txt wiederherstellen? [j/N]"
    read -r ok
    [[ "$ok" =~ ^[jJyY]$ ]] || return
    datei="$(mktemp)"
    grep -v '^\s*#' "$LISTE" | grep -v '^\s*$' | cut -d'|' -f1 > "$datei"
  fi
  while read -r paket; do
    [[ -z "$paket" ]] && continue
    sh_adb cmd package install-existing --user 0 "$paket" >/dev/null 2>&1 || true
    sh_adb pm enable --user 0 "$paket" >/dev/null 2>&1 || true
    echo "  wiederhergestellt: $paket"
  done < "$datei"
}

cmd_tweaks() {
  need_device
  local pk
  pk="$(installed)"

  if grep -qx com.google.android.inputmethod.latin <<<"$pk"; then
    local gb=com.google.android.inputmethod.latin/com.android.inputmethod.latin.LatinIME
    sh_adb ime enable "$gb" >/dev/null && sh_adb ime set "$gb" >/dev/null \
      && echo "Gboard als Standard-Tastatur gesetzt."
  else
    echo "Gboard fehlt – im Play Store installieren, dann tweaks erneut ausführen."
  fi

  sh_adb settings put system time_12_24 24 && echo "24-Stunden-Format aktiviert."
  sh_adb settings put global auto_time 1
  sh_adb settings put global auto_time_zone 1 && echo "Uhrzeit/Zeitzone automatisch über Netz."

  if grep -qx jp.co.c_lis.ccl.morelocale <<<"$pk"; then
    sh_adb pm grant jp.co.c_lis.ccl.morelocale android.permission.CHANGE_CONFIGURATION \
      && echo "MoreLocale 2 berechtigt – dort 'Deutsch (Deutschland)' wählen."
  else
    echo "Hinweis: Für Deutsch systemweit 'MoreLocale 2' installieren und tweaks erneut ausführen."
  fi
}

case "${1:-}" in
  check)   shift; cmd_check "$@" ;;
  debloat) shift; cmd_debloat "$@" ;;
  restore) shift; cmd_restore "$@" ;;
  tweaks)  shift; cmd_tweaks "$@" ;;
  *) sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
