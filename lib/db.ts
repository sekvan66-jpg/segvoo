import "server-only";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";

// node:sqlite is a built-in module in Node 22. We load it via createRequire so
// the build never depends on @types/node shipping SQLite typings.
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { DatabaseSync } = require("node:sqlite") as { DatabaseSync: any };

export type Row = Record<string, unknown>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any;

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = process.env.SEGVOO_DB ?? path.join(DATA_DIR, "segvoo.sqlite");

// Reuse one connection across hot-reloads in dev.
const g = globalThis as unknown as { __segvooDb?: DB };

function createDb(): DB {
  // Verzeichnis der tatsächlichen DB-Datei anlegen (unterstützt SEGVOO_DB,
  // z.B. eine gemountete Disk unter /data).
  mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  migrate(db);
  return db;
}

export function getDb(): DB {
  if (!g.__segvooDb) g.__segvooDb = createDb();
  return g.__segvooDb;
}

function migrate(db: DB) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS objekt (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      strasse TEXT DEFAULT '',
      plz TEXT DEFAULT '',
      ort TEXT DEFAULT '',
      baujahr INTEGER,
      notiz TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS einheit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      objekt_id INTEGER NOT NULL REFERENCES objekt(id) ON DELETE CASCADE,
      bezeichnung TEXT NOT NULL,
      lage TEXT DEFAULT '',
      wohnflaeche REAL NOT NULL DEFAULT 0,
      zimmer REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS mieter (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vorname TEXT NOT NULL,
      nachname TEXT NOT NULL,
      email TEXT DEFAULT '',
      telefon TEXT DEFAULT '',
      strasse TEXT DEFAULT '',
      plz TEXT DEFAULT '',
      ort TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vermieter (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      firma TEXT DEFAULT '',
      name TEXT DEFAULT '',
      strasse TEXT DEFAULT '',
      plz TEXT DEFAULT '',
      ort TEXT DEFAULT '',
      telefon TEXT DEFAULT '',
      email TEXT DEFAULT '',
      iban TEXT DEFAULT '',
      bic TEXT DEFAULT '',
      bank TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS mietvertrag (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      einheit_id INTEGER NOT NULL REFERENCES einheit(id) ON DELETE CASCADE,
      mieter_id INTEGER NOT NULL REFERENCES mieter(id) ON DELETE CASCADE,
      beginn TEXT NOT NULL,
      ende TEXT,
      kaltmiete REAL NOT NULL DEFAULT 0,
      nk_vorauszahlung REAL NOT NULL DEFAULT 0,
      personen INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS kostenart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      schluessel TEXT NOT NULL DEFAULT 'WOHNFLAECHE',
      umlagefaehig INTEGER NOT NULL DEFAULT 1,
      zaehlerart TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS kostenbuchung (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      objekt_id INTEGER NOT NULL REFERENCES objekt(id) ON DELETE CASCADE,
      kostenart_id INTEGER NOT NULL REFERENCES kostenart(id) ON DELETE CASCADE,
      jahr INTEGER NOT NULL,
      betrag REAL NOT NULL DEFAULT 0,
      beschreibung TEXT DEFAULT '',
      datum TEXT DEFAULT (date('now'))
    );

    CREATE TABLE IF NOT EXISTS zaehler (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      einheit_id INTEGER NOT NULL REFERENCES einheit(id) ON DELETE CASCADE,
      art TEXT NOT NULL DEFAULT 'STROM',
      nummer TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS zaehlerstand (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      zaehler_id INTEGER NOT NULL REFERENCES zaehler(id) ON DELETE CASCADE,
      jahr INTEGER NOT NULL,
      stand_anfang REAL NOT NULL DEFAULT 0,
      stand_ende REAL NOT NULL DEFAULT 0
    );
  `);

  // Migrationen für bestehende Datenbanken.
  addColumnIfMissing(db, "mieter", "strasse", "TEXT DEFAULT ''");
  addColumnIfMissing(db, "mieter", "plz", "TEXT DEFAULT ''");
  addColumnIfMissing(db, "mieter", "ort", "TEXT DEFAULT ''");
  addColumnIfMissing(db, "vermieter", "bic", "TEXT DEFAULT ''");
  addColumnIfMissing(db, "kostenart", "zaehlerart", "TEXT DEFAULT ''");

  // Vermieter-Stammsatz (Einzelzeile) sicherstellen.
  db.exec("INSERT OR IGNORE INTO vermieter (id) VALUES (1);");
}

function addColumnIfMissing(db: DB, table: string, column: string, def: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def};`);
  }
}
