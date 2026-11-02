// Baukasten für den Nacht-Stil („AutoKontor bei Nacht“): tiefschwarz, Chrom, Cyan-Licht, Cockpit-Anmutung.
import React from "react";
import { AbsoluteFill, interpolate, random, useVideoConfig } from "remotion";
import { EASE, WordF, clamp, clean, isEmph } from "../lib";
import { N, NFONT } from "../theme";

/** Dunkle Bühne: Dunst von oben, Bodenreflexion, Staub im Licht. */
export const NightStage: React.FC<{ frame: number; seed?: string; glow?: string; dust?: number; floor?: boolean; children?: React.ReactNode }> = ({
  frame,
  seed = "n",
  glow = N.cyan,
  dust = 26,
  floor = true,
  children,
}) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: N.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 55% at 50% 30%, ${glow}22 0%, transparent 70%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 120% 70% at 50% 120%, #1B2433 0%, transparent 60%)" }} />
      {floor && (
        <AbsoluteFill style={{ top: "64%", background: "linear-gradient(180deg, rgba(255,255,255,.035), transparent 60%)", borderTop: "1px solid rgba(255,255,255,.05)" }} />
      )}
      {Array.from({ length: dust }).map((_, k) => {
        const z = random(`${seed}z${k}`);
        const x = random(`${seed}x${k}`) * width + Math.sin((frame + k * 40) / (60 + k)) * 30;
        const y = ((random(`${seed}y${k}`) * height - frame * (0.4 + z)) % height + height) % height;
        const s = 1.5 + z * 3.5;
        return (
          <div
            key={k}
            style={{ position: "absolute", left: x, top: y, width: s, height: s, borderRadius: "50%", background: "#CFE9FF", opacity: 0.12 + z * 0.35, filter: z < 0.4 ? "blur(1.5px)" : undefined }}
          />
        );
      })}
      {children}
    </AbsoluteFill>
  );
};

/** Kleines Kapitel-Label, z. B. „01 — DAS PROBLEM“. */
export const Kicker: React.FC<{ text: string; frame: number; at?: number; size?: number; color?: string }> = ({ text, frame, at = 0, size = 30, color = N.cyan }) => {
  const t = interpolate(frame - at, [0, 10], [0, 1], { ...clamp, easing: EASE });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.6, opacity: t, fontFamily: NFONT.hud, fontWeight: 700, fontSize: size, letterSpacing: "0.32em", color, textTransform: "uppercase" }}>
      <div style={{ width: size * 2.2 * t, height: 2, background: color, boxShadow: `0 0 12px ${color}` }} />
      {text}
    </div>
  );
};

/** Schlagzeile: Wörter steigen aus einer Maske auf; *Wort* leuchtet cyan. */
export const NightTitle: React.FC<{ words: WordF[]; frame: number; size: number; only?: (w: WordF) => boolean; width?: number; align?: "center" | "left"; color?: string }> = ({
  words,
  frame,
  size,
  only,
  width,
  align = "center",
  color = N.text,
}) => (
  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: align === "center" ? "center" : "flex-start", columnGap: size * 0.28, rowGap: size * 0.08, width, textAlign: align }}>
    {words
      .filter((w) => (only ? only(w) : true))
      .map((w) => {
        const l = frame - w.f;
        const t = interpolate(l, [0, 9], [0, 1], { ...clamp, easing: EASE });
        const emph = isEmph(w.w);
        return (
          <span key={w.i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: size * 0.08 }}>
            <span
              style={{
                display: "inline-block",
                fontFamily: NFONT.head,
                fontWeight: 800,
                fontSize: size,
                letterSpacing: "-0.035em",
                lineHeight: 1.05,
                color: emph ? N.cyan : color,
                textShadow: emph ? `0 0 ${size * 0.4}px ${N.cyan}88` : "none",
                transform: `translateY(${(1 - t) * 105}%)`,
                opacity: l < 0 ? 0 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {clean(w.w)}
            </span>
          </span>
        );
      })}
  </div>
);

