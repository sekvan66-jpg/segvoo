import "server-only";
import { getDb } from "./db";

export interface Objekt {
  id: number;
  name: string;
  strasse: string;
  plz: string;
  ort: string;
  baujahr: number | null;
  notiz: string;
}
export interface Einheit {
  id: number;
  objekt_id: number;
  bezeichnung: string;
  lage: string;
  wohnflaeche: number;
  zimmer: number;
}
export interface Mieter {
  id: number;
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  strasse: string;
  plz: string;
  ort: string;
}
export interface Vermieter {
  id: number;
  firma: string;
  name: string;
  strasse: string;
  plz: string;
  ort: string;
  telefon: string;
  email: string;
  iban: string;
  bic: string;
  bank: string;
}
export interface Mietvertrag {
  id: number;
  einheit_id: number;
  mieter_id: number;
  beginn: string;
  ende: string | null;
  kaltmiete: number;
  nk_vorauszahlung: number;
  personen: number;
}
export interface Kostenart {
  id: number;
  name: string;
  schluessel: string;
  umlagefaehig: number;
}
export interface Kostenbuchung {
  id: number;
  objekt_id: number;
  kostenart_id: number;
  jahr: number;
  betrag: number;
  beschreibung: string;
  datum: string;
}

const q = () => getDb();

/* ---------------- Objekte ---------------- */
export function listObjekte(): Objekt[] {
  return q().prepare("SELECT * FROM objekt ORDER BY name").all() as Objekt[];
}
export function getObjekt(id: number): Objekt | undefined {
  return q().prepare("SELECT * FROM objekt WHERE id = ?").get(id) as Objekt | undefined;
}

/* ---------------- Einheiten ---------------- */
export function listEinheiten(objektId?: number): Einheit[] {
  if (objektId != null) {
    return q()
      .prepare("SELECT * FROM einheit WHERE objekt_id = ? ORDER BY bezeichnung")
      .all(objektId) as Einheit[];
  }
  return q().prepare("SELECT * FROM einheit ORDER BY bezeichnung").all() as Einheit[];
}
export function getEinheit(id: number): Einheit | undefined {
  return q().prepare("SELECT * FROM einheit WHERE id = ?").get(id) as Einheit | undefined;
}

/* ---------------- Mieter ---------------- */
export function listMieter(): Mieter[] {
  return q()
    .prepare("SELECT * FROM mieter ORDER BY nachname, vorname")
    .all() as Mieter[];
}

/* ---------------- Vermieter (Stammdaten) ---------------- */
export function getVermieter(): Vermieter {
  return q().prepare("SELECT * FROM vermieter WHERE id = 1").get() as Vermieter;
}

/* ---------------- Mietverträge ---------------- */
export interface VertragJoin extends Mietvertrag {
  mieter_name: string;
  mieter_strasse: string;
  mieter_plz: string;
  mieter_ort: string;
  einheit_bez: string;
  objekt_id: number;
  objekt_name: string;
  wohnflaeche: number;
}
export function listVertraege(objektId?: number): VertragJoin[] {
  const sql = `
    SELECT v.*, (m.vorname || ' ' || m.nachname) AS mieter_name,
           m.strasse AS mieter_strasse, m.plz AS mieter_plz, m.ort AS mieter_ort,
           e.bezeichnung AS einheit_bez, e.wohnflaeche AS wohnflaeche,
           o.id AS objekt_id, o.name AS objekt_name
    FROM mietvertrag v
    JOIN mieter m ON m.id = v.mieter_id
    JOIN einheit e ON e.id = v.einheit_id
    JOIN objekt o ON o.id = e.objekt_id
    ${objektId != null ? "WHERE o.id = ?" : ""}
    ORDER BY o.name, e.bezeichnung`;
  const stmt = q().prepare(sql);
  return (objektId != null ? stmt.all(objektId) : stmt.all()) as VertragJoin[];
}
export function getVertrag(id: number): VertragJoin | undefined {
  return q()
    .prepare(
      `SELECT v.*, (m.vorname || ' ' || m.nachname) AS mieter_name,
              m.strasse AS mieter_strasse, m.plz AS mieter_plz, m.ort AS mieter_ort,
              e.bezeichnung AS einheit_bez, e.wohnflaeche AS wohnflaeche,
              o.id AS objekt_id, o.name AS objekt_name
       FROM mietvertrag v
       JOIN mieter m ON m.id = v.mieter_id
       JOIN einheit e ON e.id = v.einheit_id
       JOIN objekt o ON o.id = e.objekt_id
       WHERE v.id = ?`,
    )
    .get(id) as VertragJoin | undefined;
}

