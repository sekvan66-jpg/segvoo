# Xiaomi 18 Pro Max (China-Version) so global wie möglich

Diese Anleitung macht ein China-Gerät mit **HyperOS 4 CN** im Alltag in
Deutschland gut nutzbar: Google-Dienste, Play Store, Deutsch, keine
chinesischen Apps und keine Werbung. **Ohne Root und ohne Bootloader-Unlock**,
und jeder Schritt lässt sich rückgängig machen.

> **Was nicht geht:** Eine echte Global-ROM mit OTA-Updates über ein
> Software-Update. Ein China-Gerät bleibt ein China-Gerät. Was das bedeutet,
> steht unter [Grenzen](#grenzen-ehrlich-gesagt) und
> [Global-ROM flashen?](#global-rom-flashen--bitte-lesen).

---

## Schritt 1 – Erst sichern, dann prüfen

1. Fotos und Chats sichern (Xiaomi Cloud, PC oder später Google).
2. Unter **Einstellungen → Über das Telefon** die HyperOS-Version notieren.
3. Updates der China-ROM **weiter installieren**. Sie sind sicher und bringen
   Fehlerbehebungen und Sicherheitspatches.

## Schritt 2 – Region und Sprache

1. **Einstellungen → Weitere Einstellungen → Region** → *Deutschland*.
   Damit stimmen Wetter, Notrufnummern, Kalender-Feiertage und Teile des
   App-Angebots.
2. **Sprache:** Die China-ROM bringt in der Regel nur Chinesisch und Englisch
   mit. Stell zuerst **English** ein
   (*Einstellungen → Weitere Einstellungen → Sprachen & Eingabe → Sprachen*).
   - Pro App geht Deutsch auch direkt:
     *Settings → Additional settings → Languages → App languages*.
   - Systemweit Deutsch: die App **MoreLocale 2** aus dem Play Store
     installieren, dann `tweaks` ausführen (siehe Schritt 5) und in MoreLocale
     *Deutsch (Deutschland)* wählen. Google- und viele Android-Apps erscheinen
     dann auf Deutsch. Xiaomi-eigene Apps bleiben teilweise auf Englisch, weil
     ihnen die deutschen Texte fehlen.

## Schritt 3 – Google-Dienste und Play Store

1. In den Einstellungen nach **„Google“** suchen und **Google-Basisdienste**
   (*Google basic services*) einschalten. Meist steht der Schalter unter
   *Weitere Einstellungen* oder *Konten & Synchronisierung*.
2. Fehlt der **Play Store**:
   - im vorinstallierten Xiaomi-Store (*GetApps / 应用商店*) nach
     „Google Play“ suchen, oder
   - den Play Store als APK von **apkmirror.com** laden (nur dort, keine
     dubiosen Seiten).
3. Mit dem Google-Konto anmelden und Kontakte, Fotos und Backup wie gewohnt
   einrichten.
4. **Play Store → Einstellungen → Info → Play Protect-Zertifizierung** prüfen.
   Steht dort *„Gerät ist nicht zertifiziert“*, funktionieren Google Wallet
   (kontaktlos zahlen) und einige Banking- und Streaming-Apps eventuell nicht.

Empfohlene Ersatz-Apps aus dem Play Store: **Gboard** (Tastatur), **Google
Messages**, **Google Telefon** (falls angeboten), **Chrome** oder **Firefox**,
**Google Maps**, **Google Fotos** und **Gemini** statt XiaoAi.

## Schritt 4 – PC vorbereiten (für die Skripte)

1. **Android Platform Tools** (adb) von Google laden:
   <https://developer.android.com/tools/releases/platform-tools>
   und entpacken.
   Unter Windows kannst du `adb.exe` (samt den beiden `AdbWin*.dll`) einfach
   in diesen Ordner `xiaomi-global` legen.
2. Am Handy: **Über das Telefon → 7× auf „OS-Version“ tippen** →
   Entwickleroptionen sind aktiv.
3. **Weitere Einstellungen → Entwickleroptionen**:
   - *USB-Debugging* einschalten
   - *USB-Debugging (Sicherheitseinstellungen)* einschalten. Das braucht eine
     SIM-Karte und einen Xiaomi-Account. Ohne diese Option schlagen
     `ime set` und `pm grant` fehl.
4. Per USB verbinden und am Handy **„Zulassen“** tippen.

## Schritt 5 – Skripte ausführen

**Windows (PowerShell im Ordner `xiaomi-global`):**

```powershell
Set-ExecutionPolicy -Scope Process Bypass   # nur für dieses Fenster
.\xiaomi-global.ps1 check              # Was ist drauf? Region, Google, China-Apps
.\xiaomi-global.ps1 debloat -Test      # Vorschau: was würde entfernt
.\xiaomi-global.ps1 debloat            # China-Apps, Werbung, Telemetrie entfernen
.\xiaomi-global.ps1 tweaks             # Gboard, 24h, Zeitzone, MoreLocale
```

**macOS / Linux:**

```bash
./xiaomi-global.sh check
./xiaomi-global.sh debloat --test
./xiaomi-global.sh debloat
./xiaomi-global.sh tweaks
```

- `debloat` entfernt standardmäßig nur die Pakete, die in
  [`pakete.txt`](pakete.txt) als **sicher** markiert sind: Werbedienst (MSA),
  Analytics, Quick Apps, Mi Pay China, Weibo, Taobao, Douyin und Ähnliches.
- `debloat --alle` (bzw. `-Alle`) entfernt zusätzlich die **optionalen**
  Pakete: XiaoAi, Mi Browser, App Vault, GetApps China und andere. Installiere
  vorher die Ersatz-Apps, zum Beispiel einen anderen Browser.
- Eine chinesische Tastatur, die gerade aktiv ist, wird **nicht** entfernt.
  Installiere erst Gboard, führe dann `tweaks` und danach `debloat` erneut aus.
- Danach das Handy neu starten.

**Rückgängig machen:** `restore` (bzw. `.\xiaomi-global.ps1 restore`) holt
alles zurück, was im letzten Protokoll `entfernt-*.txt` steht. Ein
Werksreset stellt ebenfalls alles wieder her.

Die Liste darf mehr enthalten, als auf deinem Gerät ist. Fehlende Pakete
werden übersprungen. Eigene Einträge ergänzt du einfach in `pakete.txt`.

## Schritt 6 – Benachrichtigungen zuverlässig machen

Die China-ROM beendet Hintergrund-Apps sehr aggressiv. Dann kommen zum
Beispiel WhatsApp-Nachrichten zu spät.

Für WhatsApp, Signal, Telegram, Mail, Banking und ähnliche Apps:

1. **App-Info → Autostart** einschalten
2. **App-Info → Akku-Sparmodus → Keine Einschränkungen**
3. App in der Übersicht der zuletzt genutzten Apps nach unten ziehen →
   **Schloss** (sperren)
4. **Sicherheits-App → Einstellungen** (Zahnrad oben rechts) → bei *Bereinigung*
   bzw. *Speicher-Boost* die automatische Bereinigung ausschalten

## Schritt 7 – Mobilfunk in Deutschland prüfen

- **Band 20 (800 MHz)** ist auf dem Land für LTE wichtig. Prüfe im Datenblatt
  deines Modells, ob es unterstützt wird.
- **VoLTE / WLAN-Call** funktioniert bei deutschen Netzbetreibern mit
  China-ROMs oft nicht oder nur teilweise. Telefonieren geht trotzdem, dann
  eben über 2G/3G-Fallback bzw. ohne WLAN-Call. Den Schalter findest du unter
  *Einstellungen → SIM-Karten & Mobilfunknetze → SIM → VoLTE*.
- **eSIM:** China-Modelle haben meist keine.

---

## Grenzen (ehrlich gesagt)

| Bereich | Mit dieser Anleitung |
| --- | --- |
| Google-Konto, Play Store, Gmail, Maps, YouTube | ✅ funktioniert |
| Keine chinesischen Apps, keine Werbung | ✅ |
| Deutsch | ⚠️ meist vollständig, Xiaomi-Apps teils Englisch |
| Google Wallet / kontaktlos zahlen | ⚠️ nur bei Play-Protect-Zertifizierung |
| Banking-Apps | ⚠️ meistens ja, einzelne prüfen die Geräteintegrität |
| VoLTE / WLAN-Call in DE | ⚠️ oft nicht |
| OTA-Updates | ✅ weiter über die China-ROM |
| Garantie | ⚠️ nur über den Händler in China. Mit dieser Anleitung bleibt sie unberührt. |

## Global-ROM flashen? – bitte lesen

**Kurz: Lass es, solange der Bootloader gesperrt ist.**

- Xiaomi entsperrt China-Geräte offiziell nur mit chinesischem
  Community-Account und strengen Auflagen. Der globale Entsperr-Weg gilt
  ausdrücklich **nicht** für China-Geräte.
- Eine Global-ROM auf ein China-Gerät mit **gesperrtem** Bootloader zu flashen
  führt sehr wahrscheinlich zu einem **Brick**. Das gilt auch für jedes
  „Flash-Tool“, das dir etwas anderes verspricht.
- Selbst mit offenem Bootloader: den Bootloader **niemals** wieder sperren,
  solange eine Fremd-ROM drauf ist. Das bricked das Gerät ebenfalls.
- Für das Xiaomi 18 Pro (nicht Max) gibt es Berichte über einen
  **inoffiziellen** Bootloader-Bypass (Stand Oktober 2026). Das ist eine
  Sicherheitslücke, die Xiaomi per Update schließen kann. Für das Pro Max ist
  nichts bestätigt, und eine fertige xiaomi.eu-ROM für das 18 Pro Max war bei
  der Recherche nicht zu finden.

Wenn du diesen Weg später doch gehen willst, warte, bis es im
**XDA-Forum** und bei **xiaomi.eu** einen eigenen Thread für dein Modell gibt
(Codename im `check`-Ergebnis unter „Codename“). Folge dann genau der
Anleitung dort.

### Quellen

- Xiaomi Community: [Bootloader-Unlock – wer darf, wer nicht](https://new.c.mi.com/global/post/850671)
- XimiTime: [China- zu Global-ROM unter HyperOS](https://ximitime.com/how-to-convert-chinese-rom-to-global-rom-on-xiaomi-hyperos-69699/)
- XimiTime: [Inoffizieller Bootloader-Unlock für Xiaomi 18 Pro / Fold](https://ximitime.com/xiaomi-18-pro-and-fold-get-unofficial-bootloader-unlock-101065/)
- XDA: [Brick-Risiko beim Flashen eines gesperrten China-Geräts](https://xdaforums.com/t/how-to-open-chinese-hyperos-bootloader.4698829/)
- miuirom.org: [Firmware-Übersicht Xiaomi 18 Pro Max](https://miuirom.org/phones/xiaomi-18-pro-max)
