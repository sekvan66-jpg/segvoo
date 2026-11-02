#!/data/data/com.termux/files/usr/bin/bash
# Läuft in Termux auf einem ZWEITEN Handy (z. B. OnePlus) und steuert das
# Xiaomi kabellos per ADB – ganz ohne PC.
#
# Vorher (einmalig):
#   1. In Termux:   pkg install -y android-tools
#   2. Am Xiaomi:   Entwickleroptionen → Kabelloses Debugging an (gleiches WLAN)
#   3. In Termux:   adb pair IP:PORT   (Kopplungscode vom Xiaomi eingeben)
#                   adb connect IP:PORT
#
# Dann:
#   bash termux.sh              nur prüfen + wichtige Systempakete reparieren
#   bash termux.sh global       alles: reparieren, China-Apps entfernen, Deutsch, Gboard, 24h
#   bash termux.sh optimieren   alle Apps neu optimieren (Xiaomi ans Ladegerät)
#   bash termux.sh zurueck      alles von "global" rückgängig machen
#
# Es werden nur die "sicher"-Pakete aus pakete.txt angefasst, nie kritische Systempakete.

set -e
MODUS="${1:-}"
case "$MODUS" in ''|global|optimieren|zurueck) ;; *)
  echo "Unbekannter Modus: $MODUS  (erlaubt: global, optimieren, zurueck oder nichts)"; exit 1 ;;
esac

# Über die GitHub-API laden: liefert immer den neuesten Stand (raw.githubusercontent cacht bis zu 5 Min).
QUELLE="https://api.github.com/repos/sekvan66-jpg/segvoo/contents/xiaomi-global/handy.sh?ref=claude/xiaomi-18-pro-max-global-w7pzu0"
HIER="$(cd "$(dirname "$0")" && pwd)"

command -v adb >/dev/null || { echo "adb fehlt → zuerst: pkg install -y android-tools"; exit 1; }

# Genau ein verbundenes Gerät?
GERAETE="$(adb devices | awk 'NR>1 && $2=="device" {print $1}')"
ANZAHL="$(printf '%s\n' "$GERAETE" | grep -c . || true)"
if [ "$ANZAHL" = 0 ]; then
  echo "Kein Xiaomi verbunden."
  echo "→ Am Xiaomi 'Kabelloses Debugging' öffnen und hier eingeben:  adb connect IP:PORT"
  adb devices
  exit 1
elif [ "$ANZAHL" -gt 1 ]; then
  echo "Mehrere Geräte verbunden – bitte nur das Xiaomi verbinden:"
  adb devices
  exit 1
fi

MODELL="$(adb shell getprop ro.product.marketname | tr -d '\r')"
MARKE="$(adb shell getprop ro.product.manufacturer | tr -d '\r')"
echo "Verbunden mit: $MODELL ($MARKE)"
case "$MARKE" in
  [Xx]iaomi|[Rr]edmi|POCO|[Pp]oco) ;;
  *) echo "Das ist kein Xiaomi – Abbruch, damit nicht das falsche Handy geändert wird."; exit 1 ;;
esac

# handy.sh holen: im Repo-Ordner die lokale Datei, sonst immer frisch aus GitHub.
if [ -f "$HIER/handy.sh" ] && [ -f "$HIER/pakete.txt" ]; then
  SKRIPT="$HIER/handy.sh"
else
  SKRIPT="$HOME/handy.sh"
  echo "Lade handy.sh …"
  curl -fsSL -H "Accept: application/vnd.github.raw" "$QUELLE" -o "$SKRIPT"
fi

adb push "$SKRIPT" /sdcard/Download/handy.sh >/dev/null
echo "Starte handy.sh $MODUS auf dem Xiaomi …"
echo
adb shell sh /sdcard/Download/handy.sh $MODUS | tr -d '\r'

# Bericht auch aufs OnePlus holen (Termux-Ordner).
adb pull /sdcard/Download/check-ergebnis.txt "$HOME/check-ergebnis.txt" >/dev/null 2>&1 \
  && echo "Bericht auch hier gespeichert: ~/check-ergebnis.txt"

if [ "$MODUS" = global ] || [ "$MODUS" = zurueck ]; then
  echo
  printf "Xiaomi jetzt neu starten? [j/N] "
  read -r a || true
  case "$a" in j|J|ja|Ja) adb reboot && echo "Xiaomi startet neu." ;; esac
fi
