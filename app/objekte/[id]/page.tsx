import Link from "next/link";
import { notFound } from "next/navigation";
import { getObjekt, listEinheiten, listVertraege } from "@/lib/queries";
import { euro, zahl } from "@/lib/format";
import { Card, PageHeader, Field, Empty } from "@/components/ui";
import { createEinheit, deleteEinheit, deleteObjekt } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ObjektDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const objektId = Number(id);
  const objekt = getObjekt(objektId);
  if (!objekt) notFound();

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
                    <td style={{ textAlign: "right" }}>
                      <form action={deleteEinheit}>
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
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginTop: 0 }}>Neue Einheit</h2>
          <form action={createEinheit} style={{ display: "grid", gap: ".7rem" }}>
            <input type="hidden" name="objekt_id" value={objektId} />
            <Field label="Bezeichnung *">
              <input className="input" name="bezeichnung" required placeholder="z. B. 1. OG links" />
            </Field>
            <Field label="Lage">
              <input className="input" name="lage" placeholder="1. Obergeschoss" />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".6rem" }}>
              <Field label="Wohnfläche (m²)">
                <input className="input" name="wohnflaeche" inputMode="decimal" placeholder="62,5" />
              </Field>
              <Field label="Zimmer">
                <input className="input" name="zimmer" inputMode="decimal" placeholder="2,5" />
              </Field>
            </div>
            <button className="btn" type="submit">Einheit hinzufügen</button>
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
