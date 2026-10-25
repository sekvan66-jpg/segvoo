import { listObjekte, listEinheiten, listZaehler } from "@/lib/queries";
import { zahl } from "@/lib/format";
import { Card, PageHeader, Field, Empty } from "@/components/ui";
import { saveZaehler, deleteZaehler, setZaehlerstand } from "../actions";

export const dynamic = "force-dynamic";

const ARTEN = ["HEIZUNG", "WARMWASSER", "KALTWASSER", "STROM", "GAS"];

export default async function ZaehlerPage({
  searchParams,
}: {
  searchParams: Promise<{ objekt?: string; jahr?: string }>;
}) {
  const sp = await searchParams;
  const objekte = listObjekte();
  const objektId = Number(sp.objekt) || objekte[0]?.id || 0;
  const jahr = Number(sp.jahr) || new Date().getFullYear() - 1;
  const einheiten = objektId ? listEinheiten(objektId) : [];
  const zaehler = objektId ? listZaehler(objektId, jahr) : [];

  return (
    <>
      <PageHeader
        title="Zähler & Zählerstände"
        subtitle="Grundlage für den Verteilerschlüssel „nach Verbrauch“"
      />

      <Card style={{ marginBottom: "1.25rem" }}>
        <form method="get" style={{ display: "flex", gap: ".6rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
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
          <div style={{ width: 120 }}>
            <Field label="Jahr">
              <input className="input" name="jahr" inputMode="numeric" defaultValue={String(jahr)} />
            </Field>
          </div>
          <button className="btn btn-ghost" type="submit">Anzeigen</button>
        </form>
      </Card>

      {objekte.length === 0 ? (
        <Card><Empty text="Bitte zuerst ein Objekt und Einheiten anlegen." /></Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.25rem", alignItems: "start" }}>
          <Card style={{ padding: 0 }}>
            <div style={{ padding: "1rem 1.1rem", borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>Zählerstände {jahr}</h2>
            </div>
            {zaehler.length === 0 ? (
              <Empty text="Noch keine Zähler. Legen Sie rechts einen an." />
            ) : (
              <table className="data">
                <thead>
                  <tr>
                    <th>Einheit</th>
                    <th>Art</th>
                    <th>Nummer</th>
                    <th style={{ textAlign: "right" }}>Stand Anfang / Ende</th>
                    <th style={{ textAlign: "right" }}>Verbrauch</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {zaehler.map((z) => (
                    <tr key={z.id}>
                      <td style={{ fontWeight: 600 }}>{z.einheit_bez}</td>
                      <td>{z.art}</td>
                      <td style={{ color: "var(--muted)" }}>{z.nummer || "–"}</td>
                      <td>
                        <form action={setZaehlerstand} style={{ display: "flex", gap: ".35rem", justifyContent: "flex-end" }}>
                          <input type="hidden" name="zaehler_id" value={z.id} />
                          <input type="hidden" name="objekt_id" value={objektId} />
                          <input type="hidden" name="jahr" value={jahr} />
                          <input className="input" name="stand_anfang" inputMode="decimal" defaultValue={z.stand_anfang ?? ""} placeholder="Anfang" style={{ width: 90, padding: ".3rem .4rem" }} />
                          <input className="input" name="stand_ende" inputMode="decimal" defaultValue={z.stand_ende ?? ""} placeholder="Ende" style={{ width: 90, padding: ".3rem .4rem" }} />
                          <button className="btn no-print" type="submit" style={{ padding: ".3rem .55rem", fontSize: ".78rem" }}>✓</button>
                        </form>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {z.verbrauch != null ? zahl(z.verbrauch) : "–"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <form action={deleteZaehler} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={z.id} />
                          <input type="hidden" name="objekt_id" value={objektId} />
                          <input type="hidden" name="jahr" value={jahr} />
                          <button className="btn btn-danger no-print" style={{ padding: ".25rem .5rem", fontSize: ".75rem" }}>✕</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginTop: 0 }}>Neuer Zähler</h2>
            {einheiten.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>Bitte zuerst Einheiten anlegen.</p>
            ) : (
              <form action={saveZaehler} style={{ display: "grid", gap: ".7rem" }}>
                <input type="hidden" name="objekt_id" value={objektId} />
                <input type="hidden" name="jahr" value={jahr} />
                <Field label="Einheit">
                  <select className="select" name="einheit_id" required>
                    {einheiten.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.bezeichnung}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Art">
                  <select className="select" name="art" defaultValue="HEIZUNG">
                    {ARTEN.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Zählernummer">
                  <input className="input" name="nummer" placeholder="z. B. WMZ-1001" />
                </Field>
                <button className="btn" type="submit">Zähler hinzufügen</button>
              </form>
            )}
            <p style={{ fontSize: ".74rem", color: "var(--muted)", marginTop: "1rem", lineHeight: 1.5 }}>
              Der Verbrauch (Ende − Anfang) fließt in Kostenarten mit Schlüssel „nach Verbrauch“ ein.
            </p>
          </Card>
        </div>
      )}
    </>
  );
}
