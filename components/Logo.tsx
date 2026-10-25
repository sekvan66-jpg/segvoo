/**
 * cek mobile – Logo.
 * Bildmarke: stilisiertes Haus mit Haken ("geprüfte Abrechnung").
 * Vollständig als Inline-SVG, keine externen Assets.
 */
export function LogoMark({ size = 40 }: { size?: number }) {
  const id = "cekg";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14b8a6" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="12" fill={`url(#${id})`} />
      {/* Dach */}
      <path
        d="M11 24 L24 12.5 L37 24"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Hauskörper */}
      <path
        d="M14.5 23 V34.5 a1.5 1.5 0 0 0 1.5 1.5 H32 a1.5 1.5 0 0 0 1.5 -1.5 V23"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Haken */}
      <path
        d="M18.5 29.5 L22.5 33.5 L30 26"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
      <LogoMark size={size} />
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontWeight: 800, fontSize: size * 0.42, letterSpacing: "-0.02em" }}>
          cek{" "}
          <span style={{ fontWeight: 400, color: "var(--muted)" }}>mobile</span>
        </div>
        <div style={{ fontSize: size * 0.2, color: "var(--muted)", marginTop: 2 }}>
          Nebenkostenabrechnung
        </div>
      </div>
    </div>
  );
}
