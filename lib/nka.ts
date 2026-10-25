import "server-only";
import { getDb } from "./db";
import {
  getObjekt,
  listEinheiten,
  listVertraege,
  listBuchungen,
  type VertragJoin,
} from "./queries";

/* ---------- Datumslogik ---------- */
function ymd(iso: string): number {
  // "YYYY-MM-DD..." -> UTC timestamp at midnight
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, (m || 1) - 1, d || 1);
}
const DAY = 86_400_000;

export function tageImJahr(jahr: number): number {
  return (Date.UTC(jahr + 1, 0, 1) - Date.UTC(jahr, 0, 1)) / DAY;
}

/** Nutzungstage des Vertrags innerhalb des Abrechnungsjahres (inkl. Grenztage). */
export function nutzungstage(v: VertragJoin, jahr: number): number {
  const jahrStart = Date.UTC(jahr, 0, 1);
  const jahrEnde = Date.UTC(jahr, 11, 31);
  const start = Math.max(ymd(v.beginn), jahrStart);
  const ende = Math.min(v.ende ? ymd(v.ende) : jahrEnde, jahrEnde);
  if (ende < start) return 0;
  return (ende - start) / DAY + 1;
}

/** Verbrauch (Summe aller Zählerdifferenzen) einer Einheit im Jahr. */
function einheitVerbrauch(einheitId: number, jahr: number): number {
  const row = getDb()
    .prepare(
      `SELECT COALESCE(SUM(s.stand_ende - s.stand_anfang), 0) AS v
       FROM zaehler z JOIN zaehlerstand s ON s.zaehler_id = z.id
       WHERE z.einheit_id = ? AND s.jahr = ?`,
    )
    .get(einheitId, jahr) as { v: number };
  return row.v;
}

/* ---------- Ergebnis-Typen ---------- */
export interface Posten {
  kostenart: string;
  schluessel: string;
  gesamtbetrag: number; // Gesamtbetrag der Kostenart im Objekt
  basisText: string; // z.B. "72,50 / 310,00 m²"
  anteil: number; // auf diesen Vertrag entfallender Betrag
}
export interface VertragsAbrechnung {
  vertrag: VertragJoin;
  nutzungstage: number;
  tageImJahr: number;
  posten: Posten[];
  summeUmlage: number;
  vorauszahlung: number;
  saldo: number; // > 0 Guthaben, < 0 Nachzahlung
}
export interface Abrechnung {
  jahr: number;
  objekt: NonNullable<ReturnType<typeof getObjekt>>;
  gesamtflaeche: number;
  anzahlEinheiten: number;
  summeKostenGesamt: number;
  summeUmlagefaehig: number;
  vertraege: VertragsAbrechnung[];
}

