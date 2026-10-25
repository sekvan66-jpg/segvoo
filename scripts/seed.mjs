// Standalone-Seed: füllt die SQLite-Datenbank mit Demodaten.
// Nutzung:  npm run seed   (oder: node --no-warnings scripts/seed.mjs)
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = process.env.SEGVOO_DB ?? path.join(DATA_DIR, "segvoo.sqlite");
mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA foreign_keys = ON;");
db.exec(`
  CREATE TABLE IF NOT EXISTS objekt (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, strasse TEXT DEFAULT '', plz TEXT DEFAULT '', ort TEXT DEFAULT '', baujahr INTEGER, notiz TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS einheit (id INTEGER PRIMARY KEY AUTOINCREMENT, objekt_id INTEGER NOT NULL REFERENCES objekt(id) ON DELETE CASCADE, bezeichnung TEXT NOT NULL, lage TEXT DEFAULT '', wohnflaeche REAL NOT NULL DEFAULT 0, zimmer REAL DEFAULT 0, created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS mieter (id INTEGER PRIMARY KEY AUTOINCREMENT, vorname TEXT NOT NULL, nachname TEXT NOT NULL, email TEXT DEFAULT '', telefon TEXT DEFAULT '', strasse TEXT DEFAULT '', plz TEXT DEFAULT '', ort TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS vermieter (id INTEGER PRIMARY KEY CHECK (id = 1), firma TEXT DEFAULT '', name TEXT DEFAULT '', strasse TEXT DEFAULT '', plz TEXT DEFAULT '', ort TEXT DEFAULT '', telefon TEXT DEFAULT '', email TEXT DEFAULT '', iban TEXT DEFAULT '', bic TEXT DEFAULT '', bank TEXT DEFAULT '');
  CREATE TABLE IF NOT EXISTS mietvertrag (id INTEGER PRIMARY KEY AUTOINCREMENT, einheit_id INTEGER NOT NULL REFERENCES einheit(id) ON DELETE CASCADE, mieter_id INTEGER NOT NULL REFERENCES mieter(id) ON DELETE CASCADE, beginn TEXT NOT NULL, ende TEXT, kaltmiete REAL NOT NULL DEFAULT 0, nk_vorauszahlung REAL NOT NULL DEFAULT 0, personen INTEGER NOT NULL DEFAULT 1, created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS kostenart (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, schluessel TEXT NOT NULL DEFAULT 'WOHNFLAECHE', umlagefaehig INTEGER NOT NULL DEFAULT 1, zaehlerart TEXT DEFAULT '');
  CREATE TABLE IF NOT EXISTS kostenbuchung (id INTEGER PRIMARY KEY AUTOINCREMENT, objekt_id INTEGER NOT NULL REFERENCES objekt(id) ON DELETE CASCADE, kostenart_id INTEGER NOT NULL REFERENCES kostenart(id) ON DELETE CASCADE, jahr INTEGER NOT NULL, betrag REAL NOT NULL DEFAULT 0, beschreibung TEXT DEFAULT '', datum TEXT DEFAULT (date('now')));
  CREATE TABLE IF NOT EXISTS zaehler (id INTEGER PRIMARY KEY AUTOINCREMENT, einheit_id INTEGER NOT NULL REFERENCES einheit(id) ON DELETE CASCADE, art TEXT NOT NULL DEFAULT 'STROM', nummer TEXT DEFAULT '');
  CREATE TABLE IF NOT EXISTS zaehlerstand (id INTEGER PRIMARY KEY AUTOINCREMENT, zaehler_id INTEGER NOT NULL REFERENCES zaehler(id) ON DELETE CASCADE, jahr INTEGER NOT NULL, stand_anfang REAL NOT NULL DEFAULT 0, stand_ende REAL NOT NULL DEFAULT 0);
`);
db.exec("INSERT OR IGNORE INTO vermieter (id) VALUES (1);");

const count = db.prepare("SELECT COUNT(*) c FROM objekt").get().c;
if (count > 0) {
  console.log("Datenbank enthält bereits Daten – Seed übersprungen.");
  process.exit(0);
}

const jahr = new Date().getFullYear() - 1;
const objId = Number(
  db
    .prepare("INSERT INTO objekt (name, strasse, plz, ort, baujahr, notiz) VALUES (?,?,?,?,?,?)")
    .run("Mehrfamilienhaus Lindenstraße", "Lindenstraße 12", "10115", "Berlin", 1998, "6 Wohneinheiten")
    .lastInsertRowid,
);

