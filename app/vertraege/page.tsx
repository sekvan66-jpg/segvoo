import { listVertraege, listEinheiten, listMieter, listObjekte } from "@/lib/queries";
import { euro, datum } from "@/lib/format";
import { Card, PageHeader, Field, Empty } from "@/components/ui";
import { createVertrag, deleteVertrag } from "../actions";

export const dynamic = "force-dynamic";

export default function VertraegePage() {
  const vertraege = listVertraege();
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
                    <td style={{ textAlign: "right" }}>
                      <form action={deleteVertrag}>
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
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginTop: 0 }}>Neuer Mietvertrag</h2>
          {einheiten.length === 0 || mieter.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>
              Bitte zuerst mindestens eine Einheit und einen Mieter anlegen.
            </p>
          ) : (
            <form action={createVertrag} style={{ display: "grid", gap: ".7rem" }}>
              <Field label="Einheit *">
                <select className="select" name="einheit_id" required defaultValue="">
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
                <select className="select" name="mieter_id" required defaultValue="">
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
                  <input className="input" name="beginn" type="date" required defaultValue={`${new Date().getFullYear()}-01-01`} />
                </Field>
                <Field label="Ende">
                  <input className="input" name="ende" type="date" />
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: ".6rem" }}>
                <Field label="Kaltmiete €">
                  <input className="input" name="kaltmiete" inputMode="decimal" placeholder="480" />
                </Field>
                <Field label="NK €/Mon.">
                  <input className="input" name="nk_vorauszahlung" inputMode="decimal" placeholder="150" />
                </Field>
                <Field label="Personen">
                  <input className="input" name="personen" inputMode="numeric" defaultValue="1" />
                </Field>
              </div>
              <button className="btn" type="submit">Vertrag anlegen</button>
            </form>
          )}
        </Card>
      </div>
    </>
  );
}
