import Link from "next/link";
import { notFound } from "next/navigation";
import { getVertrag, getVermieter } from "@/lib/queries";
import { berechneAbrechnung } from "@/lib/nka";
import { euro, datum, SCHLUESSEL_LABEL, ZAEHLERART_LABEL } from "@/lib/format";
import { LogoMark } from "@/components/Logo";
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

  const v = getVermieter();
  const nachzahlung = row.saldo < 0;
  const gesamtkostenUml = row.posten.reduce((sum, p) => sum + p.gesamtbetrag, 0);
  const vermieterZeile = [
    v.firma || "cek mobile Hausverwaltung",
    v.strasse,
    [v.plz, v.ort].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="sheetwrap">
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", maxWidth: "210mm", marginInline: "auto" }}>
        <Link href={`/abrechnung?objekt=${vertrag.objekt_id}&jahr=${jahr}`} className="btn btn-ghost">
          ← Zurück
        </Link>
        <PrintButton />
      </div>

      <div className="sheet">
        {/* Briefkopf */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: ".7rem" }}>
            <LogoMark size={46} />
            <div style={{ lineHeight: 1.15 }}>
              <div style={{ fontWeight: 800, fontSize: "1.15rem" }}>
                {v.firma || "cek mobile"}
              </div>
              <div style={{ fontSize: ".82rem", color: "var(--muted)" }}>Nebenkostenabrechnung</div>
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: ".78rem", color: "var(--muted)", lineHeight: 1.5 }}>
            {v.name && <div>{v.name}</div>}
            {v.telefon && <div>{v.telefon}</div>}
            {v.email && <div>{v.email}</div>}
          </div>
        </header>

        <div style={{ borderTop: "2px solid var(--brand)", margin: "1rem 0 1.5rem" }} />

        {/* Absenderzeile + Empfängerblock (DIN 5008) */}
        <div style={{ fontSize: ".66rem", color: "var(--muted)", borderBottom: "1px solid var(--border)", paddingBottom: ".2rem", marginBottom: ".6rem" }}>
          {vermieterZeile}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem" }}>
          <address style={{ fontStyle: "normal", fontSize: ".92rem", lineHeight: 1.5 }}>
            <strong>{row.vertrag.mieter_name}</strong>
            <br />
            {row.vertrag.mieter_strasse || "—"}
            <br />
            {[row.vertrag.mieter_plz, row.vertrag.mieter_ort].filter(Boolean).join(" ") || " "}
          </address>
          <div style={{ textAlign: "right", fontSize: ".82rem", color: "var(--muted)" }}>
            {v.ort && <div>{v.ort}, den {datum(new Date().toISOString())}</div>}
            {!v.ort && <div>Datum: {datum(new Date().toISOString())}</div>}
          </div>
        </div>

        {/* Betreff */}
        <h1 style={{ fontSize: "1.05rem", fontWeight: 800, margin: "0 0 .35rem" }}>
          Betriebs-/Nebenkostenabrechnung {jahr}
        </h1>
        <p style={{ margin: "0 0 1.1rem", fontSize: ".85rem", color: "var(--muted)" }}>
          Objekt: {abr.objekt.name}, {abr.objekt.strasse}, {abr.objekt.plz} {abr.objekt.ort} · Einheit{" "}
          {row.vertrag.einheit_bez} ({row.vertrag.wohnflaeche} m², {row.vertrag.personen} Pers.) ·
          Zeitraum {datum(`${jahr}-01-01`)}–{datum(`${jahr}-12-31`)} · Nutzung {row.nutzungstage}/{row.tageImJahr} Tage
        </p>

        <p style={{ margin: "0 0 1.1rem", fontSize: ".9rem" }}>
          Sehr geehrte/r {row.vertrag.mieter_name}, nachfolgend erhalten Sie die Abrechnung Ihrer
          umlagefähigen Betriebskosten für das Jahr {jahr}.
        </p>

        {/* Kostenaufstellung – Spalten wie im gewohnten Abrechnungsformat */}
        <table className="data" style={{ marginBottom: "1.1rem" }}>
          <thead>
            <tr>
              <th>Kostenart</th>
              <th style={{ textAlign: "right" }}>Gesamt</th>
              <th style={{ textAlign: "right" }}>Gesamtbetrag [€]</th>
              <th style={{ textAlign: "right" }}>Anteil</th>
              <th style={{ textAlign: "right" }}>Anteil [€]</th>
            </tr>
          </thead>
          <tbody>
            {row.posten.map((p, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 600 }}>
                  {p.kostenart}
                  <div style={{ fontWeight: 400, fontSize: ".72rem", color: "var(--muted)" }}>
                    {SCHLUESSEL_LABEL[p.schluessel] ?? p.schluessel}
                    {p.schluessel === "VERBRAUCH" && p.zaehlerart ? ` · ${ZAEHLERART_LABEL[p.zaehlerart] ?? p.zaehlerart}` : ""}
                  </div>
                </td>
                <td style={{ textAlign: "right", color: "var(--muted)", fontSize: ".82rem" }}>{p.gesamtBasisText}</td>
                <td style={{ textAlign: "right" }}>{euro(p.gesamtbetrag)}</td>
                <td style={{ textAlign: "right", color: "var(--muted)", fontSize: ".82rem" }}>{p.anteilBasisText}</td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>{euro(p.anteil)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "2px solid var(--border)" }}>
              <td style={{ fontWeight: 800, paddingTop: ".7rem" }}>Gesamtkosten</td>
              <td></td>
              <td style={{ textAlign: "right", fontWeight: 700, paddingTop: ".7rem" }}>{euro(gesamtkostenUml)}</td>
              <td></td>
              <td style={{ textAlign: "right", fontWeight: 800, paddingTop: ".7rem" }}>{euro(row.summeUmlage)}</td>
            </tr>
            <tr>
              <td colSpan={4} style={{ textAlign: "right", color: "var(--muted)" }}>
                ./. geleistete Vorauszahlungen ({jahr})
              </td>
              <td style={{ textAlign: "right" }}>{euro(row.vorauszahlung)}</td>
            </tr>
            <tr>
              <td colSpan={4} style={{ textAlign: "right", fontWeight: 800, color: nachzahlung ? "var(--neg)" : "var(--pos)" }}>
                {nachzahlung ? "Nachzahlung" : "Guthaben"}
              </td>
              <td style={{ textAlign: "right", fontWeight: 800, color: nachzahlung ? "var(--neg)" : "var(--pos)" }}>
                {euro(Math.abs(row.saldo))}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Zahlungs-/Guthabenhinweis */}
        <p style={{ fontSize: ".86rem", margin: "0 0 1.25rem", lineHeight: 1.6 }}>
          {nachzahlung ? (
            <>
              Bitte überweisen Sie den Nachzahlungsbetrag von{" "}
              <strong>{euro(Math.abs(row.saldo))}</strong> innerhalb von 14 Tagen auf folgendes Konto
              {v.bank ? ` ${v.bank}` : ""}:
              <br />
              <span style={{ color: "var(--muted)" }}>
                Name: {v.firma || v.name}
                {v.iban ? `   ·   IBAN: ${v.iban}` : ""}
                {v.bic ? `   ·   BIC: ${v.bic}` : ""}
                <br />
                Verwendungszweck: NK {jahr} {row.vertrag.einheit_bez}
              </span>
            </>
          ) : (
            <>
              Das Guthaben von <strong>{euro(Math.abs(row.saldo))}</strong> wird Ihnen in den nächsten
              Tagen erstattet bzw. mit der nächsten Mietzahlung verrechnet.
            </>
          )}
        </p>

        <p style={{ fontSize: ".9rem", margin: "0 0 2rem" }}>Mit freundlichen Grüßen</p>
        <div style={{ borderTop: "1px solid var(--muted)", width: 220, paddingTop: ".25rem", fontSize: ".8rem", color: "var(--muted)" }}>
          {v.name || v.firma || "cek mobile Hausverwaltung"}
        </div>

        <footer style={{ marginTop: "2rem", borderTop: "1px solid var(--border)", paddingTop: ".6rem", fontSize: ".68rem", color: "var(--muted)", lineHeight: 1.5 }}>
          Diese Abrechnung wurde mit cek mobile erstellt. Nicht umlagefähige Kosten (z. B. Verwaltung,
          Instandhaltung) sowie Leerstandsanteile sind nicht enthalten. Die Umlage erfolgt tagesgenau nach den
          hinterlegten Verteilerschlüsseln (§ 556 BGB i. V. m. BetrKV). Einwendungen sind innerhalb von 12 Monaten
          nach Zugang geltend zu machen.
        </footer>
      </div>
    </div>
  );
}