/** Chrom-Schrift mit wanderndem Glanzlicht. */
export const ChromeText: React.FC<{ children: React.ReactNode; size: number; frame: number; at?: number; glow?: string; style?: React.CSSProperties }> = ({ children, size, frame, at = 0, glow, style }) => {
  const t = interpolate(frame - at, [0, 12], [0, 1], { ...clamp, easing: EASE });
  const shine = interpolate(frame - at, [6, 40], [-30, 130], clamp);
  return (
    <div style={{ position: "relative", fontFamily: NFONT.head, fontWeight: 800, fontSize: size, letterSpacing: "-0.04em", lineHeight: 1, opacity: frame < at ? 0 : t, transform: `translateY(${(1 - t) * 30}px) scale(${0.96 + 0.04 * t})`, ...style }}>
      <span
        style={{
          background: N.chrome,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          filter: glow ? `drop-shadow(0 0 ${size * 0.25}px ${glow})` : "drop-shadow(0 6px 18px rgba(0,0,0,.6))",
        }}
      >
        {children}
      </span>
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(105deg, transparent ${shine - 10}%, rgba(255,255,255,.95) ${shine}%, transparent ${shine + 10}%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {children}
      </span>
    </div>
  );
};

/** Dunkles Glas-Panel wie ein Cockpit-Display. */
export const Panel: React.FC<{ w: number; h?: number; lit?: number; children?: React.ReactNode; style?: React.CSSProperties }> = ({ w, h, lit = 0, children, style }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: w * 0.07,
      background: "linear-gradient(180deg, rgba(30,38,52,.92), rgba(14,18,26,.95))",
      border: `1px solid ${N.line}`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,.08), 0 30px 60px rgba(0,0,0,.55), 0 0 ${40 * lit}px ${N.cyan}55`,
      padding: w * 0.08,
      fontFamily: NFONT.hud,
      color: N.text,
      position: "relative",
      overflow: "hidden",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Rundinstrument mit Ring und Zahl. */
export const Gauge: React.FC<{ size: number; value: number; max: number; p: number; label: string; color?: string }> = ({ size, value, max, p, label, color = N.cyan }) => {
  const r = 42;
  const c = 2 * Math.PI * r * 0.75;
  const frac = (value / max) * p;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} style={{ transform: "rotate(135deg)" }}>
        <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={6} strokeDasharray={`${c} 999`} strokeLinecap="round" />
        <circle cx={50} cy={50} r={r} fill="none" stroke={color} strokeWidth={6} strokeDasharray={`${c * frac} 999`} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: NFONT.hud, fontWeight: 800, fontSize: size * 0.3, lineHeight: 1, color: N.text }}>{Math.round(value * p)}</div>
        <div style={{ fontFamily: NFONT.hud, fontWeight: 500, fontSize: size * 0.1, letterSpacing: "0.18em", color: N.sub, textTransform: "uppercase", marginTop: size * 0.03 }}>{label}</div>
      </div>
    </div>
  );
};

/** Scheinwerfer-Lichtkegel (zwei Kegel von unten nach oben). */
export const Beams: React.FC<{ frame: number; on: number; color?: string }> = ({ frame, on, color = "#DDF4FF" }) => {
  const { width, height } = useVideoConfig();
  const flicker = 0.95 + Math.sin(frame / 3) * 0.02;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", opacity: on * flicker, pointerEvents: "none" }}>
      {[-1, 1].map((s) => (
        <div
          key={s}
          style={{
            position: "absolute",
            left: width / 2 + s * width * 0.16 - width * 0.5,
            bottom: -height * 0.05,
            width: width,
            height: height * 0.75,
            background: `conic-gradient(from ${180 - 14 + s * 4}deg at 50% 100%, transparent 0deg, ${color}38 10deg, ${color}10 22deg, transparent 28deg)`,
            filter: "blur(8px)",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/** Linien-Icons im Cockpit-Stil. */
export const LineIcon: React.FC<{ name: "doc" | "car" | "user" | "lock" | "cloud" | "check" | "key"; s: number; color?: string; w?: number }> = ({ name, s, color = N.text, w = 5 }) => {
  const st = { fill: "none", stroke: color, strokeWidth: w, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 100 100" width={s} height={s}>
      {name === "doc" && (
        <>
          <path d="M28 10 H62 L76 24 V90 H28 Z" {...st} />
          <path d="M62 10 V24 H76 M38 44 H66 M38 58 H66 M38 72 H56" {...st} />
        </>
      )}
      {name === "car" && (
        <>
          <path d="M10 64 V54 Q10 48 16 46 L28 42 L40 28 Q43 25 48 25 H64 Q68 25 71 29 L80 42 L88 45 Q92 47 92 53 V64 Z" {...st} />
          <circle cx={30} cy={66} r={8} {...st} />
          <circle cx={72} cy={66} r={8} {...st} />
        </>
      )}
      {name === "user" && (
        <>
          <circle cx={50} cy={36} r={16} {...st} />
          <path d="M18 88 Q22 62 50 62 Q78 62 82 88" {...st} />
        </>
      )}
      {name === "lock" && (
        <>
          <rect x={22} y={46} width={56} height={42} rx={8} {...st} />
          <path d="M34 46 V34 Q34 18 50 18 Q66 18 66 34 V46" {...st} />
        </>
      )}
      {name === "cloud" && <path d="M28 76 Q12 76 12 60 Q12 46 28 44 Q30 26 50 24 Q68 22 74 38 Q90 36 92 54 Q92 76 72 76 Z" {...st} />}
      {name === "check" && <path d="M22 52 L42 72 L80 30" {...st} />}
      {name === "key" && (
        <>
          <rect x={30} y={8} width={40} height={84} rx={20} {...st} />
          <circle cx={50} cy={34} r={8} {...st} />
          <circle cx={50} cy={60} r={8} {...st} />
        </>
      )}
    </svg>
  );
};
