"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";

function s(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}
function num(fd: FormData, k: string): number {
  const raw = s(fd, k).replace(/\./g, "").replace(",", ".");
  const v = parseFloat(raw);
  return Number.isFinite(v) ? v : 0;
}
function int(fd: FormData, k: string): number {
  const v = parseInt(s(fd, k), 10);
  return Number.isFinite(v) ? v : 0;
}
function nullable(v: string): string | null {
  return v === "" ? null : v;
}

/* ---------------- Objekt ---------------- */
export async function saveObjekt(fd: FormData) {
  const id = int(fd, "id");
  const db = getDb();
  const args = [s(fd, "name"), s(fd, "strasse"), s(fd, "plz"), s(fd, "ort"), int(fd, "baujahr") || null, s(fd, "notiz")];
  if (id) {
    db.prepare("UPDATE objekt SET name=?, strasse=?, plz=?, ort=?, baujahr=?, notiz=? WHERE id=?").run(...args, id);
  } else {
    db.prepare("INSERT INTO objekt (name, strasse, plz, ort, baujahr, notiz) VALUES (?,?,?,?,?,?)").run(...args);
  }
  revalidatePath("/objekte");
  redirect("/objekte");
}

export async function deleteObjekt(fd: FormData) {
  getDb().prepare("DELETE FROM objekt WHERE id = ?").run(int(fd, "id"));
  revalidatePath("/objekte");
  redirect("/objekte");
}

/* ---------------- Einheit ---------------- */
export async function saveEinheit(fd: FormData) {
  const id = int(fd, "id");
  const objektId = int(fd, "objekt_id");
  const db = getDb();
  const args = [s(fd, "bezeichnung"), s(fd, "lage"), num(fd, "wohnflaeche"), num(fd, "zimmer")];
  if (id) {
    db.prepare("UPDATE einheit SET bezeichnung=?, lage=?, wohnflaeche=?, zimmer=? WHERE id=?").run(...args, id);
  } else {
    db.prepare("INSERT INTO einheit (objekt_id, bezeichnung, lage, wohnflaeche, zimmer) VALUES (?,?,?,?,?)").run(objektId, ...args);
  }
  revalidatePath(`/objekte/${objektId}`);
  redirect(`/objekte/${objektId}`);
}

export async function deleteEinheit(fd: FormData) {
  const objektId = int(fd, "objekt_id");
  getDb().prepare("DELETE FROM einheit WHERE id = ?").run(int(fd, "id"));
  revalidatePath(`/objekte/${objektId}`);
  redirect(`/objekte/${objektId}`);
}

/* ---------------- Mieter ---------------- */
export async function saveMieter(fd: FormData) {
  const id = int(fd, "id");
  const db = getDb();
  const args = [s(fd, "vorname"), s(fd, "nachname"), s(fd, "email"), s(fd, "telefon"), s(fd, "strasse"), s(fd, "plz"), s(fd, "ort")];
  if (id) {
    db.prepare("UPDATE mieter SET vorname=?, nachname=?, email=?, telefon=?, strasse=?, plz=?, ort=? WHERE id=?").run(...args, id);
  } else {
    db.prepare("INSERT INTO mieter (vorname, nachname, email, telefon, strasse, plz, ort) VALUES (?,?,?,?,?,?,?)").run(...args);
  }
  revalidatePath("/mieter");
  redirect("/mieter");
}

export async function deleteMieter(fd: FormData) {
  getDb().prepare("DELETE FROM mieter WHERE id = ?").run(int(fd, "id"));
  revalidatePath("/mieter");
  redirect("/mieter");
}

/* ---------------- Mietvertrag ---------------- */
export async function saveVertrag(fd: FormData) {
  const id = int(fd, "id");
  const db = getDb();
  const args = [
    int(fd, "einheit_id"),
    int(fd, "mieter_id"),
    s(fd, "beginn"),
    nullable(s(fd, "ende")),
    num(fd, "kaltmiete"),
    num(fd, "nk_vorauszahlung"),
    int(fd, "personen") || 1,
  ];
  if (id) {
    db.prepare(
      "UPDATE mietvertrag SET einheit_id=?, mieter_id=?, beginn=?, ende=?, kaltmiete=?, nk_vorauszahlung=?, personen=? WHERE id=?",
    ).run(...args, id);
  } else {
    db.prepare(
      "INSERT INTO mietvertrag (einheit_id, mieter_id, beginn, ende, kaltmiete, nk_vorauszahlung, personen) VALUES (?,?,?,?,?,?,?)",
    ).run(...args);
  }
  revalidatePath("/vertraege");
  redirect("/vertraege");
}

