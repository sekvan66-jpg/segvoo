#!/system/bin/sh
# Läuft direkt auf dem Handy – ohne PC – in aShell (über Shizuku),
# oder von einem zweiten Handy aus per Termux + ADB: siehe termux.sh.
#
#   sh /sdcard/Download/handy.sh              nur prüfen + wichtige Systempakete reparieren
#   sh /sdcard/Download/handy.sh global       alles: reparieren, China-Apps entfernen,
#                                             Apps auf Deutsch (sonst Englisch), Gboard, 24h
#   sh /sdcard/Download/handy.sh optimieren   alle Apps neu optimieren (dauert, am Ladegerät)
#   sh /sdcard/Download/handy.sh zurueck      alles von "global" rückgängig machen
#
# Bericht: /sdcard/Download/check-ergebnis.txt
# Protokoll der entfernten Apps: /sdcard/Download/entfernt.txt

DL=/sdcard/Download
OUT=$DL/check-ergebnis.txt
LOG=$DL/entfernt.txt
TMP=/data/local/tmp
MODUS="$1"

# Für Leistung und Bedienung nötig – werden nie entfernt, sondern zurückgeholt.
WICHTIG="com.xiaomi.joyose com.miui.powerkeeper com.miui.daemon com.miui.home com.miui.securitycenter"

# Entspricht den "sicher"-Einträgen aus pakete.txt.
CHINA_APPS="
com.miui.systemAdSolution com.miui.msa.global com.miui.analytics com.miui.bugreport
com.miui.miservice com.xiaomi.vipaccount com.miui.hybrid com.miui.hybrid.accessory
com.miui.contentextension com.miui.newhome com.miui.yellowpage com.miui.virtualsim
com.mipay.wallet com.miui.nextpay com.xiaomi.payment com.xiaomi.youpin com.xiaomi.shop
com.xiaomi.gamecenter com.xiaomi.mirecycle com.miui.newmidrive com.duokan.reader
com.miui.video com.miui.player
com.sohu.inputmethod.sogou.xiaomi com.baidu.input_mi com.iflytek.inputmethod.miui
com.sina.weibo com.ss.android.article.news com.ss.android.ugc.aweme com.smile.gifmaker
com.dragon.read com.taobao.taobao com.jingdong.app.mall com.xunmeng.pinduoduo
com.autonavi.minimap com.baidu.searchbox com.UCMobile com.qiyi.video com.youku.phone
com.tencent.qqlive com.zhihu.android com.ximalaya.ting.android
"

GBOARD=com.google.android.inputmethod.latin/com.android.inputmethod.latin.LatinIME

# Bei der App-Sprache auslassen: Shizuku/aShell (laufen gerade) und Google-Kerndienste.
SPRACHE_AUSLASSEN='^(moe\.shizuku\.|in\.hridayan\.ashell|com\.google\.android\.(gms|gsf)$)'

installiert() { pm list packages | grep -qx "package:$1"; }

reparieren() {
  echo "== Wichtige Systempakete =="
  for p in $WICHTIG; do
    if installiert "$p"; then
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
}

