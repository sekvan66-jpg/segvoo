import Link from "next/link";

const links = [
  { href: "/", label: "Übersicht" },
  { href: "/objekte", label: "Objekte" },
  { href: "/mieter", label: "Mieter" },
  { href: "/vertraege", label: "Mietverträge" },
  { href: "/kosten", label: "Betriebskosten" },
  { href: "/abrechnung", label: "Nebenkostenabrechnung" },
];

export default function Nav() {
  return (
    <aside
      className="no-print"
      style={{
        width: 240,
        flexShrink: 0,
        borderRight: "1px solid var(--border)",
        background: "var(--surface)",
        padding: "1.25rem 1rem",
        position: "sticky",
        top: 0,
        height: "100vh",
      }}
    >
      <Link href="/" style={{ textDecoration: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".55rem", marginBottom: "1.5rem" }}>
          <span
            style={{
              width: 34, height: 34, borderRadius: 9,
              background: "var(--brand)", color: "var(--brand-fg)",
              display: "grid", placeItems: "center", fontWeight: 800, fontSize: "1.05rem",
            }}
          >
            S
          </span>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1 }}>Segvoo</div>
            <div style={{ fontSize: ".7rem", color: "var(--muted)" }}>Hausverwaltung</div>
          </div>
        </div>
      </Link>
      <nav style={{ display: "flex", flexDirection: "column", gap: ".15rem" }}>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            style={{
              padding: ".55rem .7rem",
              borderRadius: 9,
              fontSize: ".9rem",
              fontWeight: 600,
              color: "var(--text)",
              textDecoration: "none",
            }}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div style={{ marginTop: "auto", paddingTop: "2rem", fontSize: ".72rem", color: "var(--muted)" }}>
        <p>Demo-Daten über „Beispieldaten laden" auf der Übersicht.</p>
      </div>
    </aside>
  );
}