export async function deleteVertrag(fd: FormData) {
  getDb().prepare("DELETE FROM mietvertrag WHERE id = ?").run(int(fd, "id"));
  revalidatePath("/vertraege");
  redirect("/vertraege");
}

/* ---------------- Kostenart ---------------- */
export async function saveKostenart(fd: FormData) {
  const id = int(fd, "id");
  const db = getDb();
  const schluessel = s(fd, "schluessel");
  const zaehlerart = schluessel === "VERBRAUCH" ? s(fd, "zaehlerart") : "";
  const args = [s(fd, "name"), schluessel, fd.get("umlagefaehig") ? 1 : 0, zaehlerart];
  if (id) {
    db.prepare("UPDATE kostenart SET name=?, schluessel=?, umlagefaehig=?, zaehlerart=? WHERE id=?").run(...args, id);
  } else {
    db.prepare("INSERT INTO kostenart (name, schluessel, umlagefaehig, zaehlerart) VALUES (?,?,?,?)").run(...args);
  }
  revalidatePath("/kosten");
  redirect("/kosten");
}

export async function deleteKostenart(fd: FormData) {
  getDb().prepare("DELETE FROM kostenart WHERE id = ?").run(int(fd, "id"));
  revalidatePath("/kosten");
  redirect("/kosten");
}

/* ---------------- Kostenbuchung ---------------- */
export async function saveBuchung(fd: FormData) {
  const id = int(fd, "id");
  const db = getDb();
  const objektId = int(fd, "objekt_id");
  const jahr = int(fd, "jahr");
  const args = [objektId, int(fd, "kostenart_id"), jahr, num(fd, "betrag"), s(fd, "beschreibung")];
  if (id) {
    db.prepare("UPDATE kostenbuchung SET objekt_id=?, kostenart_id=?, jahr=?, betrag=?, beschreibung=? WHERE id=?").run(...args, id);
  } else {
    db.prepare("INSERT INTO kostenbuchung (objekt_id, kostenart_id, jahr, betrag, beschreibung) VALUES (?,?,?,?,?)").run(...args);
  }
  revalidatePath("/kosten");
  redirect(`/kosten?objekt=${objektId}&jahr=${jahr}`);
}

export async function deleteBuchung(fd: FormData) {
  const objektId = int(fd, "objekt_id");
  const jahr = int(fd, "jahr");
  getDb().prepare("DELETE FROM kostenbuchung WHERE id = ?").run(int(fd, "id"));
  revalidatePath("/kosten");
  redirect(`/kosten?objekt=${objektId}&jahr=${jahr}`);
}

/* ---------------- Zähler & Zählerstände ---------------- */
export async function saveZaehler(fd: FormData) {
  const objektId = int(fd, "objekt_id");
  const jahr = int(fd, "jahr");
  getDb()
    .prepare("INSERT INTO zaehler (einheit_id, art, nummer) VALUES (?,?,?)")
    .run(int(fd, "einheit_id"), s(fd, "art"), s(fd, "nummer"));
  revalidatePath("/zaehler");
  redirect(`/zaehler?objekt=${objektId}&jahr=${jahr}`);
}

export async function deleteZaehler(fd: FormData) {
  const objektId = int(fd, "objekt_id");
  const jahr = int(fd, "jahr");
  getDb().prepare("DELETE FROM zaehler WHERE id = ?").run(int(fd, "id"));
  revalidatePath("/zaehler");
  redirect(`/zaehler?objekt=${objektId}&jahr=${jahr}`);
}

export async function setZaehlerstand(fd: FormData) {
  const objektId = int(fd, "objekt_id");
  const zaehlerId = int(fd, "zaehler_id");
  const jahr = int(fd, "jahr");
  const anfang = num(fd, "stand_anfang");
  const ende = num(fd, "stand_ende");
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM zaehlerstand WHERE zaehler_id = ? AND jahr = ?")
    .get(zaehlerId, jahr) as { id: number } | undefined;
  if (existing) {
    db.prepare("UPDATE zaehlerstand SET stand_anfang=?, stand_ende=? WHERE id=?").run(anfang, ende, existing.id);
  } else {
    db.prepare("INSERT INTO zaehlerstand (zaehler_id, jahr, stand_anfang, stand_ende) VALUES (?,?,?,?)").run(
      zaehlerId,
      jahr,
      anfang,
      ende,
    );
  }
  revalidatePath("/zaehler");
  redirect(`/zaehler?objekt=${objektId}&jahr=${jahr}`);
}

