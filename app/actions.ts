"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";

function s(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}
function n(fd: FormData, k: string): number {
  const raw = s(fd, k).replace(/\./g, "").replace(",", ".");
  const v = parseFloat(raw);
  return Number.isFinite(v) ? v : 0;
}
function i(fd: FormData, k: string): number {
  const v = parseInt(s(fd, k), 10);
  return Number.isFinite(v) ? v : 0;
}
function nullable(v: string): string | null {
  return v === "" ? null : v;
}

/* ---------------- Objekt ---------------- */
export async function createObjekt(fd: FormData) {
  getDb()
    .prepare(
      "INSERT INTO objekt (name, strasse, plz, ort, baujahr, notiz) VALUES (?,?,?,?,?,?)",
    )
    .run(s(fd, "name"), s(fd, "strasse"), s(fd, "plz"), s(fd, "ort"), i(fd, "baujahr") || null, s(fd, "notiz"));
  revalidatePath("/objekte");
  redirect("/objekte");
}

export async function deleteObjekt(fd: FormData) {
  getDb().prepare("DELETE FROM objekt WHERE id = ?").run(i(fd, "id"));
  revalidatePath("/objekte");
  redirect("/objekte");
}

/* ---------------- Einheit ---------------- */
export async function createEinheit(fd: FormData) {
  const objektId = i(fd, "objekt_id");
  getDb()
    .prepare(
      "INSERT INTO einheit (objekt_id, bezeichnung, lage, wohnflaeche, zimmer) VALUES (?,?,?,?,?)",
    )
    .run(objektId, s(fd, "bezeichnung"), s(fd, "lage"), n(fd, "wohnflaeche"), n(fd, "zimmer"));
  revalidatePath(`/objekte/${objektId}`);
}

export async function deleteEinheit(fd: FormData) {
  const objektId = i(fd, "objekt_id");
  getDb().prepare("DELETE FROM einheit WHERE id = ?").run(i(fd, "id"));
  revalidatePath(`/objekte/${objektId}`);
}

/* ---------------- Mieter ---------------- */
export async function createMieter(fd: FormData) {
  getDb()
    .prepare("INSERT INTO mieter (vorname, nachname, email, telefon) VALUES (?,?,?,?)")
    .run(s(fd, "vorname"), s(fd, "nachname"), s(fd, "email"), s(fd, "telefon"));
  revalidatePath("/mieter");
}

export async function deleteMieter(fd: FormData) {
  getDb().prepare("DELETE FROM mieter WHERE id = ?").run(i(fd, "id"));
  revalidatePath("/mieter");
}

/* ---------------- Mietvertrag ---------------- */
export async function createVertrag(fd: FormData) {
  getDb()
    .prepare(
      `INSERT INTO mietvertrag (einheit_id, mieter_id, beginn, ende, kaltmiete, nk_vorauszahlung, personen)
       VALUES (?,?,?,?,?,?,?)`,
    )
    .run(
      i(fd, "einheit_id"),
      i(fd, "mieter_id"),
      s(fd, "beginn"),
      nullable(s(fd, "ende")),
      n(fd, "kaltmiete"),
      n(fd, "nk_vorauszahlung"),
      i(fd, "personen") || 1,
    );
  revalidatePath("/vertraege");
}

export async function deleteVertrag(fd: FormData) {
  getDb().prepare("DELETE FROM mietvertrag WHERE id = ?").run(i(fd, "id"));
  revalidatePath("/vertraege");
}

/* ---------------- Kostenart ---------------- */
export async function createKostenart(fd: FormData) {
  getDb()
    .prepare("INSERT INTO kostenart (name, schluessel, umlagefaehig) VALUES (?,?,?)")
    .run(s(fd, "name"), s(fd, "schluessel"), fd.get("umlagefaehig") ? 1 : 0);
  revalidatePath("/kosten");
}

export async function deleteKostenart(fd: FormData) {
  getDb().prepare("DELETE FROM kostenart WHERE id = ?").run(i(fd, "id"));
  revalidatePath("/kosten");
}

/* ---------------- Kostenbuchung ---------------- */
export async function createBuchung(fd: FormData) {
  getDb()
    .prepare(
      "INSERT INTO kostenbuchung (objekt_id, kostenart_id, jahr, betrag, beschreibung) VALUES (?,?,?,?,?)",
    )
    .run(i(fd, "objekt_id"), i(fd, "kostenart_id"), i(fd, "jahr"), n(fd, "betrag"), s(fd, "beschreibung"));
  revalidatePath("/kosten");
}

export async function deleteBuchung(fd: FormData) {
  getDb().prepare("DELETE FROM kostenbuchung WHERE id = ?").run(i(fd, "id"));
  revalidatePath("/kosten");
}

