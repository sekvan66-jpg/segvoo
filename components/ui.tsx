import { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: "1rem",
        marginBottom: "1.25rem",
      }}
    >
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>{title}</h1>
        {subtitle && (
          <p style={{ color: "var(--muted)", margin: ".25rem 0 0", fontSize: ".9rem" }}>{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="card" style={{ padding: "1.1rem", ...style }}>
      {children}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card" style={{ padding: "1rem 1.1rem" }}>
      <div style={{ fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".03em", color: "var(--muted)", fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: ".25rem" }}>{value}</div>
      {sub && <div style={{ fontSize: ".78rem", color: "var(--muted)", marginTop: ".15rem" }}>{sub}</div>}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)", fontSize: ".9rem" }}>
      {text}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