/* ---------------- Vermieter / Einstellungen ---------------- */
export async function saveVermieter(fd: FormData) {
  getDb()
    .prepare(
      `UPDATE vermieter SET firma=?, name=?, strasse=?, plz=?, ort=?, telefon=?, email=?, iban=?, bic=?, bank=? WHERE id = 1`,
    )
    .run(
      s(fd, "firma"),
      s(fd, "name"),
      s(fd, "strasse"),
      s(fd, "plz"),
      s(fd, "ort"),
      s(fd, "telefon"),
      s(fd, "email"),
      s(fd, "iban"),
      s(fd, "bic"),
      s(fd, "bank"),
    );
  revalidatePath("/", "layout");
  redirect("/einstellungen");
}

/* ---------------- Demo-Daten ---------------- */
export async function resetDemo() {
  const db = getDb();
  for (const t of ["zaehlerstand", "zaehler", "kostenbuchung", "mietvertrag", "kostenart", "mieter", "einheit", "objekt"]) {
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
  const insE = db.prepare("INSERT INTO einheit (objekt_id, bezeichnung, lage, wohnflaeche, zimmer) VALUES (?,?,?,?,?)");
  for (const [bez, lage, fl, zi] of units) {
    einheitIds.push(Number(insE.run(objId, bez, lage, fl, zi).lastInsertRowid));
  }

  const tenants = [
    ["Anna", "Weber", 2, 480, 100, `${jahr}-01-01`, null],
    ["Mehmet", "Yilmaz", 1, 360, 110, `${jahr}-01-01`, null],
    ["Gönül", "Demir", 4, 620, 130, `${jahr}-01-01`, null],
    ["Laura", "Becker", 2, 500, 160, `${jahr}-04-01`, null],
    ["Jonas", "Krüger", 3, 790, 150, `${jahr}-01-01`, null],
    ["Sophie", "Hoffmann", 1, 340, 70, `${jahr}-01-01`, `${jahr}-09-30`],
  ] as const;
  const insM = db.prepare("INSERT INTO mieter (vorname, nachname, strasse, plz, ort) VALUES (?,?,?,?,?)");
  const insV = db.prepare(
    "INSERT INTO mietvertrag (einheit_id, mieter_id, beginn, ende, kaltmiete, nk_vorauszahlung, personen) VALUES (?,?,?,?,?,?,?)",
  );
  tenants.forEach((t, idx) => {
    const [vn, nn, pers, kalt, nk, beg, end] = t;
    const mId = Number(insM.run(vn, nn, "Lindenstraße 12", "10115", "Berlin").lastInsertRowid);
    insV.run(einheitIds[idx], mId, beg, end, kalt, nk, pers);
  });

  db.prepare(
    `UPDATE vermieter SET firma=?, name=?, strasse=?, plz=?, ort=?, telefon=?, email=?, iban=?, bic=?, bank=? WHERE id = 1`,
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

  const arten: Array<[string, string, number, string]> = [
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
  const insK = db.prepare("INSERT INTO kostenart (name, schluessel, umlagefaehig, zaehlerart) VALUES (?,?,?,?)");
  const insB = db.prepare("INSERT INTO kostenbuchung (objekt_id, kostenart_id, jahr, betrag, beschreibung) VALUES (?,?,?,?,?)");
  const betraege = [226.01, 420.82, 1090.24, 221.4, 325.38, 28.5, 1670.03, 4741.93, 60, 1800];
  arten.forEach(([name, sch, uml, za], idx) => {
    const kId = Number(insK.run(name, sch, uml, za).lastInsertRowid);
    insB.run(objId, kId, jahr, betraege[idx], `${name} ${jahr}`);
  });

  // Separate Zähler je Einheit: Heizung (WMZ) und Kaltwasser (WZ).
  const insZ = db.prepare("INSERT INTO zaehler (einheit_id, art, nummer) VALUES (?,?,?)");
  const insZs = db.prepare("INSERT INTO zaehlerstand (zaehler_id, jahr, stand_anfang, stand_ende) VALUES (?,?,?,?)");
  const heizung = [820, 610, 980, 700, 1250, 540];
  const wasser = [128, 95, 172, 140, 210, 84];
  einheitIds.forEach((eid, idx) => {
    const zH = Number(insZ.run(eid, "HEIZUNG", `WMZ-${1000 + idx}`).lastInsertRowid);
    insZs.run(zH, jahr, 0, heizung[idx]);
    const zW = Number(insZ.run(eid, "KALTWASSER", `WZ-${2000 + idx}`).lastInsertRowid);
    insZs.run(zW, jahr, 0, wasser[idx]);
  });

  revalidatePath("/", "layout");
  redirect("/");
}