/* ---------------- Kostenarten ---------------- */
export function listKostenarten(): Kostenart[] {
  return q().prepare("SELECT * FROM kostenart ORDER BY name").all() as Kostenart[];
}

/* ---------------- Kostenbuchungen ---------------- */
export interface BuchungJoin extends Kostenbuchung {
  kostenart_name: string;
  schluessel: string;
  umlagefaehig: number;
}
export function listBuchungen(objektId: number, jahr: number): BuchungJoin[] {
  return q()
    .prepare(
      `SELECT b.*, k.name AS kostenart_name, k.schluessel AS schluessel,
              k.umlagefaehig AS umlagefaehig
       FROM kostenbuchung b JOIN kostenart k ON k.id = b.kostenart_id
       WHERE b.objekt_id = ? AND b.jahr = ?
       ORDER BY k.name`,
    )
    .all(objektId, jahr) as BuchungJoin[];
}

export function jahreMitBuchungen(objektId: number): number[] {
  const rows = q()
    .prepare("SELECT DISTINCT jahr FROM kostenbuchung WHERE objekt_id = ? ORDER BY jahr DESC")
    .all(objektId) as { jahr: number }[];
  return rows.map((r) => r.jahr);
}

/* ---------------- Zähler & Zählerstände ---------------- */
export interface ZaehlerRow {
  id: number;
  einheit_id: number;
  art: string;
  nummer: string;
  einheit_bez: string;
  stand_anfang: number | null;
  stand_ende: number | null;
  verbrauch: number | null;
}
export function listZaehler(objektId: number, jahr: number): ZaehlerRow[] {
  return q()
    .prepare(
      `SELECT z.id, z.einheit_id, z.art, z.nummer, e.bezeichnung AS einheit_bez,
              s.stand_anfang AS stand_anfang, s.stand_ende AS stand_ende,
              CASE WHEN s.id IS NULL THEN NULL ELSE (s.stand_ende - s.stand_anfang) END AS verbrauch
       FROM zaehler z
       JOIN einheit e ON e.id = z.einheit_id
       LEFT JOIN zaehlerstand s ON s.zaehler_id = z.id AND s.jahr = ?
       WHERE e.objekt_id = ?
       ORDER BY e.bezeichnung, z.art`,
    )
    .all(jahr, objektId) as ZaehlerRow[];
}

/* ---------------- Kennzahlen ---------------- */
export function kennzahlen() {
  const db = q();
  const objekte = (db.prepare("SELECT COUNT(*) c FROM objekt").get() as { c: number }).c;
  const einheiten = (db.prepare("SELECT COUNT(*) c FROM einheit").get() as { c: number }).c;
  const vertraege = (
    db.prepare("SELECT COUNT(*) c FROM mietvertrag WHERE ende IS NULL OR ende >= date('now')").get() as {
      c: number;
    }
  ).c;
  const flaeche = (db.prepare("SELECT COALESCE(SUM(wohnflaeche),0) s FROM einheit").get() as {
    s: number;
  }).s;
  const kaltmiete = (
    db
      .prepare("SELECT COALESCE(SUM(kaltmiete),0) s FROM mietvertrag WHERE ende IS NULL OR ende >= date('now')")
      .get() as { s: number }
  ).s;
  return { objekte, einheiten, vertraege, flaeche, kaltmiete };
}
