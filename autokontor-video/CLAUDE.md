# AutoKontor Werbevideo – Projektanleitung für Claude Code

Dieses Projekt erzeugt einen Kinetic-Typography-Werbespot (Stil: virale TikTok-Edits, schwarz/rot/weiß, Glitch, Stretch, Morph, harte Schnitte) für die Händlersoftware **AutoKontor**. Der Nutzer heißt Segvan, spricht Deutsch und ist kein Programmierer: antworte immer auf Deutsch, kurz und ohne Fachchinesisch. Er arbeitet auf Windows.

## Ablauf (Pipeline)
1. `skript.txt` – Sprechertext + Storyboard. Eine Zeile = ein Bild: `effekt | Text`.
2. `tools/voice.py` – Chatterbox Multilingual (Deutsch) spricht jede Zeile → `public/voice.wav` + `public/voice-segments.json`. Klont `public/meine-stimme.wav`, falls vorhanden. Alternativ legt der Nutzer `public/sprecher.mp3` ab (z. B. ElevenLabs) – dann voice.py überspringen.
   **Offline-Alternative:** `tools/voice_offline.py` – Coqui-TTS „Thorsten“ (deutsche Männerstimme, läuft ohne Internet). Liefert Stimme **und** exaktes Wort-Timing direkt aus dem Modell → Schritt 3 entfällt. Aussprache schwieriger Wörter (PC, GoBD, ZUGFeRD …) steht in `aussprache.txt` (Text oder Lautschrift `/…/`). Einmalig: `pip install "coqui-tts[codec]" "gruut[de]"`; das Modell (~330 MB) lädt das Skript selbst nach `models/`.
   **Realistischere Offline-Stimme (empfohlen):** `tools/voice_piper.py [--fassung name]` – Piper „Thorsten high“ (CC0, werbetauglich), Sätze am Stück mit natürlicher Betonung, exaktes Wort-Timing aus dem Modell, Studio-Bearbeitung (EQ, Kompressor). Aussprache: `aussprache-piper.txt`. Stimmen lädt das Skript von GitHub nach `models/piper/`. Einmalig: `pip install piper-tts onnx`.
   **Frauenstimme:** `tools/voice_offline.py --modell css10 --fassung <name>` – Coqui CSS10 (weiblich, am verständlichsten von allen getesteten Frauenstimmen), Klangkette `natuerlich-w`, Aussprache in `aussprache-css10.txt` (Ersatzschreibung, z. B. „Excel = Ecksel“). Klangketten für alle Stimmen: `tools/klang.py`.
   **Klang:** Standard ist `natuerlich` (Männer) / `natuerlich-w` (Frauen), für eine tiefere Stimme `tief`. Die alten Ketten `werbung`/`trailer` (Tonhöhen-Trick, kurzer Hall, Verzerrung) klingen roboterhaft – nicht mehr verwenden (DNSMOS 2,76–2,90 statt 3,07).
   **Prüfen:** `tools/pruefe_stimme.py <fassung>` – Whisper (offline, sherpa-onnx) schreibt jede Zeile mit; falsch verstandene Wörter in die Aussprache-Liste eintragen. Modell: `models/asr/sherpa-onnx-whisper-small` von github.com/k2-fsa/sherpa-onnx/releases (asr-models).
   **Echte Aufnahme einbauen (ElevenLabs, Suno, Sprecherin, eigene Stimme):** `tools/synchron.py <fassung> aufnahme.mp3` – überträgt die Wortzeiten der Computerstimme per DTW auf die Aufnahme (gemessen: im Mittel 57 ms Abweichung). Die Aufnahme muss genau den Skript-Text sprechen.
3. `tools/timing.py` – Whisper ermittelt die Zeit jedes Worts → `public/voice-words.json`.
4. `tools/build-timeline.mjs` (`npm run timeline`) – baut `src/data/timeline.json` aus Skript + Timing. Ohne Audio wird das Timing geschätzt (nur Vorschau).
5. Remotion rendert: `npm run render` (1080x1920 TikTok) / `npm run render:yt` (1920x1080) / `npm run render:alle`.
6. Qualitätskontrolle: `npm run check` → Standbilder in `out/check/` – **immer ansehen** (Read-Tool) bevor du final renderst.

Python immer aus der venv: Windows `.venv\Scripts\python`, Mac/Linux `.venv/bin/python`.

