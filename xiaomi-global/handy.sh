#!/system/bin/sh
# Läuft direkt auf dem Handy – ohne PC – in aShell (über Shizuku).
#
#   sh /sdcard/Download/handy.sh              prüfen + wichtige Systempakete reparieren
#   sh /sdcard/Download/handy.sh optimieren   zusätzlich alle Apps neu optimieren (dauert, am Ladegerät)
#
# Der Bericht landet in /sdcard/Download/check-ergebnis.txt.
# Es wird nichts entfernt. Nur Pakete, die für Leistung und Bedienung
# nötig sind, werden zurückgeholt bzw. wieder aktiviert.

OUT=/sdcard/Download/check-ergebnis.txt
TMP=/data/local/tmp
WICHTIG="com.xiaomi.joyose com.miui.powerkeeper com.miui.daemon com.miui.home com.miui.securitycenter"

{
  echo "== Gerät =="
  echo "Modell:       $(getprop ro.product.marketname) ($(getprop ro.product.model))"
  echo "Codename:     $(getprop ro.product.device)"
  echo "ROM-Variante: $(getprop ro.product.mod_device)"
  echo "HyperOS:      $(getprop ro.mi.os.version.name) $(getprop ro.mi.os.version.incremental)"
  echo "Android:      $(getprop ro.build.version.release)"
  echo "Bootloader gesperrt: $(getprop ro.boot.flash.locked)"
  echo

  echo "== Wichtige Systempakete =="
  for p in $WICHTIG; do
    if pm list packages | grep -qx "package:$p"; then
      if pm list packages -d | grep -qx "package:$p"; then
        pm enable --user 0 "$p" >/dev/null 2>&1 && echo "wieder aktiviert: $p" || echo "FEHLER beim Aktivieren: $p"
      else
        echo "ok: $p"
      fi
    elif pm list packages -u | grep -qx "package:$p"; then
      cmd package install-existing --user 0 "$p" >/dev/null 2>&1 && echo "wiederhergestellt: $p" || echo "FEHLER beim Wiederherstellen: $p"
    else
      echo "nicht auf dem Gerät: $p"
    fi
  done
  echo

  echo "== Gedrückthalten =="
  lp="$(settings get secure long_press_timeout)"
  echo "Berührungs- und Haltezeit: $lp ms (Standard 400)"
  case "$lp" in
    ''|null|400) ;;
    *) settings put secure long_press_timeout 400 && echo "→ auf 400 ms (kurz) zurückgesetzt" ;;
  esac
  echo

  echo "== Entfernte Apps (für Benutzer 0) =="
  pm list packages -u | sort > "$TMP/alle"
  pm list packages | sort > "$TMP/aktiv"
  comm -23 "$TMP/alle" "$TMP/aktiv" | sed 's/^package://'
  rm -f "$TMP/alle" "$TMP/aktiv"
  echo

  echo "== Deaktivierte Apps =="
  pm list packages -d | sed 's/^package://'
  echo

  echo "== Einstellungen =="
  echo "Animationen:      $(settings get global window_animation_scale) / $(settings get global transition_animation_scale) / $(settings get global animator_duration_scale)"
  echo "Energiesparmodus: $(settings get global low_power)"
  echo "MIUI-Optimierung: $(getprop persist.sys.miui_optimization)"
  echo "Tastatur:         $(settings get secure default_input_method)"
  echo "Launcher:         $(cmd package resolve-activity --brief -c android.intent.category.HOME -a android.intent.action.MAIN 2>/dev/null | tail -n 1)"
  echo

  echo "== Akku & Speicher =="
  dumpsys battery | grep -E "level|temperature"
  df -h /data | tail -n 1

  if [ "$1" = "optimieren" ]; then
    echo
    echo "== Apps werden optimiert (kann einige Minuten dauern) =="
    cmd package bg-dexopt-job && echo "fertig"
  fi
} 2>&1 | tee "$OUT"

echo
echo "Bericht gespeichert: $OUT"
echo "Bitte Handy neu starten, falls oben etwas wiederhergestellt oder aktiviert wurde."
