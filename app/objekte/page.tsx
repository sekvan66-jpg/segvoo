import Link from "next/link";
import { listObjekte, listEinheiten, getObjekt } from "@/lib/queries";
import { Card, PageHeader, Field, Empty } from "@/components/ui";
import { saveObjekt } from "../actions";

export const dynamic = "force-dynamic";

export default async function ObjektePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const sp = await searchParams;
  const editId = Number(sp.edit) || 0;
  const edit = editId ? getObjekt(editId) : undefined;
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
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <Link href={`/objekte?edit=${o.id}`} className="badge no-print" style={{ marginRight: ".4rem" }}>
                        Bearbeiten
                      </Link>
                      <Link href={`/objekte/${o.id}`} className="badge">Verwalten →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginTop: 0 }}>
            {edit ? "Objekt bearbeiten" : "Neues Objekt"}
          </h2>
          <form action={saveObjekt} style={{ display: "grid", gap: ".7rem" }} key={editId}>
            {edit && <input type="hidden" name="id" value={edit.id} />}
            <Field label="Name *">
              <input className="input" name="name" required defaultValue={edit?.name} placeholder="z. B. MFH Lindenstraße" />
            </Field>
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
            <Field label="Baujahr">
              <input className="input" name="baujahr" inputMode="numeric" defaultValue={edit?.baujahr ?? ""} placeholder="1998" />
            </Field>
            <Field label="Notiz">
              <input className="input" name="notiz" defaultValue={edit?.notiz} placeholder="optional" />
            </Field>
            <div style={{ display: "flex", gap: ".5rem" }}>
              <button className="btn" type="submit">{edit ? "Speichern" : "Objekt anlegen"}</button>
              {edit && (
                <Link href="/objekte" className="btn btn-ghost">Abbrechen</Link>
              )}
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