## Fassungen und Stile
- Fassung = `skript-<name>.txt` → Stimme in `public/<name>/` → `src/data/timeline-<name>.json` (`node tools/build-timeline.mjs <name>`), Komposition in `src/Root.tsx` eintragen. Ohne Name: `skript.txt` (Erklärvideo, ~56 s).
- Vorhanden: Erklärvideo (`AutoKontorYouTube`/`AutoKontorTikTok`), `tiktok30` (`AutoKontorTikTok30`), `premium30` (`AutoKontorPremium30`).
- Skript-Kopf steuert pro Fassung: `# stil: premium` (sonst TikTok-Glitch-Stil), `# musik: musik-hell.mp3`, `# stimme: tiktok30` (Stimme einer anderen Fassung mit gleichem Text übernehmen).
- **Premium-Stil** (`src/premium/`): heller Look nach Referenzvideo – glänzende orange Kugeln (`Orb`), Bokeh-Hintergrund (`Stage`), Schlagzeile mit kursiven Akzentwörtern (`Headline`, `*Wort*`), 3D-Karten. Eine Szene pro Effekt-Name (`PREMIUM_EFFECTS`), Sounds in `SFX_PREMIUM` (Spot.tsx), weiche SFX aus `tools/sounds.py`, Musik `tools/beat.py --stil hell`.

- **Nacht-Stil** (`src/nacht/`, `# stil: nacht`): „AutoKontor bei Nacht“ – Automobil-Look (tiefschwarz, Chrom, Cyan/Bernstein), Schriften Sora + Saira Condensed. Szenen: strasse, stopp, zuendung, silhouetten, cockpit, schluessel, leuchten, rechner, wolke, tacho, kennzeichen, preisschild, kuendbar, finale (`NACHT_EFFECTS`, Sounds `SFX_NACHT`). Scheinwerfer-Aufblitzen beim Schnitt, Vignette + Filmkorn, blaue Light Leaks. Kompositionen `AutoKontorNacht30` (9:16) / `AutoKontorNacht30Wide`.
  Stimme: `voice_piper.py --fassung nacht30 --klang tief --tempo 1.0 --pause 0.34 --takes 6` (tief – bewusst keine Nachbildung einer echten Person), Musik: `musik.py nacht30 --stil nacht`.
- Stimmen der übrigen Fassungen: Erklärvideo + `tiktok30` `voice_piper.py [--fassung tiktok30] --takes 4`, `premium30` `voice_offline.py --modell css10 --fassung premium30` (weiblich). Danach Timeline, Musik (`musik.py premium30` bzw. `--stil nacht`), Timeline nochmal. Das Laptop-Video (`AutoKontorLaptop30`) spielt `public/mockup/premium30-wide.mp4` ab – nach neuem Premium-16:9-Render dorthin kopieren.
- Echte Stimme (bester Klang): Nutzer spricht Text A (30 s, für tiktok30/premium30/nacht30) bzw. Text B (Erklärvideo) mit dem Handy ein, verbessert sie mit Adobe Podcast „Enhance Speech“ und schickt die Datei → `tools/synchron.py <fassung> datei` für jede Fassung mit diesem Text.
- **Studio-Hochformat** (`src/studio/Studio.tsx`, nach Vorlage des Nutzers „AutoKontor_Neu_Studio_9zu16“): fester Rahmen – oben Logo-Leiste, große Schlagzeile (2 Zeilen, schwarz/orange, wechselt je Abschnitt, `SECTIONS`), Kugel rechts; Mitte Karte mit dem Premium-Spot (in 1920×1080 gerendert und skaliert – die Szenen sind für 16:9 gebaut, andere Seitenverhältnisse schneiden ab); darunter Unterzeile, Merkmal-Chips (haken beim gesprochenen Wort ab), dunkle Leiste → am Ende oranger Button mit Preis + „zzgl. MwSt.“. Kompositionen `AutoKontorStudio` (Frauenstimme, Timeline premium30) und `AutoKontorStudioM` (Männerstimme, `skript-studio30m.txt` mit `# stimme: tiktok30`).
- **Sport-Stil** (`src/sport/`, `# stil: sport`): „AutoKontor Sport“ – Motorsport-/Sportwerbungs-Look, Neongelb (Volt) / Schwarz / Weiß (`S` in theme.ts), Schrift Barlow Condensed kursiv (`SFONT`, OFL, aus @fontsource). Szenen: fehlstart, ampel (Startampel – „Schluss.“ = Lichter aus), teamlogo, duell (großes/kleines Auto), tabelle (Zeitentabelle), boxenstopp (Klick-Knopf), sektoren (Zeitsektoren werden grün), heimspiel (Flutlicht + Schloss), rotekarte (Cloud fliegt vom Platz), serie (Ring + Wochentage), trikots (Windows/Mac/Linux), startnummer (Preis als Startnummer + zzgl. MwSt.), flex (Schalter „kündbar“), zielflagge (`SPORT_EFFECTS`, Sounds `SFX_SPORT`). Schnitte: schräger Wischbalken (`SportCuts`, Kontrastfarbe je Hintergrund), vor wichtigen Szenen voll deckend; Einblendung „LIVE 03/14“ (`SportHud`). Bewegungsunschärfe waagerecht per SVG-Filter (`xblur`). Kompositionen `AutoKontorSport30` / `AutoKontorSport30Wide`.
  Stimme: `voice_piper.py --fassung sport30 --tempo 0.9 --pause 0.22 --takes 5` (schneller = sportlicher), Musik: `musik.py sport30 --stil sport` (128 BPM, treibend, unter der Stimme −7 dB).