/* ---------- Abrechnung berechnen ---------- */
export function berechneAbrechnung(objektId: number, jahr: number): Abrechnung | null {
  const objekt = getObjekt(objektId);
  if (!objekt) return null;

  const einheiten = listEinheiten(objektId);
  const vertraege = listVertraege(objektId).filter((v) => nutzungstage(v, jahr) > 0);
  const buchungen = listBuchungen(objektId, jahr);
  const dIY = tageImJahr(jahr);

  const gesamtflaeche = einheiten.reduce((s, e) => s + e.wohnflaeche, 0);
  const anzahlEinheiten = einheiten.length;

  // Pro Kostenart: Gesamtbetrag aggregieren.
  const proArt = new Map<
    number,
    { name: string; schluessel: string; umlagefaehig: boolean; betrag: number }
  >();
  for (const b of buchungen) {
    const cur = proArt.get(b.kostenart_id) ?? {
      name: b.kostenart_name,
      schluessel: b.schluessel,
      umlagefaehig: !!b.umlagefaehig,
      betrag: 0,
    };
    cur.betrag += b.betrag;
    proArt.set(b.kostenart_id, cur);
  }

  const summeKostenGesamt = [...proArt.values()].reduce((s, a) => s + a.betrag, 0);
  const summeUmlagefaehig = [...proArt.values()]
    .filter((a) => a.umlagefaehig)
    .reduce((s, a) => s + a.betrag, 0);

  // Ergebnis je Vertrag initialisieren.
  const result: VertragsAbrechnung[] = vertraege.map((v) => ({
    vertrag: v,
    nutzungstage: nutzungstage(v, jahr),
    tageImJahr: dIY,
    posten: [],
    summeUmlage: 0,
    vorauszahlung: Math.round(v.nk_vorauszahlung * 12 * (nutzungstage(v, jahr) / dIY) * 100) / 100,
    saldo: 0,
  }));

  // Jede umlagefähige Kostenart verteilen.
  for (const art of proArt.values()) {
    if (!art.umlagefaehig || art.betrag === 0) continue;

    // Gewicht je Vertrag + Nenner je nach Schlüssel.
    const gewichte = result.map((r) => {
      const v = r.vertrag;
      const zeit = r.nutzungstage / dIY;
      switch (art.schluessel) {
        case "EINHEIT":
          // 1 Einheit, zeitanteilig; Nenner = alle Einheiten (Leerstand => Eigentümer).
          return { r, w: 1 * zeit, measure: 1 };
        case "PERSONEN":
          // Personen-Tage.
          return { r, w: v.personen * r.nutzungstage, measure: v.personen };
        case "VERBRAUCH": {
          const c = einheitVerbrauch(v.einheit_id, jahr);
          return { r, w: c, measure: c };
        }
        case "WOHNFLAECHE":
        default:
          return { r, w: v.wohnflaeche * zeit, measure: v.wohnflaeche };
      }
    });

    // Nenner bestimmen.
    let nenner: number;
    let basisTotal: string;
    if (art.schluessel === "WOHNFLAECHE") {
      nenner = gesamtflaeche; // volle Gebäudefläche (Leerstand beim Eigentümer)
      basisTotal = `${fmt(gesamtflaeche)} m²`;
    } else if (art.schluessel === "EINHEIT") {
      nenner = anzahlEinheiten;
      basisTotal = `${anzahlEinheiten} Einheiten`;
    } else {
      // PERSONEN / VERBRAUCH: Nenner = Summe der tatsächlichen Gewichte
      nenner = gewichte.reduce((s, g) => s + g.w, 0);
      basisTotal = art.schluessel === "PERSONEN" ? "Personen-Tage" : "Verbrauchseinheiten";
    }

    // Fallback: kein Verbrauch erfasst -> nach Wohnfläche verteilen.
    const verbrauchFallback = art.schluessel === "VERBRAUCH" && nenner === 0;
    if (verbrauchFallback) {
      nenner = gesamtflaeche;
      basisTotal = `${fmt(gesamtflaeche)} m² (ersatzweise)`;
    }

    for (const g of gewichte) {
      let anteil = 0;
      let basisText = "";
      if (art.schluessel === "WOHNFLAECHE" || verbrauchFallback) {
        const zeit = g.r.nutzungstage / dIY;
        anteil = nenner > 0 ? art.betrag * ((g.r.vertrag.wohnflaeche * zeit) / nenner) : 0;
        basisText = `${fmt(g.r.vertrag.wohnflaeche)} m² · ${g.r.nutzungstage}/${dIY} Tage`;
      } else if (art.schluessel === "EINHEIT") {
        const zeit = g.r.nutzungstage / dIY;
        anteil = nenner > 0 ? art.betrag * ((1 * zeit) / nenner) : 0;
        basisText = `1/${nenner} Einh. · ${g.r.nutzungstage}/${dIY} Tage`;
      } else if (art.schluessel === "PERSONEN") {
        anteil = nenner > 0 ? art.betrag * (g.w / nenner) : 0;
        basisText = `${g.measure} Pers. · ${g.r.nutzungstage}/${dIY} Tage`;
      } else {
        // VERBRAUCH mit Daten
        anteil = nenner > 0 ? art.betrag * (g.w / nenner) : 0;
        basisText = `${fmt(g.measure)} Verbr.`;
      }
      anteil = Math.round(anteil * 100) / 100;
      g.r.posten.push({
        kostenart: art.name,
        schluessel: art.schluessel,
        gesamtbetrag: art.betrag,
        basisText: `${basisText} von ${basisTotal}`,
        anteil,
      });
      g.r.summeUmlage += anteil;
    }
  }

  for (const r of result) {
    r.summeUmlage = Math.round(r.summeUmlage * 100) / 100;
    r.saldo = Math.round((r.vorauszahlung - r.summeUmlage) * 100) / 100;
  }

  return {
    jahr,
    objekt,
    gesamtflaeche,
    anzahlEinheiten,
    summeKostenGesamt,
    summeUmlagefaehig,
    vertraege: result,
  };
}

function fmt(n: number): string {
  return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(n);
}
