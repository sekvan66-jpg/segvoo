import Link from "next/link";
import { listVertraege, listEinheiten, listMieter, listObjekte } from "@/lib/queries";
import { euro, datum } from "@/lib/format";
import { Card, PageHeader, Field, Empty } from "@/components/ui";
import { saveVertrag, deleteVertrag } from "../actions";

export const dynamic = "force-dynamic";

export default async function VertraegePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const sp = await searchParams;
  const editId = Number(sp.edit) || 0;
  const vertraege = listVertraege();
  const edit = editId ? vertraege.find((v) => v.id === editId) : undefined;
  const einheiten = listEinheiten();
  const mieter = listMieter();
  const objekte = listObjekte();
  const objName = new Map(objekte.map((o) => [o.id, o.name]));
  const heute = new Date().toISOString().slice(0, 10);
  const aktiv = (ende: string | null) => !ende || ende >= heute;

  return (
    <>
      <PageHeader title="Mietverträge" subtitle="Einheiten, Mieten und Vorauszahlungen" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "1.25rem", alignItems: "start" }}>
        <Card style={{ padding: 0 }}>
          {vertraege.length === 0 ? (
            <Empty text="Noch keine Mietverträge. Legen Sie rechts einen an (Einheit + Mieter erforderlich)." />
          ) : (
            <table className="data">
              <thead>
                <tr>
                  <th>Mieter</th>
                  <th>Einheit</th>
                  <th>Zeitraum</th>
                  <th style={{ textAlign: "right" }}>Kaltmiete</th>
                  <th style={{ textAlign: "right" }}>NK-Voraus.</th>
                  <th style={{ textAlign: "right" }}>Pers.</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {vertraege.map((v) => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600 }}>
                      {v.mieter_name}
                      {!aktiv(v.ende) && (
                        <span style={{ marginLeft: ".4rem", fontSize: ".72rem", color: "var(--muted)" }}>(beendet)</span>
                      )}
                    </td>
                    <td>
                      {v.einheit_bez}
                      <br />
                      <span style={{ color: "var(--muted)", fontSize: ".8rem" }}>{objName.get(v.objekt_id)}</span>
                    </td>
                    <td style={{ fontSize: ".82rem" }}>
                      {datum(v.beginn)} – {v.ende ? datum(v.ende) : "unbefristet"}
                    </td>
                    <td style={{ textAlign: "right" }}>{euro(v.kaltmiete)}</td>
                    <td style={{ textAlign: "right" }}>{euro(v.nk_vorauszahlung)}</td>
                    <td style={{ textAlign: "right" }}>{v.personen}</td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <Link href={`/vertraege?edit=${v.id}`} className="badge no-print" style={{ marginRight: ".4rem" }}>
                        Bearb.
                      </Link>
                      <form action={deleteVertrag} style={{ display: "inline" }}>
                        <input type="hidden" name="id" value={v.id} />
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
            {edit ? "Mietvertrag bearbeiten" : "Neuer Mietvertrag"}
          </h2>
          {einheiten.length === 0 || mieter.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>
              Bitte zuerst mindestens eine Einheit und einen Mieter anlegen.
            </p>
          ) : (
            <form action={saveVertrag} style={{ display: "grid", gap: ".7rem" }} key={editId}>
              {edit && <input type="hidden" name="id" value={edit.id} />}
              <Field label="Einheit *">
                <select className="select" name="einheit_id" required defaultValue={edit ? String(edit.einheit_id) : ""}>
                  <option value="" disabled>
                    bitte wählen
                  </option>
                  {einheiten.map((e) => (
                    <option key={e.id} value={e.id}>
                      {objName.get(e.objekt_id)} · {e.bezeichnung} ({e.wohnflaeche} m²)
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Mieter *">
                <select className="select" name="mieter_id" required defaultValue={edit ? String(edit.mieter_id) : ""}>
                  <option value="" disabled>
                    bitte wählen
                  </option>
                  {mieter.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nachname}, {m.vorname}
                    </option>
                  ))}
                </select>
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".6rem" }}>
                <Field label="Beginn *">
                  <input className="input" name="beginn" type="date" required defaultValue={edit?.beginn ?? `${new Date().getFullYear()}-01-01`} />
                </Field>
                <Field label="Ende">
                  <input className="input" name="ende" type="date" defaultValue={edit?.ende ?? ""} />
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: ".6rem" }}>
                <Field label="Kaltmiete €">
                  <input className="input" name="kaltmiete" inputMode="decimal" defaultValue={edit?.kaltmiete ?? ""} placeholder="480" />
                </Field>
                <Field label="NK €/Mon.">
                  <input className="input" name="nk_vorauszahlung" inputMode="decimal" defaultValue={edit?.nk_vorauszahlung ?? ""} placeholder="150" />
                </Field>
                <Field label="Personen">
                  <input className="input" name="personen" inputMode="numeric" defaultValue={edit?.personen ?? 1} />
                </Field>
              </div>
              <div style={{ display: "flex", gap: ".5rem" }}>
                <button className="btn" type="submit">{edit ? "Speichern" : "Vertrag anlegen"}</button>
                {edit && <Link href="/vertraege" className="btn btn-ghost">Abbrechen</Link>}
              </div>
            </form>
          )}
        </Card>
      </div>
    </>
  );
}