- Einzelne Frames prüfen: `node tools/still.mjs <Komposition> <frame> …` → `out/still/`.
- `--takes N` (voice_piper.py): erzeugt jeden Satz N-mal, Whisper hört ab, der klarste Take gewinnt.
- Keine Stimmen echter Personen nachbilden (z. B. bekannte Synchronsprecher) – nur mit deren Erlaubnis/Lizenz.

## Code-Struktur
- `src/theme.ts` – Markenname, Slogan, Button-Text, Preis + „zzgl. MwSt.“, Farben, Schriften. Texte im Endbild hier ändern.
- `src/Spot.tsx` – Zusammenbau: Bilder, Kamera-Punch, Filmkorn/Vignette, Sound (Stimme, Musik, SFX).
- `src/effects/text.tsx` – slam, glitch, stretch, flash, morph, type.
- `src/effects/scenes.tsx` – laptop, lock, os, doc, preis, end.
- `src/lib.tsx` – Wort-Timing, Zeilenumbruch, automatische Schriftgröße, Kamerawackler.
- `public/fonts` – Schriften lokal (Anton, Inter, JetBrains Mono). `public/sfx` – impact/whoosh/glitch.
- Optional in `public/`: `screenshot.png` (echte Software im Laptop), `musik.mp3`, `meine-stimme.wav`, `sprecher.mp3`.
- `tools/musik.py <fassung> [--stil sanft|kraftvoll]` – „sanft“ (Standard): ruhiges Bett aus Flächen, Filz-Klavier, Bass; wird unter der Stimme automatisch −8 dB leiser (Ducking aus voice-words.json). „kraftvoll“: komponiert treibende Werbemusik passend zum Schnitt (Spannung → Schlag bei „Schluss.“ → Drop beim Logo → Lift beim Preis → Schlussakkord) als `public/musik-<fassung>.mp3`. Erst Stimme + Timeline bauen, dann Musik, dann Timeline nochmal.
- `tools/beat.py` – erzeugt einen lizenzfreien Trap-Beat (150 BPM) als `public/musik.mp3`; eigene Musik einfach darüber ablegen.
- Dynamik (Spot.tsx `BeatView`): Wisch-Übergang + Blitz bei jedem Schnitt, Kamera-Kick auf jedem Wort. Kurze Skript-Zeilen (1–4 Wörter) = mehr Schnitte = mehr Tempo.

## Regeln
- Jedes Wort muss exakt zu seinem gesprochenen Zeitpunkt erscheinen – Timing nie per Hand in timeline.json ändern, sondern über die Pipeline neu bauen.
- Nach jeder Änderung an Skript, Effekten oder Layout: `npm run check` und die Standbilder prüfen: kein Text abgeschnitten oder am Rand klebend, alles lesbar, Look wirkt wie ein Premium-Edit.
- Preise immer mit Hinweis „zzgl. MwSt.“ im Bild (Bild `preis` und Endbild machen das automatisch).
- In `skript.txt` markiert `*Wort*` ein Wort rot (Effekt `type`); die Sternchen werden nicht gesprochen.
- Keine fremden Logos (Windows/Apple/Linux) und keine fremden Marken – eigene, schlichte Icons.
- Neue Effekte: als Komponente in `src/effects/` anlegen, in `EFFECTS` (Spot.tsx), `SFX_FOR` und in `tools/build-timeline.mjs` (EFFECTS-Liste) eintragen und in `skript.txt` dokumentieren.
- Remotion-Skills liegen in `.claude/skills/` (von github.com/remotion-dev/skills, z. B. `remotion-best-practices`, `remotion-markup` mit transitions/light-leaks/effects/motion-blur/voiceover) – vor Änderungen an Animation, Übergängen oder Audio dort nachlesen. Aktualisieren: `git clone --depth 1 https://github.com/remotion-dev/skills` und `skills/*` nach `.claude/skills/` kopieren.
- Effekte: `@remotion/effects` (Light Leaks über wichtigen Schnitten, Mischmodus soft-light) braucht WebGL → `Config.setChromiumOpenGlRenderer("angle")` (remotion.config.ts) bzw. `--gl=angle`.
- Soundeffekte im Premium-Stil: echte Interface-Sounds von Kenney (CC0, über github.com/kapishdima/soundcn) als `public/sfx/ui-*.wav`.
- Rendern auf schwachen PCs: `--concurrency 2` anhängen, wenn der Rechner hängt.
- Lizenz-Hinweis: Remotion ist kostenlos für Einzelpersonen und Firmen bis 3 Mitarbeiter, darüber braucht es eine Firmenlizenz.
