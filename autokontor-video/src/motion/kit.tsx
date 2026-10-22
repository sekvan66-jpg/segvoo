// Baukasten für den Motion-Stil (nach Vorlage des Nutzers): fast weißer Raum mit grauer Vignette, Elemente fliegen
// stark gekippt in 3D herein (Bewegungsunschärfe), glänzende Icons mit farbigem Leuchten, Glas-Karten.
import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { EASE, clamp } from "../lib";
import { FONT, M } from "../theme";

export type MTone = "light" | "black" | "navy";

const BG: Record<MTone, string> = {
  light: "radial-gradient(ellipse 78% 70% at 50% 46%, #FFFFFF 0%, #F7F7F9 40%, #E2E3E8 78%, #C9CBD2 100%)",
  black: "#000000",
  navy: `radial-gradient(ellipse 72% 70% at 50% 45%, #13224D 0%, #0A1230 50%, ${M.navy} 100%)`,
};

/** Raum: Hintergrund + zentrierte quadratische Bühne (1080 × 1080 Einheiten) mit Perspektive. */
export const Room: React.FC<{ tone?: MTone; width: number; height: number; children?: React.ReactNode; persp?: number }> = ({ tone = "light", width, height, children, persp = 1300 }) => {
  const u = Math.min(width, height) / 1080;
  return (
    <AbsoluteFill style={{ background: BG[tone], overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: (width - 1080 * u) / 2,
          top: (height - 1080 * u) / 2,
          width: 1080,
          height: 1080,
          transform: `scale(${u})`,
          transformOrigin: "0 0",
          perspective: persp,
          fontFamily: FONT.ui,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

/** Einflug in 3D: weit hinten, schräg gekippt, unscharf → scharf. Danach ruhige Drift. */
export const fly = (
  frame: number,
  at: number,
  o: { x?: number; y?: number; z?: number; ry?: number; rx?: number; rz?: number; ry2?: number; rx2?: number; blur?: number; d?: number; drift?: number; sx?: number } = {},
): React.CSSProperties => {
  const d = o.d ?? 16;
  const t = interpolate(frame, [at, at + d], [0, 1], { ...clamp, easing: EASE });
  const after = Math.max(0, frame - at - d);
  const drift = (o.drift ?? 0.06) * after;
  const ry = (o.ry ?? -50) * (1 - t) + (o.ry2 ?? -14) * t + drift;
  const rx = (o.rx ?? 18) * (1 - t) + (o.rx2 ?? 4) * t;
  const blur = (o.blur ?? 34) * (1 - t);
  const sx = 1 + ((o.sx ?? 1.35) - 1) * (1 - t);
  return {
    opacity: frame < at ? 0 : Math.min(1, t * 2.2),
    transform: `translate3d(${(o.x ?? 640) * (1 - t)}px, ${(o.y ?? 0) * (1 - t)}px, ${(o.z ?? -900) * (1 - t)}px) rotateY(${ry}deg) rotateX(${rx}deg) rotateZ(${(o.rz ?? 0) * (1 - t)}deg) scaleX(${sx})`,
    filter: blur > 0.4 ? `blur(${blur}px)` : undefined,
  };
};

/** Abgang: schneller Wisch zur Seite mit Unschärfe (letzte Frames einer Szene). */
export const whipOut = (frame: number, dur: number, dir = -1, frames = 5): React.CSSProperties => {
  const t = interpolate(frame, [dur - frames, dur], [0, 1], { ...clamp, easing: (x) => x * x * x });
  if (t <= 0) return {};
  return { transform: `translateX(${dir * t * 900}px) scaleX(${1 + t * 0.4})`, filter: `blur(${t * 40}px)`, opacity: 1 - t * 0.6 };
};

export const appear = (frame: number, at: number, d = 10) => interpolate(frame, [at, at + d], [0, 1], { ...clamp, easing: EASE });

/** Glänzende 3D-Icon-Kachel mit farbigem Leuchten. */
export const Tile: React.FC<{ size: number; c1: string; c2: string; glow: string; children?: React.ReactNode; style?: React.CSSProperties }> = ({ size, c1, c2, glow, children, style }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.27,
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flex: "none",
      background: `linear-gradient(150deg, ${c1} 0%, ${c2} 100%)`,
      boxShadow: `0 ${size * 0.2}px ${size * 0.36}px -${size * 0.08}px ${glow}, 0 ${size * 0.06}px ${size * 0.12}px rgba(20,20,40,.16), inset 0 2px 1px rgba(255,255,255,.55), inset 0 -${size * 0.08}px ${size * 0.16}px rgba(0,0,0,.2)`,
      ...style,
    }}
  >
    <div style={{ position: "absolute", left: "7%", right: "7%", top: "4%", height: "46%", borderRadius: "24% 24% 50% 50% / 30% 30% 70% 70%", background: "linear-gradient(180deg, rgba(255,255,255,.55), rgba(255,255,255,0))" }} />
    <div style={{ position: "relative", width: "56%", height: "56%", filter: "drop-shadow(0 6px 10px rgba(0,0,0,.22))" }}>{children}</div>
  </div>
);

/** Strich-Icons (weiß), selbst gezeichnet. */
export const Glyph: React.FC<{ name: "car" | "doc" | "einvoice" | "user" | "lock" | "search" | "check" | "calendar" | "shield"; color?: string; w?: number }> = ({ name, color = "#fff", w = 5 }) => {
  const st = { fill: "none", stroke: color, strokeWidth: w, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      {name === "car" && (
        <>
          <path d="M7 41 V34 Q7 30 11 29 L19 27 L26 18 Q28 16 31 16 H42 Q45 16 47 19 L52 27 L56 29 Q58 30 58 34 V41 H7 Z" {...st} />
          <circle cx="19" cy="42" r="5" {...st} />
          <circle cx="46" cy="42" r="5" {...st} />
          <path d="M27 21 H41 L45 27 H23 Z" {...st} />
        </>
      )}
      {name === "doc" && (
        <>
          <path d="M16 6 H40 L50 16 V58 H16 Z" {...st} />
          <path d="M40 6 V16 H50 M23 28 H43 M23 37 H43 M23 46 H34" {...st} />
        </>
      )}
      {name === "einvoice" && (
        <>
          <path d="M14 6 H38 L48 16 V40" {...st} />
          <path d="M14 6 V58 H32" {...st} />
          <path d="M21 26 H40 M21 35 H34" {...st} />
          <circle cx="46" cy="48" r="11" {...st} />
          <path d="M41 48 L45 52 L51 44" {...st} />
        </>
      )}
      {name === "user" && (
        <>
          <circle cx="32" cy="22" r="11" {...st} />
          <path d="M12 56 Q12 38 32 38 Q52 38 52 56" {...st} />
        </>
      )}
      {name === "lock" && (
        <>
          <rect x="14" y="28" width="36" height="28" rx="6" {...st} />
          <path d="M21 28 V20 Q21 9 32 9 Q43 9 43 20 V28 M32 39 V45" {...st} />
        </>
      )}
      {name === "search" && (
        <>
          <circle cx="27" cy="27" r="17" {...st} />
          <path d="M40 40 L55 55" {...st} />
        </>
      )}
      {name === "check" && <path d="M14 33 L27 46 L51 19" {...st} />}
      {name === "calendar" && (
        <>
          <rect x="8" y="12" width="48" height="44" rx="7" {...st} />
          <path d="M8 24 H56 M20 6 V16 M44 6 V16 M22 40 L29 47 L43 33" {...st} />
        </>
      )}
      {name === "shield" && (
        <>
          <path d="M32 6 L53 14 V30 Q53 48 32 58 Q11 48 11 30 V14 Z" {...st} />
          <path d="M22 32 L29 39 L43 24" {...st} />
        </>
      )}
    </svg>
  );
};

/** AutoKontor-Logo als glänzender Kreis (Platzhalter für das echte Logo). */
export const Logo: React.FC<{ size: number; glow?: number; glowColor?: string }> = ({ size, glow = 0, glowColor = M.accent }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 800,
      fontSize: size * 0.38,
      letterSpacing: "-0.03em",
      color: "#fff",
      background: `radial-gradient(circle at 32% 28%, #B69CFF 0%, ${M.accent} 48%, #4C1D95 100%)`,
      boxShadow: `inset 0 2px 2px rgba(255,255,255,.35), 0 ${size * 0.12}px ${size * 0.28}px -${size * 0.05}px rgba(124,58,237,.6), 0 0 ${size * 0.9 * glow}px ${size * 0.2 * glow}px ${glowColor}`,
      flex: "none",
    }}
  >
    AK
  </div>
);
