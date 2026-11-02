---
description: Prüft die Standbilder und rendert das fertige Video (TikTok + YouTube)
---
Rendere das fertige Werbevideo in Premium-Qualität.

1. `npm run check` ausführen.
2. Sieh dir JEDES Bild in `out/check/` an (Read-Tool). Prüfe streng:
   - Text abgeschnitten, am Rand klebend oder überlappend?
   - Alles gut lesbar, Kontrast stark?
   - Wirkt jedes Bild wie ein teurer, viraler Edit – oder noch billig/leer?
   Behebe jedes Problem im Code (`src/effects/…`, `src/lib.tsx`) und prüfe erneut, bis alles sitzt.
3. `npm run render:alle` (bei Hängern `--concurrency 2` an die render-Befehle anhängen).
4. Melde dem Nutzer kurz: wo die Dateien liegen (`out/autokontor-tiktok.mp4`, `out/autokontor-youtube.mp4`) und wie lang das Video ist.
