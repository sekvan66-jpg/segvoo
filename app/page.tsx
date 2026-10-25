import Link from "next/link";
import { kennzahlen, listObjekte } from "@/lib/queries";
import { euro, zahl } from "@/lib/format";
import { Card, PageHeader, Stat, Empty } from "@/components/ui";
import { seedDemo, resetDemo } from "./actions";

export const dynamic = "force-dynamic";

export default function Dashboard() {
  const k = kennzahlen();
  const objekte = listObjekte();

  return (
    <>
      <PageHeader
        title="Übersicht"
        subtitle="Ihr Immobilienportfolio auf einen Blick"
        action={
          <div style={{ display: "flex", gap: ".5rem" }} className="no-print">
            {objekte.length === 0 ? (
              <form action={seedDemo}>
                <button className="btn" type="submit">Beispieldaten laden</button>
              </form>
            ) : (
              <form action={resetDemo}>
                <button className="btn btn-ghost" type="submit">Daten zurücksetzen</button>
              </form>
            )}
          </div>
        }
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: ".9rem",
          marginBottom: "1.5rem",
        }}
      >
        <Stat label="Objekte" value={String(k.objekte)} />
        <Stat label="Einheiten" value={String(k.einheiten)} sub={`${zahl(k.flaeche)} m² Wohnfläche`} />
        <Stat label="Aktive Verträge" value={String(k.vertraege)} />
        <Stat label="Kaltmiete / Monat" value={euro(k.kaltmiete)} />
        <Stat label="Jahreskaltmiete" value={euro(k.kaltmiete * 12)} />
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".75rem" }}>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>Objekte</h2>
          <Link href="/objekte" className="btn btn-ghost no-print">Alle anzeigen</Link>
        </div>
        {objekte.length === 0 ? (
          <Empty text="Noch keine Objekte. Laden Sie Beispieldaten oder legen Sie ein Objekt an." />
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Objekt</th>
                <th>Adresse</th>
                <th>Baujahr</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {objekte.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600 }}>{o.name}</td>
                  <td>{[o.strasse, [o.plz, o.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ") || "–"}</td>
                  <td>{o.baujahr ?? "–"}</td>
                  <td style={{ textAlign: "right" }}>
                    <Link href={`/objekte/${o.id}`} className="badge">Details →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