china_apps_entfernen() {
  echo "== China-Apps, Werbung, Telemetrie entfernen =="
  ime="$(settings get secure default_input_method)"
  n=0
  for p in $CHINA_APPS; do
    installiert "$p" || continue
    case "$ime" in "$p"/*)
      echo "übersprungen (aktive Tastatur): $p"
      continue ;;
    esac
    if pm uninstall -k --user 0 "$p" 2>&1 | grep -q Success; then
      echo "entfernt: $p"; echo "$p" >> "$LOG"; n=$((n+1))
    elif pm disable-user --user 0 "$p" 2>&1 | grep -q disabled; then
      echo "deaktiviert: $p"; echo "$p" >> "$LOG"; n=$((n+1))
    else
      echo "FEHLER: $p"
    fi
  done
  echo "→ $n Apps entfernt/deaktiviert. Rückgängig: sh $DL/handy.sh zurueck"
  echo
}

# Apps mit Lokalisierung auf Deutsch stellen. Hat eine App kein Deutsch,
# zeigt Android ihre Standardtexte – bei Xiaomi- und Google-Apps Englisch.
app_sprachen() {
  echo "== App-Sprache Deutsch =="
  n=0
  for p in $(pm list packages | sed 's/^package://' | grep -E '^(com\.miui\.|com\.xiaomi\.|com\.mi\.|com\.google\.|com\.android\.(vending|chrome))'; pm list packages -3 | sed 's/^package://') ; do
    echo "$p" | grep -qE "$SPRACHE_AUSLASSEN" && continue
    cmd locale set-app-locales "$p" --user 0 --locales de-DE >/dev/null 2>&1 && n=$((n+1))
  done
  echo "→ $n Apps auf Deutsch gestellt (ohne Deutsch: Englisch)."
  echo
}

app_sprachen_zuruecksetzen() {
  echo "== App-Sprache zurück auf Systemstandard =="
  for p in $(pm list packages | sed 's/^package://'); do
    echo "$p" | grep -qE "$SPRACHE_AUSLASSEN" && continue
    cmd locale set-app-locales "$p" --user 0 >/dev/null 2>&1
  done
  echo "fertig"
  echo
}

komfort() {
  echo "== Tastatur, Uhrzeit =="
  if installiert com.google.android.inputmethod.latin; then
    ime enable "$GBOARD" >/dev/null 2>&1
    if ime set "$GBOARD" >/dev/null 2>&1; then echo "Gboard ist jetzt Standard-Tastatur."
    else echo "Gboard konnte nicht gesetzt werden → 'USB-Debugging (Sicherheitseinstellungen)' einschalten."
    fi
  else
    echo "Gboard fehlt → im Play Store installieren und 'global' erneut ausführen."
  fi
  settings put system time_12_24 24 && echo "24-Stunden-Format an."
  settings put global auto_time 1
  settings put global auto_time_zone 1 && echo "Uhrzeit/Zeitzone automatisch."
  echo
}

bericht() {
  echo "== Gerät =="
  echo "Modell:       $(getprop ro.product.marketname) ($(getprop ro.product.model))"
  echo "Codename:     $(getprop ro.product.device)"
  echo "ROM-Variante: $(getprop ro.product.mod_device)"
  echo "HyperOS:      $(getprop ro.mi.os.version.name) $(getprop ro.mi.os.version.incremental)"
  echo "Android:      $(getprop ro.build.version.release)"
  echo "Bootloader gesperrt: $(getprop ro.boot.flash.locked)"
  echo

  echo "== Google =="
  for p in com.google.android.gms com.google.android.gsf com.android.vending com.google.android.inputmethod.latin; do
    if installiert "$p"; then echo "[x] $p"; else echo "[ ] $p"; fi
  done
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
  echo

  echo "== Akku & Speicher =="
  dumpsys battery | grep -E "level|temperature"
  df -h /data | tail -n 1
}

{
  case "$MODUS" in
    global)
      reparieren
      china_apps_entfernen
      komfort
      app_sprachen
      bericht ;;
    zurueck)
      if [ -f "$LOG" ]; then
        echo "== Entfernte Apps wiederherstellen =="
        while read -r p; do
          [ -z "$p" ] && continue
          cmd package install-existing --user 0 "$p" >/dev/null 2>&1
          pm enable --user 0 "$p" >/dev/null 2>&1
          echo "wiederhergestellt: $p"
        done < "$LOG"
        mv "$LOG" "$LOG.alt"
        echo
      else
        echo "Kein Protokoll $LOG gefunden – keine Apps wiederherzustellen."
        echo
      fi
      app_sprachen_zuruecksetzen ;;
    optimieren)
      reparieren
      echo "== Apps werden optimiert (kann einige Minuten dauern) =="
      cmd package bg-dexopt-job && echo "fertig"
      echo ;;
    *)
      reparieren
      bericht ;;
  esac
} 2>&1 | tee "$OUT"

echo
echo "Bericht gespeichert: $OUT"
echo "Jetzt das Handy neu starten."
