import Link from "next/link";
import { notFound } from "next/navigation";
import { getObjekt, listEinheiten, listVertraege, getEinheit } from "@/lib/queries";
import { euro, zahl } from "@/lib/format";
import { Card, PageHeader, Field, Empty } from "@/components/ui";
import { saveEinheit, deleteEinheit, deleteObjekt } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ObjektDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const objektId = Number(id);
  const objekt = getObjekt(objektId);
  if (!objekt) notFound();

  const editId = Number(sp.edit) || 0;
  const editEinheit = editId ? getEinheit(editId) : undefined;
  const einheiten = listEinheiten(objektId);
  const vertraege = listVertraege(objektId);
  const flaeche = einheiten.reduce((s, e) => s + e.wohnflaeche, 0);
  const vermietet = new Set(vertraege.filter((v) => !v.ende).map((v) => v.einheit_id));

  return (
    <>
      <PageHeader
        title={objekt.name}
        subtitle={[objekt.strasse, [objekt.plz, objekt.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
        action={
          <div style={{ display: "flex", gap: ".5rem" }} className="no-print">
            <Link href={`/objekte?edit=${objekt.id}`} className="btn btn-ghost">Objekt bearbeiten</Link>
            <Link href={`/abrechnung`} className="btn btn-ghost">Abrechnung</Link>
            <form action={deleteObjekt}>
              <input type="hidden" name="id" value={objekt.id} />
              <button className="btn btn-danger" type="submit">Objekt löschen</button>
            </form>
          </div>
        }
      />

      <div style={{ display: "flex", gap: ".9rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <span className="badge">{einheiten.length} Einheiten</span>
        <span className="badge">{zahl(flaeche)} m² Wohnfläche</span>
        <span className="badge">{vermietet.size} vermietet</span>
        {objekt.baujahr && <span className="badge">Baujahr {objekt.baujahr}</span>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.25rem", alignItems: "start" }}>
        <Card style={{ padding: 0 }}>
          <div style={{ padding: "1rem 1.1rem", borderBottom: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>Wohneinheiten</h2>
          </div>
          {einheiten.length === 0 ? (
            <Empty text="Noch keine Einheiten. Legen Sie rechts die erste an." />
          ) : (
            <table className="data">
              <thead>
                <tr>
                  <th>Bezeichnung</th>
                  <th>Lage</th>
                  <th style={{ textAlign: "right" }}>Fläche</th>
                  <th style={{ textAlign: "right" }}>Zimmer</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {einheiten.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 600 }}>{e.bezeichnung}</td>
                    <td style={{ color: "var(--muted)" }}>{e.lage || "–"}</td>
                    <td style={{ textAlign: "right" }}>{zahl(e.wohnflaeche)} m²</td>
                    <td style={{ textAlign: "right" }}>{e.zimmer || "–"}</td>
                    <td>
                      {vermietet.has(e.id) ? (
                        <span style={{ color: "var(--pos)", fontWeight: 600, fontSize: ".82rem" }}>vermietet</span>
                      ) : (
                        <span style={{ color: "var(--muted)", fontSize: ".82rem" }}>frei</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <Link href={`/objekte/${objektId}?edit=${e.id}`} className="badge no-print" style={{ marginRight: ".4rem" }}>
                        Bearb.
                      </Link>
                      <form action={deleteEinheit} style={{ display: "inline" }}>
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="objekt_id" value={objektId} />
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
            {editEinheit ? "Einheit bearbeiten" : "Neue Einheit"}
          </h2>
          <form action={saveEinheit} style={{ display: "grid", gap: ".7rem" }} key={editId}>
            <input type="hidden" name="objekt_id" value={objektId} />
            {editEinheit && <input type="hidden" name="id" value={editEinheit.id} />}
            <Field label="Bezeichnung *">
              <input className="input" name="bezeichnung" required defaultValue={editEinheit?.bezeichnung} placeholder="z. B. 1. OG links" />
            </Field>
            <Field label="Lage">
              <input className="input" name="lage" defaultValue={editEinheit?.lage} placeholder="1. Obergeschoss" />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".6rem" }}>
              <Field label="Wohnfläche (m²)">
                <input className="input" name="wohnflaeche" inputMode="decimal" defaultValue={editEinheit?.wohnflaeche ?? ""} placeholder="62,5" />
              </Field>
              <Field label="Zimmer">
                <input className="input" name="zimmer" inputMode="decimal" defaultValue={editEinheit?.zimmer ?? ""} placeholder="2,5" />
              </Field>
            </div>
            <div style={{ display: "flex", gap: ".5rem" }}>
              <button className="btn" type="submit">{editEinheit ? "Speichern" : "Einheit hinzufügen"}</button>
              {editEinheit && <Link href={`/objekte/${objektId}`} className="btn btn-ghost">Abbrechen</Link>}
            </div>
          </form>
          {vertraege.length > 0 && (
            <div style={{ marginTop: "1.25rem", fontSize: ".82rem", color: "var(--muted)" }}>
              Aktive Jahreskaltmiete:{" "}
              <strong style={{ color: "var(--text)" }}>
                {euro(vertraege.filter((v) => !v.ende).reduce((s, v) => s + v.kaltmiete * 12, 0))}
              </strong>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
