import Link from "next/link";
import { listObjekte, listEinheiten } from "@/lib/queries";
import { Card, PageHeader, Field, Empty } from "@/components/ui";
import { createObjekt } from "../actions";

export const dynamic = "force-dynamic";

export default function ObjektePage() {
  const objekte = listObjekte();
  const einheiten = listEinheiten();
  const countFor = (id: number) => einheiten.filter((e) => e.objekt_id === id).length;

  return (
    <>
      <PageHeader title="Objekte" subtitle="Immobilien & Gebäude verwalten" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.25rem", alignItems: "start" }}>
        <Card style={{ padding: 0 }}>
          {objekte.length === 0 ? (
            <Empty text="Noch keine Objekte angelegt." />
          ) : (
            <table className="data">
              <thead>
                <tr>
                  <th>Objekt</th>
                  <th>Adresse</th>
                  <th>Einheiten</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {objekte.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 600 }}>{o.name}</td>
                    <td>
                      {o.strasse}
                      <br />
                      <span style={{ color: "var(--muted)" }}>
                        {[o.plz, o.ort].filter(Boolean).join(" ") || "–"}
                      </span>
                    </td>
                    <td>{countFor(o.id)}</td>
                    <td style={{ textAlign: "right" }}>
                      <Link href={`/objekte/${o.id}`} className="badge">Verwalten →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginTop: 0 }}>Neues Objekt</h2>
          <form action={createObjekt} style={{ display: "grid", gap: ".7rem" }}>
            <Field label="Name *">
              <input className="input" name="name" required placeholder="z. B. MFH Lindenstraße" />
            </Field>
            <Field label="Straße & Nr.">
              <input className="input" name="strasse" placeholder="Lindenstraße 12" />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: ".6rem" }}>
              <Field label="PLZ">
                <input className="input" name="plz" placeholder="10115" />
              </Field>
              <Field label="Ort">
                <input className="input" name="ort" placeholder="Berlin" />
              </Field>
            </div>
            <Field label="Baujahr">
              <input className="input" name="baujahr" inputMode="numeric" placeholder="1998" />
            </Field>
            <Field label="Notiz">
              <input className="input" name="notiz" placeholder="optional" />
            </Field>
            <button className="btn" type="submit">Objekt anlegen</button>
          </form>
        </Card>
      </div>
    </>
  );
}
