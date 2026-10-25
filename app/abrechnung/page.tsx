import Link from "next/link";
import { listObjekte, jahreMitBuchungen } from "@/lib/queries";
import { berechneAbrechnung } from "@/lib/nka";
import { euro } from "@/lib/format";
import { Card, PageHeader, Field, Empty, Stat } from "@/components/ui";

export const dynamic = "force-dynamic";

function SaldoCell({ saldo }: { saldo: number }) {
  const nachzahlung = saldo < 0;
  return (
    <span style={{ color: nachzahlung ? "var(--neg)" : "var(--pos)", fontWeight: 700 }}>
      {euro(Math.abs(saldo))} {nachzahlung ? "Nachzahlung" : "Guthaben"}
    </span>
  );
}

export default async function AbrechnungIndex({
  searchParams,
}: {
  searchParams: Promise<{ objekt?: string; jahr?: string }>;
}) {
  const sp = await searchParams;
  const objekte = listObjekte();
  const objektId = Number(sp.objekt) || objekte[0]?.id || 0;
  const jahre = objektId ? jahreMitBuchungen(objektId) : [];
  const jahr = Number(sp.jahr) || jahre[0] || new Date().getFullYear() - 1;
  const abr = objektId ? berechneAbrechnung(objektId, jahr) : null;

  if (objekte.length === 0) {
    return (
      <>
        <PageHeader title="Nebenkostenabrechnung" />
        <Card>
          <Empty text="Bitte zuerst ein Objekt, Einheiten, Verträge und Betriebskosten anlegen (oder Beispieldaten laden)." />
        </Card>
      </>
    );
  }

  const summeNach = abr?.vertraege.filter((v) => v.saldo < 0).reduce((s, v) => s - v.saldo, 0) ?? 0;
  const summeGut = abr?.vertraege.filter((v) => v.saldo >= 0).reduce((s, v) => s + v.saldo, 0) ?? 0;

  return (
    <>
      <PageHeader
        title="Nebenkostenabrechnung"
        subtitle="Betriebskosten tagesgenau auf die Mieter umlegen"
      />

      <Card style={{ marginBottom: "1.25rem" }}>
        <form method="get" style={{ display: "flex", gap: ".6rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <Field label="Objekt">
              <select className="select" name="objekt" defaultValue={String(objektId)}>
                {objekte.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div style={{ width: 140 }}>
            <Field label="Abrechnungsjahr">
              <input className="input" name="jahr" inputMode="numeric" defaultValue={String(jahr)} />
            </Field>
          </div>
          <button className="btn" type="submit">Abrechnung erstellen</button>
        </form>
      </Card>

      {!abr || abr.vertraege.length === 0 ? (
        <Card>
          <Empty text={`Für ${jahr} gibt es keine abrechenbaren Verträge/Kosten in diesem Objekt.`} />
        </Card>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: ".9rem",
              marginBottom: "1.25rem",
            }}
          >
            <Stat label="Gesamtkosten" value={euro(abr.summeKostenGesamt)} sub={`${abr.jahr} · ${abr.objekt.name}`} />
            <Stat label="Umlagefähig" value={euro(abr.summeUmlagefaehig)} />
            <Stat label="Σ Nachzahlungen" value={euro(summeNach)} />
            <Stat label="Σ Guthaben" value={euro(summeGut)} />
          </div>

          <Card style={{ padding: 0 }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Mieter</th>
                  <th>Einheit</th>
                  <th style={{ textAlign: "right" }}>Nutzungstage</th>
                  <th style={{ textAlign: "right" }}>Umlage</th>
                  <th style={{ textAlign: "right" }}>Vorauszahlung</th>
                  <th style={{ textAlign: "right" }}>Ergebnis</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {abr.vertraege.map((v) => (
                  <tr key={v.vertrag.id}>
                    <td style={{ fontWeight: 600 }}>{v.vertrag.mieter_name}</td>
                    <td style={{ color: "var(--muted)" }}>{v.vertrag.einheit_bez}</td>
                    <td style={{ textAlign: "right" }}>
                      {v.nutzungstage}/{v.tageImJahr}
                    </td>
                    <td style={{ textAlign: "right" }}>{euro(v.summeUmlage)}</td>
                    <td style={{ textAlign: "right" }}>{euro(v.vorauszahlung)}</td>
                    <td style={{ textAlign: "right" }}>
                      <SaldoCell saldo={v.saldo} />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link href={`/abrechnung/${v.vertrag.id}/${abr.jahr}`} className="badge">
                        Abrechnung →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </>
  );
}
