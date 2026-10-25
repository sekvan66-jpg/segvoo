import Link from "next/link";
import { notFound } from "next/navigation";
import { getVertrag } from "@/lib/queries";
import { berechneAbrechnung } from "@/lib/nka";
import { euro, datum, SCHLUESSEL_LABEL } from "@/lib/format";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

export default async function AbrechnungDetail({
  params,
}: {
  params: Promise<{ vertragId: string; jahr: string }>;
}) {
  const { vertragId, jahr: jahrStr } = await params;
  const vId = Number(vertragId);
  const jahr = Number(jahrStr);
  const vertrag = getVertrag(vId);
  if (!vertrag) notFound();

  const abr = berechneAbrechnung(vertrag.objekt_id, jahr);
  const row = abr?.vertraege.find((v) => v.vertrag.id === vId);
  if (!abr || !row) notFound();

  const nachzahlung = row.saldo < 0;

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <Link href={`/abrechnung?objekt=${vertrag.objekt_id}&jahr=${jahr}`} className="btn btn-ghost">
          ← Zurück
        </Link>
        <PrintButton />
      </div>

      <div className="card" style={{ padding: "2rem" }}>
        {/* Kopf */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.2rem" }}>Segvoo Hausverwaltung</div>
            <div style={{ color: "var(--muted)", fontSize: ".85rem" }}>
              {abr.objekt.name}
              <br />
              {abr.objekt.strasse}, {abr.objekt.plz} {abr.objekt.ort}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="badge">Betriebskostenabrechnung {jahr}</div>
            <div style={{ fontSize: ".8rem", color: "var(--muted)", marginTop: ".4rem" }}>
              erstellt am {datum(new Date().toISOString())}
            </div>
          </div>
        </div>

        <h1 style={{ fontSize: "1.35rem", fontWeight: 800, margin: "0 0 .25rem" }}>
          Nebenkostenabrechnung für {row.vertrag.mieter_name}
        </h1>
        <p style={{ color: "var(--muted)", margin: "0 0 1.25rem", fontSize: ".9rem" }}>
          Einheit {row.vertrag.einheit_bez} · Wohnfläche {row.vertrag.wohnflaeche} m² · {row.vertrag.personen} Person(en)
          <br />
          Abrechnungszeitraum: {datum(`${jahr}-01-01`)} – {datum(`${jahr}-12-31`)} · Nutzungsdauer:{" "}
          {row.nutzungstage} von {row.tageImJahr} Tagen
          <br />
          Mietverhältnis: {datum(row.vertrag.beginn)} – {row.vertrag.ende ? datum(row.vertrag.ende) : "unbefristet"}
        </p>

        {/* Kostenaufstellung */}
        <table className="data" style={{ marginBottom: "1.25rem" }}>
          <thead>
            <tr>
              <th>Kostenart</th>
              <th>Verteilerschlüssel</th>
              <th style={{ textAlign: "right" }}>Gesamtkosten</th>
              <th>Ihr Anteil (Basis)</th>
              <th style={{ textAlign: "right" }}>Ihr Betrag</th>
            </tr>
          </thead>
          <tbody>
            {row.posten.map((p, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 600 }}>{p.kostenart}</td>
                <td style={{ color: "var(--muted)", fontSize: ".82rem" }}>
                  {SCHLUESSEL_LABEL[p.schluessel] ?? p.schluessel}
                </td>
                <td style={{ textAlign: "right" }}>{euro(p.gesamtbetrag)}</td>
                <td style={{ color: "var(--muted)", fontSize: ".78rem" }}>{p.basisText}</td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>{euro(p.anteil)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} style={{ textAlign: "right", fontWeight: 700, paddingTop: ".75rem" }}>
                Summe Ihrer umlagefähigen Betriebskosten
              </td>
              <td style={{ textAlign: "right", fontWeight: 800, paddingTop: ".75rem" }}>{euro(row.summeUmlage)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Abrechnungsergebnis */}
        <div
          style={{
            background: "color-mix(in srgb, var(--accent) 8%, transparent)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "1rem 1.25rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".92rem", marginBottom: ".4rem" }}>
            <span>Ihre Vorauszahlungen ({jahr})</span>
            <strong>{euro(row.vorauszahlung)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".92rem", marginBottom: ".6rem" }}>
            <span>abzgl. tatsächliche Betriebskosten</span>
            <strong>− {euro(row.summeUmlage)}</strong>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "1.1rem",
              fontWeight: 800,
              borderTop: "1px solid var(--border)",
              paddingTop: ".6rem",
              color: nachzahlung ? "var(--neg)" : "var(--pos)",
            }}
          >
            <span>{nachzahlung ? "Nachzahlung" : "Guthaben"}</span>
            <span>{euro(Math.abs(row.saldo))}</span>
          </div>
        </div>

        <p style={{ fontSize: ".74rem", color: "var(--muted)", marginTop: "1.25rem", lineHeight: 1.5 }}>
          Hinweis: Diese Abrechnung wurde automatisch von Segvoo erstellt. Nicht umlagefähige Kosten (z. B.
          Verwaltung, Instandhaltung) sowie Leerstandsanteile sind nicht enthalten. Die Umlage erfolgt tagesgenau
          nach den hinterlegten Verteilerschlüsseln. Bitte prüfen Sie alle Angaben vor dem Versand.
        </p>
      </div>
    </div>
  );
}
