import { listMieter } from "@/lib/queries";
import { Card, PageHeader, Field, Empty } from "@/components/ui";
import { createMieter, deleteMieter } from "../actions";

export const dynamic = "force-dynamic";

export default function MieterPage() {
  const mieter = listMieter();

  return (
    <>
      <PageHeader title="Mieter" subtitle="Mieterstammdaten verwalten" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.25rem", alignItems: "start" }}>
        <Card style={{ padding: 0 }}>
          {mieter.length === 0 ? (
            <Empty text="Noch keine Mieter erfasst." />
          ) : (
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>E-Mail</th>
                  <th>Telefon</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {mieter.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>
                      {m.nachname}, {m.vorname}
                    </td>
                    <td style={{ color: "var(--muted)" }}>{m.email || "–"}</td>
                    <td style={{ color: "var(--muted)" }}>{m.telefon || "–"}</td>
                    <td style={{ textAlign: "right" }}>
                      <form action={deleteMieter}>
                        <input type="hidden" name="id" value={m.id} />
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
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginTop: 0 }}>Neuer Mieter</h2>
          <form action={createMieter} style={{ display: "grid", gap: ".7rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".6rem" }}>
              <Field label="Vorname *">
                <input className="input" name="vorname" required />
              </Field>
              <Field label="Nachname *">
                <input className="input" name="nachname" required />
              </Field>
            </div>
            <Field label="E-Mail">
              <input className="input" name="email" type="email" />
            </Field>
            <Field label="Telefon">
              <input className="input" name="telefon" />
            </Field>
            <button className="btn" type="submit">Mieter anlegen</button>
          </form>
        </Card>
      </div>
    </>
  );
}