const units = [
  ["EG links", "Erdgeschoss", 62.5, 2.5],
  ["EG rechts", "Erdgeschoss", 48.0, 2],
  ["1. OG links", "1. Obergeschoss", 74.0, 3],
  ["1. OG rechts", "1. Obergeschoss", 55.5, 2.5],
  ["2. OG", "2. Obergeschoss (Maisonette)", 96.0, 4],
  ["DG", "Dachgeschoss", 41.0, 1.5],
];
const einheitIds = [];
const insE = db.prepare("INSERT INTO einheit (objekt_id, bezeichnung, lage, wohnflaeche, zimmer) VALUES (?,?,?,?,?)");
for (const [bez, lage, fl, zi] of units) einheitIds.push(Number(insE.run(objId, bez, lage, fl, zi).lastInsertRowid));

const tenants = [
  ["Anna", "Weber", 2, 480, 100, `${jahr}-01-01`, null],
  ["Mehmet", "Yilmaz", 1, 360, 110, `${jahr}-01-01`, null],
  ["Gönül", "Demir", 4, 620, 130, `${jahr}-01-01`, null],
  ["Laura", "Becker", 2, 500, 160, `${jahr}-04-01`, null],
  ["Jonas", "Krüger", 3, 790, 150, `${jahr}-01-01`, null],
  ["Sophie", "Hoffmann", 1, 340, 70, `${jahr}-01-01`, `${jahr}-09-30`],
];
const insM = db.prepare("INSERT INTO mieter (vorname, nachname, strasse, plz, ort) VALUES (?,?,?,?,?)");
const insV = db.prepare("INSERT INTO mietvertrag (einheit_id, mieter_id, beginn, ende, kaltmiete, nk_vorauszahlung, personen) VALUES (?,?,?,?,?,?,?)");
tenants.forEach((t, idx) => {
  const [vn, nn, pers, kalt, nk, beg, end] = t;
  const mId = Number(insM.run(vn, nn, "Lindenstraße 12", "10115", "Berlin").lastInsertRowid);
  insV.run(einheitIds[idx], mId, beg, end, kalt, nk, pers);
});

db.prepare(
  "UPDATE vermieter SET firma=?, name=?, strasse=?, plz=?, ort=?, telefon=?, email=?, iban=?, bic=?, bank=? WHERE id = 1",
).run(
  "cek mobile Hausverwaltung",
  "C. Ekinci",
  "Verwaltungsweg 3",
  "10407",
  "Berlin",
  "+49 30 1234567",
  "kontakt@cek-mobile.de",
  "DE12 3456 7890 1234 5678 90",
  "BELADEBEXXX",
  "Berliner Sparkasse",
);

const arten = [
  ["Abfallkosten", "WOHNFLAECHE", 1, ""],
  ["Grundsteuer", "WOHNFLAECHE", 1, ""],
  ["Gebäudeversicherung", "WOHNFLAECHE", 1, ""],
  ["Niederschlagswasser", "WOHNFLAECHE", 1, ""],
  ["Allgemeinstrom / Beleuchtung", "WOHNFLAECHE", 1, ""],
  ["Wartung Feuerlöscher", "EINHEIT", 1, ""],
  ["Wasserkosten + Kanal", "VERBRAUCH", 1, "KALTWASSER"],
  ["Heizung", "VERBRAUCH", 1, "HEIZUNG"],
  ["Winterdienst", "WOHNFLAECHE", 1, ""],
  ["Verwaltungskosten", "EINHEIT", 0, ""],
];
const betraege = [226.01, 420.82, 1090.24, 221.4, 325.38, 28.5, 1670.03, 4741.93, 60, 1800];
const insK = db.prepare("INSERT INTO kostenart (name, schluessel, umlagefaehig, zaehlerart) VALUES (?,?,?,?)");
const insB = db.prepare("INSERT INTO kostenbuchung (objekt_id, kostenart_id, jahr, betrag, beschreibung) VALUES (?,?,?,?,?)");
arten.forEach(([name, sch, uml, za], idx) => {
  const kId = Number(insK.run(name, sch, uml, za).lastInsertRowid);
  insB.run(objId, kId, jahr, betraege[idx], `${name} ${jahr}`);
});

const heizung = [820, 610, 980, 700, 1250, 540];
const wasser = [128, 95, 172, 140, 210, 84];
const insZ = db.prepare("INSERT INTO zaehler (einheit_id, art, nummer) VALUES (?,?,?)");
const insZs = db.prepare("INSERT INTO zaehlerstand (zaehler_id, jahr, stand_anfang, stand_ende) VALUES (?,?,?,?)");
einheitIds.forEach((eid, idx) => {
  const zH = Number(insZ.run(eid, "HEIZUNG", `WMZ-${1000 + idx}`).lastInsertRowid);
  insZs.run(zH, jahr, 0, heizung[idx]);
  const zW = Number(insZ.run(eid, "KALTWASSER", `WZ-${2000 + idx}`).lastInsertRowid);
  insZs.run(zW, jahr, 0, wasser[idx]);
});

console.log(`Seed abgeschlossen für Abrechnungsjahr ${jahr}: 1 Objekt, 6 Einheiten, 6 Verträge, 10 Kostenarten, Vermieter-Stammdaten.`);
