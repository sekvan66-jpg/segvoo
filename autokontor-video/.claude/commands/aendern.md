---
description: Ändert Text, Effekte oder Look des Videos nach Wunsch
argument-hint: "was geändert werden soll, z. B. 'Szene mit Laptop länger' oder 'neuer Satz: Rechnungen in Sekunden'"
---
Der Nutzer möchte am Video etwas ändern: $ARGUMENTS

- Text/Reihenfolge/Effekt → `skript.txt` anpassen (Format `effekt | Text`). Danach ist die Stimme veraltet: führe die Schritte aus `/stimme` aus.
- Markenname, Slogan, Button, Farben → `src/theme.ts`.
- Aussehen eines Effekts → `src/effects/text.tsx` oder `src/effects/scenes.tsx`.
- Musik/Sound → `src/Spot.tsx` (Sound, SFX_FOR).

Danach `npm run check`, betroffene Standbilder ansehen und prüfen. Zum Schluss fragen, ob final gerendert werden soll (`/video`). Erkläre in 1–2 Sätzen auf Deutsch, was du geändert hast.
