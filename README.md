# cek mobile – Nebenkostenabrechnung & Hausverwaltung

Eine schlanke Web-App für Vermieter und kleine Hausverwaltungen: Immobilien,
Einheiten, Mieter und Mietverträge verwalten – und daraus **professionelle,
druckfertige Nebenkostenabrechnungen** erstellen.

> Eigenständige Anwendung mit eigenem Code, eigenem Logo und Branding.

## Funktionen

- **Dashboard** – Kennzahlen zum Portfolio (Objekte, Einheiten, Fläche, Mieten)
- **Objekte & Einheiten** – Gebäude und Wohnungen (Fläche, Zimmer, Lage, Status)
- **Mieter & Mietverträge** – Adresse, Kaltmiete, NK-Vorauszahlung, Personen, Zeitraum
- **Betriebskosten** – Kostenarten mit Verteilerschlüssel + Jahresbuchungen
- **Zähler & Zählerstände** – Grundlage für den Verbrauchsschlüssel
- **Nebenkostenabrechnung** – pro Mieter, tagesgenaue Umlage, Vorauszahlung
  gegengerechnet → Nachzahlung/Guthaben, **druckfertige A4-Vorlage** im
  gewohnten Format (Spalten *Kostenart · Gesamt · Gesamtbetrag [€] · Anteil ·
  Anteil [€]*, Briefkopf, Empfängerblock, Betreff, Bankzeile mit IBAN + BIC,
  Unterschrift)
- **Einstellungen** – Vermieter-/Bankdaten als Briefkopf für jede Abrechnung
- **Vollständiges CRUD** – alle Stammdaten lassen sich anlegen, **bearbeiten** und löschen
- **Logo** – eigenes SVG (Haus + Haken), auch als Favicon

### Verteilerschlüssel

| Schlüssel     | Verteilung                                                        |
| ------------- | ----------------------------------------------------------------- |
| `WOHNFLAECHE` | nach m², Nenner = gesamte Gebäudefläche (Leerstand → Eigentümer)  |
| `EINHEIT`     | pro Wohneinheit, zeitanteilig                                     |
| `PERSONEN`    | nach Personen-Tagen                                               |
| `VERBRAUCH`   | nach erfassten Zählerständen (Fallback: Wohnfläche)               |

Zeitbasierte Schlüssel werden anhand der **Nutzungstage** im Abrechnungsjahr
anteilig berechnet (Ein-/Auszug unterm Jahr wird korrekt berücksichtigt).

## Schnellstart (Web-App)

```bash
npm install
npm run seed     # Beispieldaten (MFH mit 6 Einheiten, Verträgen, Kosten)
npm run dev      # http://localhost:3000
```

1. **Beispieldaten laden** (Button auf der Übersicht oder `npm run seed`)
2. Unter **Einstellungen** die eigenen Vermieter-/Bankdaten eintragen
3. Unter **Nebenkostenabrechnung** Objekt + Jahr wählen → pro Mieter die
   druckfertige Abrechnung öffnen und über **Drucken / PDF** speichern

Produktionsbuild:

```bash
npm run build && npm start
```

## Tech-Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **`node:sqlite`** – die in Node 22 eingebaute SQLite-Engine (keine nativen
  Abhängigkeiten, kein zusätzlicher Download)
- Persistenz als SQLite-Datei unter `data/cek.sqlite` bzw. `data/segvoo.sqlite`
  (per `SEGVOO_DB` überschreibbar)

## Projektstruktur

```
app/            Routen (App Router) + Server Actions
  page.tsx                Dashboard
  objekte/                Objekte + Einheiten
  mieter/ vertraege/      Stammdaten
  kosten/                 Kostenarten & Buchungen
  abrechnung/             NKA-Übersicht + druckfertige Vorlage
  einstellungen/          Vermieter-/Bankdaten
  icon.svg                Favicon
lib/
  db.ts                   SQLite-Verbindung + Schema/Migration
  queries.ts              Lesezugriffe
  nka.ts                  Abrechnungs-Engine
  format.ts               de-DE-Formatierung
components/
  Logo.tsx                Logo (Bild- + Wortmarke)
  Nav.tsx, ui.tsx         Navigation + UI-Bausteine
```

## Haftungshinweis

Die erzeugten Abrechnungen sind ein Hilfsmittel und ersetzen keine rechtliche
Prüfung. Vor dem Versand an Mieter sind alle Angaben zu kontrollieren.