/* ---------------- Demo-Daten ---------------- */
export async function resetDemo() {
  const db = getDb();
  for (const t of [
    "zaehlerstand",
    "zaehler",
    "kostenbuchung",
    "mietvertrag",
    "kostenart",
    "mieter",
    "einheit",
    "objekt",
  ]) {
    db.exec(`DELETE FROM ${t};`);
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function seedDemo() {
  const db = getDb();
  const count = (db.prepare("SELECT COUNT(*) c FROM objekt").get() as { c: number }).c;
  if (count > 0) {
    redirect("/");
  }
  const jahr = new Date().getFullYear() - 1;

  const obj = db
    .prepare("INSERT INTO objekt (name, strasse, plz, ort, baujahr, notiz) VALUES (?,?,?,?,?,?)")
    .run("Mehrfamilienhaus Lindenstraße", "Lindenstraße 12", "10115", "Berlin", 1998, "6 Wohneinheiten");
  const objId = Number(obj.lastInsertRowid);

  const units = [
    ["EG links", "Erdgeschoss", 62.5, 2.5],
    ["EG rechts", "Erdgeschoss", 48.0, 2],
    ["1. OG links", "1. Obergeschoss", 74.0, 3],
    ["1. OG rechts", "1. Obergeschoss", 55.5, 2.5],
    ["2. OG", "2. Obergeschoss (Maisonette)", 96.0, 4],
    ["DG", "Dachgeschoss", 41.0, 1.5],
  ] as const;
  const einheitIds: number[] = [];
  const insE = db.prepare(
    "INSERT INTO einheit (objekt_id, bezeichnung, lage, wohnflaeche, zimmer) VALUES (?,?,?,?,?)",
  );
  for (const [bez, lage, fl, zi] of units) {
    einheitIds.push(Number(insE.run(objId, bez, lage, fl, zi).lastInsertRowid));
  }

  const tenants = [
    ["Anna", "Weber", 2, 480, 150, `${jahr}-01-01`, null],
    ["Mehmet", "Yilmaz", 1, 360, 110, `${jahr}-01-01`, null],
    ["Familie", "Schulz", 4, 620, 210, `${jahr}-01-01`, null],
    ["Laura", "Becker", 2, 500, 160, `${jahr}-04-01`, null], // Einzug unterm Jahr
    ["Jonas", "Krüger", 3, 790, 250, `${jahr}-01-01`, null],
    ["Sophie", "Hoffmann", 1, 340, 95, `${jahr}-01-01`, `${jahr}-09-30`], // Auszug unterm Jahr
  ] as const;
  const insM = db.prepare("INSERT INTO mieter (vorname, nachname) VALUES (?,?)");
  const insV = db.prepare(
    "INSERT INTO mietvertrag (einheit_id, mieter_id, beginn, ende, kaltmiete, nk_vorauszahlung, personen) VALUES (?,?,?,?,?,?,?)",
  );
  tenants.forEach((t, idx) => {
    const [vn, nn, pers, kalt, nk, beg, end] = t;
    const mId = Number(insM.run(vn, nn).lastInsertRowid);
    insV.run(einheitIds[idx], mId, beg, end, kalt, nk, pers);
  });

  const arten: Array<[string, string, number]> = [
    ["Grundsteuer", "WOHNFLAECHE", 1],
    ["Gebäudeversicherung", "WOHNFLAECHE", 1],
    ["Müllabfuhr", "PERSONEN", 1],
    ["Hausreinigung", "WOHNFLAECHE", 1],
    ["Hausmeister", "EINHEIT", 1],
    ["Allgemeinstrom", "WOHNFLAECHE", 1],
    ["Wasser / Abwasser", "PERSONEN", 1],
    ["Heizung", "VERBRAUCH", 1],
    ["Verwaltungskosten", "EINHEIT", 0], // nicht umlagefähig
    ["Instandhaltung", "WOHNFLAECHE", 0], // nicht umlagefähig
  ];
  const insK = db.prepare("INSERT INTO kostenart (name, schluessel, umlagefaehig) VALUES (?,?,?)");
  const insB = db.prepare(
    "INSERT INTO kostenbuchung (objekt_id, kostenart_id, jahr, betrag, beschreibung) VALUES (?,?,?,?,?)",
  );
  const betraege = [1240, 1850, 980, 1460, 2100, 540, 1720, 6400, 1800, 2300];
  arten.forEach(([name, sch, uml], idx) => {
    const kId = Number(insK.run(name, sch, uml).lastInsertRowid);
    insB.run(objId, kId, jahr, betraege[idx], `${name} ${jahr}`);
  });

  // Heizungs-Zähler (für Verbrauchsverteilung)
  const insZ = db.prepare("INSERT INTO zaehler (einheit_id, art, nummer) VALUES (?,?,?)");
  const insZs = db.prepare(
    "INSERT INTO zaehlerstand (zaehler_id, jahr, stand_anfang, stand_ende) VALUES (?,?,?,?)",
  );
  const verbrauch = [820, 610, 980, 700, 1250, 540];
  einheitIds.forEach((eid, idx) => {
    const zId = Number(insZ.run(eid, "HEIZUNG", `WMZ-${1000 + idx}`).lastInsertRowid);
    insZs.run(zId, jahr, 0, verbrauch[idx]);
  });

  revalidatePath("/", "layout");
  redirect("/");
}
