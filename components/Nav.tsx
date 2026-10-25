import Link from "next/link";
import { Logo } from "./Logo";

const links = [
  { href: "/", label: "Übersicht" },
  { href: "/objekte", label: "Objekte" },
  { href: "/mieter", label: "Mieter" },
  { href: "/vertraege", label: "Mietverträge" },
  { href: "/kosten", label: "Betriebskosten" },
  { href: "/zaehler", label: "Zähler" },
  { href: "/abrechnung", label: "Nebenkostenabrechnung" },
  { href: "/einstellungen", label: "Einstellungen" },
];

export default function Nav() {
  return (
    <aside
      className="no-print"
      style={{
        width: 248,
        flexShrink: 0,
        borderRight: "1px solid var(--border)",
        background: "var(--surface)",
        padding: "1.25rem 1rem",
        position: "sticky",
        top: 0,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Link href="/" style={{ textDecoration: "none", marginBottom: "1.5rem" }}>
        <Logo size={40} />
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
