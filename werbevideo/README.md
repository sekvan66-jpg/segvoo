# AutoKontor Werbevideo

`autokontor-werbevideo.mp4`: 42 Sekunden, 1920×1080, 30 fps, H.264 mit Musik.

| Zeit | Szene |
|------|-------|
| 0–4 s | Hook: „Zettelwirtschaft? Excel-Chaos? Deine Kundendaten in fremder Cloud?“ (wird durchgestrichen) |
| 4–9 s | Logo und Claim: „Deine Händlersoftware. Auf deinem PC. Ohne Cloud.“ |
| 9–15 s | Vier Vorteile: offline, keine Cloud, automatische Sicherung, klein bis groß |
| 15–25 s | App-Demo: Fahrzeug anlegen → Rechnung als PDF, daneben die Funktionsliste |
| 25–30 s | In drei Schritten startklar |
| 30–36 s | Preise: Start 19 €, Basic 29 €, Pro 39 € (zzgl. USt.) |
| 36–42 s | Call to Action: herunterladen, 7 Tage kostenlos testen, Windows · Mac · Linux |

## Dateien

- `video.html`: alle Szenen als HTML/CSS, gesteuert über `render(t)`. Im Browser geöffnet läuft das Video als Endlosschleife (praktisch als Vorschau).
- `musik.py`: erzeugt `musik.wav` (eigene Synthese mit numpy, daher lizenzfrei).
- `render.mjs`: nimmt `video.html` Bild für Bild mit Playwright auf und kodiert mit ffmpeg.

## Neu erzeugen

Voraussetzungen: Node 18+, Playwright mit Chromium, ffmpeg, Python 3 mit numpy.

```bash
cd werbevideo
python3 musik.py            # musik.wav
node render.mjs             # autokontor-werbevideo.mp4 (dauert einige Minuten)
node render.mjs out.mp4 --stills 5,20,38   # nur Standbilder als PNG
```

Texte, Preise und Zeiten stehen direkt in `video.html` (Szenen-Zeiten im Objekt `S`).
