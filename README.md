# Segvoo – Hausverwaltung & Nebenkostenabrechnung

Eine schlanke Web-App für Vermieter und kleine Hausverwaltungen: Immobilien,
Einheiten, Mieter und Mietverträge verwalten – und daraus **tagesgenaue
Nebenkostenabrechnungen** erstellen.

> Eigenständige Anwendung mit eigenem Code und Branding. Inspiriert vom
> Funktionsumfang gängiger Hausverwaltungs-Software, aber ohne fremde Inhalte.

## Funktionen

- **Dashboard** – Kennzahlen zum Portfolio (Objekte, Einheiten, Fläche, Mieten)
- **Objekte** – Gebäude mit Adresse und Baujahr
- **Einheiten** – Wohnungen je Objekt (Fläche, Zimmer, Lage, Status)
- **Mieter** & **Mietverträge** – Kaltmiete, NK-Vorauszahlung, Personen, Zeitraum
- **Betriebskosten** – Kostenarten mit Verteilerschlüssel + Jahresbuchungen
- **Nebenkostenabrechnung** – pro Mieter, tagesgenaue Umlage, Vorauszahlung
  gegengerechnet → Nachzahlung/Guthaben, mit Druck-/PDF-Ansicht

### Verteilerschlüssel

| Schlüssel     | Verteilung                                                        |
| ------------- | ----------------------------------------------------------------- |
| `WOHNFLAECHE` | nach m², Nenner = gesamte Gebäudefläche (Leerstand → Eigentümer)  |
| `EINHEIT`     | pro Wohneinheit, zeitanteilig                                     |
| `PERSONEN`    | nach Personen-Tagen                                               |
| `VERBRAUCH`   | nach erfassten Zählerständen (Fallback: Wohnfläche)               |

Alle zeitbasierten Schlüssel werden anhand der **Nutzungstage** im
Abrechnungsjahr anteilig berechnet (Ein-/Auszug unterm Jahr wird korrekt
berücksichtigt).

## Tech-Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **`node:sqlite`** – die in Node 22 eingebaute SQLite-Engine (keine nativen
  Abhängigkeiten, kein zusätzlicher Download)
- Persistenz als SQLite-Datei unter `data/segvoo.sqlite` (per `SEGVOO_DB`
  überschreibbar)

## Entwicklung

```bash
npm install
npm run dev      # http://localhost:3000
```

Auf der Übersichtsseite **„Beispieldaten laden"** klicken – es wird ein
Mehrfamilienhaus mit 6 Einheiten, Mietern, Verträgen (inkl. Ein-/Auszug unterm
Jahr) und Betriebskosten für das Vorjahr angelegt. Danach unter
**Nebenkostenabrechnung** Objekt + Jahr wählen und die Abrechnungen erzeugen.

```bash
npm run build && npm start   # Produktionsbuild
```

## Projektstruktur

```
app/            Routen (App Router) + Server Actions
  page.tsx                Dashboard
  objekte/                Objekte + Einheiten
  mieter/ vertraege/      Stammdaten
  kosten/                 Kostenarten & Buchungen
  abrechnung/             NKA-Übersicht + Druckansicht
lib/
  db.ts                   SQLite-Verbindung + Schema
  queries.ts              Lesezugriffe
  nka.ts                  Abrechnungs-Engine
  format.ts               de-DE-Formatierung
components/                Nav + UI-Bausteine
```

## Haftungshinweis

Die erzeugten Abrechnungen sind ein Hilfsmittel und ersetzen keine rechtliche
Prüfung. Vor dem Versand an Mieter sind alle Angaben zu kontrollieren.
