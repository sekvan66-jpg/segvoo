import Link from "next/link";
import { listMieter } from "@/lib/queries";
import { Card, PageHeader, Field, Empty } from "@/components/ui";
import { saveMieter, deleteMieter } from "../actions";

export const dynamic = "force-dynamic";

export default async function MieterPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const sp = await searchParams;
  const editId = Number(sp.edit) || 0;
  const mieter = listMieter();
  const edit = editId ? mieter.find((m) => m.id === editId) : undefined;

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
                      {(m.strasse || m.ort) && (
                        <div style={{ fontWeight: 400, fontSize: ".78rem", color: "var(--muted)" }}>
                          {[m.strasse, [m.plz, m.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
                        </div>
                      )}
                    </td>
                    <td style={{ color: "var(--muted)" }}>{m.email || "–"}</td>
                    <td style={{ color: "var(--muted)" }}>{m.telefon || "–"}</td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <Link href={`/mieter?edit=${m.id}`} className="badge no-print" style={{ marginRight: ".4rem" }}>
                        Bearb.
                      </Link>
                      <form action={deleteMieter} style={{ display: "inline" }}>
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
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginTop: 0 }}>
            {edit ? "Mieter bearbeiten" : "Neuer Mieter"}
          </h2>
          <form action={saveMieter} style={{ display: "grid", gap: ".7rem" }} key={editId}>
            {edit && <input type="hidden" name="id" value={edit.id} />}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".6rem" }}>
              <Field label="Vorname *">
                <input className="input" name="vorname" required defaultValue={edit?.vorname} />
              </Field>
              <Field label="Nachname *">
                <input className="input" name="nachname" required defaultValue={edit?.nachname} />
              </Field>
            </div>
            <Field label="Straße & Nr.">
              <input className="input" name="strasse" defaultValue={edit?.strasse} placeholder="Lindenstraße 12" />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: ".6rem" }}>
              <Field label="PLZ">
                <input className="input" name="plz" defaultValue={edit?.plz} placeholder="10115" />
              </Field>
              <Field label="Ort">
                <input className="input" name="ort" defaultValue={edit?.ort} placeholder="Berlin" />
              </Field>
            </div>
            <Field label="E-Mail">
              <input className="input" name="email" type="email" defaultValue={edit?.email} />
            </Field>
            <Field label="Telefon">
              <input className="input" name="telefon" defaultValue={edit?.telefon} />
            </Field>
            <div style={{ display: "flex", gap: ".5rem" }}>
              <button className="btn" type="submit">{edit ? "Speichern" : "Mieter anlegen"}</button>
              {edit && <Link href="/mieter" className="btn btn-ghost">Abbrechen</Link>}
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
