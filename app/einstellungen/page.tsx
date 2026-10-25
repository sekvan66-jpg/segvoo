import { getVermieter } from "@/lib/queries";
import { Card, PageHeader, Field } from "@/components/ui";
import { LogoMark } from "@/components/Logo";
import { saveVermieter } from "../actions";

export const dynamic = "force-dynamic";

export default function EinstellungenPage() {
  const v = getVermieter();

  return (
    <>
      <PageHeader
        title="Einstellungen"
        subtitle="Absender-Stammdaten – erscheinen als Briefkopf auf jeder Abrechnung"
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.25rem", alignItems: "start" }}>
        <Card>
          <form action={saveVermieter} style={{ display: "grid", gap: ".8rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>Vermieter / Hausverwaltung</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".7rem" }}>
              <Field label="Firma / Verwaltung">
                <input className="input" name="firma" defaultValue={v.firma} placeholder="cek mobile Hausverwaltung" />
              </Field>
              <Field label="Ansprechpartner">
                <input className="input" name="name" defaultValue={v.name} placeholder="Vor- und Nachname" />
              </Field>
            </div>
            <Field label="Straße & Nr.">
              <input className="input" name="strasse" defaultValue={v.strasse} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: ".7rem" }}>
              <Field label="PLZ">
                <input className="input" name="plz" defaultValue={v.plz} />
              </Field>
              <Field label="Ort">
                <input className="input" name="ort" defaultValue={v.ort} />
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".7rem" }}>
              <Field label="Telefon">
                <input className="input" name="telefon" defaultValue={v.telefon} />
              </Field>
              <Field label="E-Mail">
                <input className="input" name="email" type="email" defaultValue={v.email} />
              </Field>
            </div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: ".5rem 0 0" }}>Bankverbindung</h2>
            <p style={{ margin: 0, fontSize: ".8rem", color: "var(--muted)" }}>
              Wird bei Nachzahlungen auf der Abrechnung angegeben.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: ".7rem" }}>
              <Field label="IBAN">
                <input className="input" name="iban" defaultValue={v.iban} placeholder="DE.." />
              </Field>
              <Field label="Bank">
                <input className="input" name="bank" defaultValue={v.bank} />
              </Field>
            </div>
            <div>
              <button className="btn" type="submit">Speichern</button>
            </div>
          </form>
        </Card>

        <Card>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginTop: 0 }}>Vorschau Briefkopf</h2>
          <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: ".75rem" }}>
            <LogoMark size={44} />
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontWeight: 800 }}>{v.firma || "cek mobile"}</div>
              <div style={{ fontSize: ".8rem", color: "var(--muted)" }}>{v.name || "Ansprechpartner"}</div>
            </div>
          </div>
          <div style={{ fontSize: ".82rem", color: "var(--muted)", lineHeight: 1.5 }}>
            {v.strasse || "Straße"}
            <br />
            {[v.plz, v.ort].filter(Boolean).join(" ") || "PLZ Ort"}
            <br />
            {v.telefon}
            {v.telefon && v.email ? " · " : ""}
            {v.email}
          </div>
        </Card>
      </div>
    </>
  );
}
