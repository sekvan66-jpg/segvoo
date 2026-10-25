import { listObjekte, listKostenarten, listBuchungen, jahreMitBuchungen } from "@/lib/queries";
import { euro, SCHLUESSEL_LABEL } from "@/lib/format";
import { Card, PageHeader, Field, Empty } from "@/components/ui";
import { createKostenart, deleteKostenart, createBuchung, deleteBuchung } from "../actions";

export const dynamic = "force-dynamic";

const SCHLUESSEL = ["WOHNFLAECHE", "EINHEIT", "PERSONEN", "VERBRAUCH"];

export default async function KostenPage({
  searchParams,
}: {
  searchParams: Promise<{ objekt?: string; jahr?: string }>;
}) {
  const sp = await searchParams;
  const objekte = listObjekte();
  const kostenarten = listKostenarten();

  const objektId = Number(sp.objekt) || objekte[0]?.id || 0;
  const jahr = Number(sp.jahr) || new Date().getFullYear() - 1;
  const buchungen = objektId ? listBuchungen(objektId, jahr) : [];
  const vorhandeneJahre = objektId ? jahreMitBuchungen(objektId) : [];
  const summe = buchungen.reduce((s, b) => s + b.betrag, 0);
  const summeUml = buchungen.filter((b) => b.umlagefaehig).reduce((s, b) => s + b.betrag, 0);

  return (
    <>
      <PageHeader title="Betriebskosten" subtitle="Kostenarten definieren und Rechnungen erfassen" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.25rem", alignItems: "start" }}>
        <div style={{ display: "grid", gap: "1.25rem" }}>
          <Card>
            <form method="get" style={{ display: "flex", gap: ".6rem", alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 180 }}>
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
              {vorhandeneJahre.length > 0 && (
                <span style={{ fontSize: ".78rem", color: "var(--muted)" }}>
                  Jahre: {vorhandeneJahre.join(", ")}
                </span>
              )}
            </form>
          </Card>

          <Card style={{ padding: 0 }}>
            <div style={{ padding: "1rem 1.1rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>Buchungen {jahr}</h2>
              <div style={{ fontSize: ".85rem", color: "var(--muted)" }}>
                Gesamt <strong style={{ color: "var(--text)" }}>{euro(summe)}</strong> · davon umlagefähig{" "}
                <strong style={{ color: "var(--text)" }}>{euro(summeUml)}</strong>
              </div>
            </div>
            {buchungen.length === 0 ? (
              <Empty text="Keine Kostenbuchungen für dieses Objekt/Jahr." />
            ) : (
              <table className="data">
                <thead>
                  <tr>
                    <th>Kostenart</th>
                    <th>Verteilerschlüssel</th>
                    <th>Umlage</th>
                    <th style={{ textAlign: "right" }}>Betrag</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {buchungen.map((b) => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 600 }}>{b.kostenart_name}</td>
                      <td style={{ color: "var(--muted)" }}>{SCHLUESSEL_LABEL[b.schluessel] ?? b.schluessel}</td>
                      <td>
                        {b.umlagefaehig ? (
                          <span className="badge">umlagefähig</span>
                        ) : (
                          <span style={{ color: "var(--muted)", fontSize: ".8rem" }}>nicht umlegbar</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>{euro(b.betrag)}</td>
                      <td style={{ textAlign: "right" }}>
                        <form action={deleteBuchung}>
                          <input type="hidden" name="id" value={b.id} />
                          <button className="btn btn-danger no-print" style={{ padding: ".25rem .5rem", fontSize: ".75rem" }}>
                            ✕
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginTop: 0 }}>Kostenbuchung erfassen</h2>
            {objekte.length === 0 || kostenarten.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>
                Bitte zuerst ein Objekt und eine Kostenart anlegen.
              </p>
            ) : (
              <form action={createBuchung} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr auto", gap: ".6rem", alignItems: "end" }}>
                <Field label="Objekt">
                  <select className="select" name="objekt_id" defaultValue={String(objektId)}>
                    {objekte.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Kostenart">
                  <select className="select" name="kostenart_id" required>
                    {kostenarten.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Jahr">
                  <input className="input" name="jahr" inputMode="numeric" defaultValue={String(jahr)} />
                </Field>
                <Field label="Betrag €">
                  <input className="input" name="betrag" inputMode="decimal" required />
                </Field>
                <button className="btn" type="submit">+</button>
              </form>
            )}
          </Card>
        </div>

        <Card>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginTop: 0 }}>Kostenarten</h2>
          <div style={{ display: "grid", gap: ".35rem", marginBottom: "1rem" }}>
            {kostenarten.length === 0 && <Empty text="Noch keine Kostenarten." />}
            {kostenarten.map((k) => (
              <div
                key={k.id}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: ".5rem", padding: ".35rem .1rem", borderBottom: "1px solid var(--border)" }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: ".88rem" }}>{k.name}</div>
                  <div style={{ fontSize: ".74rem", color: "var(--muted)" }}>
                    {SCHLUESSEL_LABEL[k.schluessel] ?? k.schluessel}
                    {!k.umlagefaehig && " · nicht umlegbar"}
                  </div>
                </div>
                <form action={deleteKostenart}>
                  <input type="hidden" name="id" value={k.id} />
                  <button className="btn btn-danger no-print" style={{ padding: ".2rem .45rem", fontSize: ".72rem" }}>
                    ✕
                  </button>
                </form>
              </div>
            ))}
          </div>
          <form action={createKostenart} style={{ display: "grid", gap: ".6rem", borderTop: "1px dashed var(--border)", paddingTop: ".9rem" }}>
            <Field label="Neue Kostenart">
              <input className="input" name="name" required placeholder="z. B. Gartenpflege" />
            </Field>
            <Field label="Verteilerschlüssel">
              <select className="select" name="schluessel" defaultValue="WOHNFLAECHE">
                {SCHLUESSEL.map((s) => (
                  <option key={s} value={s}>
                    {SCHLUESSEL_LABEL[s]}
                  </option>
                ))}
              </select>
            </Field>
            <label style={{ display: "flex", alignItems: "center", gap: ".5rem", fontSize: ".85rem" }}>
              <input type="checkbox" name="umlagefaehig" defaultChecked /> umlagefähig (auf Mieter umlegbar)
            </label>
            <button className="btn" type="submit">Kostenart anlegen</button>
          </form>
        </Card>
      </div>
    </>
  );
}
