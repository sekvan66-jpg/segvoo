// Baukasten für den Premium-Stil: heller Look, glänzende orange Kugeln, kursive Akzentwörter, weiche Bewegungen.
import React from "react";
import { AbsoluteFill, interpolate, random, spring, useVideoConfig } from "remotion";
import { EASE, WordF, clamp, clean, isEmph } from "../lib";
import { FONT, P } from "../theme";

export type Tone = "light" | "dark" | "orange";

/** Federnde Einblendung ab Frame `at` (0 → 1). */
export const useAppear = () => {
  const { fps } = useVideoConfig();
  return (frame: number, at: number, stiffness = 170, damping = 15) => spring({ frame: frame - at, fps, config: { stiffness, damping } });
};

/** Hintergrund mit schwebenden, teils unscharfen Kugeln (Tiefe). */
export const Stage: React.FC<{ tone?: Tone; frame: number; seed?: string; dots?: number; children?: React.ReactNode }> = ({ tone = "light", frame, seed = "s", dots = 6, children }) => {
  const { width, height } = useVideoConfig();
  const bg =
    tone === "dark"
      ? `radial-gradient(ellipse at 50% 40%, #1A2138 0%, ${P.night} 70%)`
      : tone === "orange"
        ? `radial-gradient(ellipse at 50% 45%, #FF8A3D 0%, ${P.orange} 45%, #E0520E 100%)`
        : `radial-gradient(ellipse at 50% 35%, #FFFFFF 0%, ${P.bg} 55%, ${P.bg2} 100%)`;
  const m = Math.min(width, height);
  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {Array.from({ length: dots }).map((_, k) => {
        const depth = random(`${seed}d${k}`);
        const size = m * (0.018 + depth * 0.04);
        // Kugeln nur an den Seiten, damit sie keine Schrift stören
        const rx = random(`${seed}x${k}`);
        const x = rx < 0.5 ? rx * 0.36 * width : width - (rx - 0.5) * 0.36 * width;
        const y = random(`${seed}y${k}`) * height;
        const dy = Math.sin((frame + k * 37) / (40 + k * 3)) * 18 * (0.5 + depth);
        const dx = Math.cos((frame + k * 23) / (55 + k * 4)) * 12 * (0.5 + depth);
        const peach = tone === "orange";
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: x + dx,
              top: y + dy,
              width: size,
              height: size,
              borderRadius: "50%",
              background: peach
                ? "radial-gradient(circle at 35% 30%, #FFF4EC 0%, #FFD2B5 45%, #F2A57A 100%)"
                : `radial-gradient(circle at 35% 30%, ${P.orangeHi} 0%, ${P.orange} 50%, ${P.orangeLo} 100%)`,
              opacity: tone === "dark" ? 0.5 : 0.7,
              filter: `blur(${depth < 0.5 ? 2 + (0.5 - depth) * 14 : 0}px)`,
              boxShadow: peach ? "0 10px 30px rgba(150,50,0,.25)" : "0 8px 20px rgba(201,68,10,.18)",
            }}
          />
        );
      })}
      {children}
    </AbsoluteFill>
  );
};

/** Glänzende orange 3D-Kugel. */
/** Augen für die Kugel-Figur: blinzeln, schauen (lx/ly −1…1), Laune (mood: −1 ängstlich … 1 fröhlich). */
export const Eyes: React.FC<{ size: number; frame: number; lx?: number; ly?: number; mood?: number; seed?: number }> = ({ size, frame, lx = 0, ly = 0, mood = 0.6, seed = 0 }) => {
  const period = 70 + seed * 13;
  const ph = (frame + seed * 29) % period;
  const blink = ph < 4 ? Math.abs(ph - 2) / 2 : 1;
  const ew = size * 0.15;
  const eh = size * 0.2 * Math.max(0.08, blink);
  const eye = (dx: number) => (
    <div style={{ position: "absolute", left: size / 2 + dx - ew / 2, top: size * 0.36 - eh / 2, width: ew, height: eh, borderRadius: "50%", background: "#fff", boxShadow: "inset 0 -2px 0 rgba(0,0,0,.08)", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: ew * 0.55, height: ew * 0.55, borderRadius: "50%", background: "#17181C", left: ew * 0.225 + lx * ew * 0.2, top: eh / 2 - ew * 0.275 + ly * eh * 0.22 }} />
    </div>
  );
  const smile = size * 0.06 * mood;
  return (
    <>
      {eye(-size * 0.13)}
      {eye(size * 0.13)}
      <svg style={{ position: "absolute", left: size * 0.38, top: size * 0.52, overflow: "visible" }} width={size * 0.24} height={size * 0.12}>
        <path d={`M0 ${size * 0.03} Q${size * 0.12} ${size * 0.03 + smile * 2} ${size * 0.24} ${size * 0.03}`} fill="none" stroke="#7A2400" strokeWidth={size * 0.022} strokeLinecap="round" />
      </svg>
    </>
  );
};

export const Orb: React.FC<{ size: number; children?: React.ReactNode; style?: React.CSSProperties; sx?: number; sy?: number }> = ({ size, children, style, sx = 1, sy = 1 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      position: "relative",
      background: `radial-gradient(circle at 34% 28%, #FFD3B0 0%, #FF9A55 18%, ${P.orange} 42%, #E2500C 72%, #B83C04 100%)`,
      boxShadow: `inset ${-size * 0.05}px ${-size * 0.07}px ${size * 0.12}px rgba(120,30,0,.35), inset ${size * 0.03}px ${size * 0.04}px ${size * 0.08}px rgba(255,255,255,.35), 0 ${size * 0.14}px ${size * 0.22}px rgba(201,68,10,.35)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transform: `scale(${sx}, ${sy})`,
      ...style,
    }}
  >
    <div style={{ position: "absolute", left: "18%", top: "12%", width: "34%", height: "20%", borderRadius: "50%", background: "rgba(255,255,255,.55)", filter: `blur(${size * 0.03}px)`, transform: "rotate(-25deg)" }} />
    {children}
  </div>
);

/** Schlagzeile: jedes Wort blendet weich ein, wenn es gesprochen wird. *Wort* = kursiv, orange, größer. */
export const Headline: React.FC<{
  words: WordF[];
  frame: number;
  size: number;
  color?: string;
  accent?: string;
  only?: (w: WordF) => boolean;
  width?: number;
  emphScale?: number;
  weight?: number;
  style?: React.CSSProperties;
}> = ({ words, frame, size, color = P.ink, accent = P.orange, only, width, emphScale = 1.35, weight = 700, style }) => (
  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "baseline", columnGap: size * 0.26, rowGap: size * 0.05, width, textAlign: "center", ...style }}>
    {words
      .filter((w) => (only ? only(w) : true))
      .map((w) => {
        const l = frame - w.f;
        const t = interpolate(l, [0, 7], [0, 1], { ...clamp, easing: EASE });
        const emph = isEmph(w.w);
        const draw = interpolate(l, [5, 16], [0, 1], { ...clamp, easing: EASE });
        return (
          <span
            key={w.i}
            style={{
              position: "relative",
              display: "inline-block",
              fontFamily: emph ? FONT.serif : FONT.ui,
              fontStyle: emph ? "italic" : "normal",
              fontWeight: emph ? 400 : weight,
              fontSize: emph ? size * emphScale : size,
              letterSpacing: emph ? "-0.01em" : "-0.03em",
              lineHeight: 1.05,
              color: emph ? accent : color,
              opacity: l < 0 ? 0 : t,
              transform: `translateY(${(1 - t) * size * 0.35}px)`,
              filter: `blur(${(1 - t) * 8}px)`,
              whiteSpace: "nowrap",
            }}
          >
            {clean(w.w)}
            {emph && (
              <svg viewBox="0 0 100 12" preserveAspectRatio="none" style={{ position: "absolute", left: "2%", bottom: -size * 0.08, width: "96%", height: size * 0.22, overflow: "visible" }}>
                <path d="M2 8 C 25 2, 55 2, 98 6" fill="none" stroke={accent} strokeWidth={3.2} strokeLinecap="round" strokeDasharray={110} strokeDashoffset={110 * (1 - draw)} vectorEffect="non-scaling-stroke" style={{ strokeWidth: Math.max(3, size * 0.06) }} />
              </svg>
            )}
          </span>
        );
      })}
  </div>
);

/** Weiße Karte mit weichem Schatten. */
export const Card: React.FC<{ w: number; h?: number; children?: React.ReactNode; style?: React.CSSProperties; dark?: boolean }> = ({ w, h, children, style, dark }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: w * 0.06,
      background: dark ? "#1A2033" : P.card,
      border: dark ? "1px solid rgba(255,255,255,.08)" : `1px solid ${P.line}`,
      boxShadow: dark ? "0 30px 60px rgba(0,0,0,.45)" : "0 30px 70px rgba(30,40,70,.16), 0 6px 18px rgba(30,40,70,.08)",
      padding: w * 0.07,
      fontFamily: FONT.ui,
      color: dark ? "#fff" : P.ink,
      position: "relative",
      overflow: "hidden",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Dunkle Pille mit Text (wie „Every store.“). */
export const Pill: React.FC<{ size: number; children: React.ReactNode; bg?: string; color?: string; style?: React.CSSProperties }> = ({ size, children, bg = P.ink, color = "#fff", style }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: size * 0.4, background: bg, color, fontFamily: FONT.ui, fontWeight: 700, fontSize: size, borderRadius: 999, padding: `${size * 0.45}px ${size * 0.9}px`, boxShadow: "0 12px 30px rgba(20,25,40,.25)", whiteSpace: "nowrap", ...style }}>
    {children}
  </div>
);

export const Check: React.FC<{ s: number; color?: string; p?: number }> = ({ s, color = P.green, p = 1 }) => (
  <svg viewBox="0 0 24 24" width={s} height={s}>
    <circle cx={12} cy={12} r={11} fill={color} />
    <path d="M6.5 12.5 L10.5 16 L17.5 8.5" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={20} strokeDashoffset={20 * (1 - p)} />
  </svg>
);

/** Auto-Symbol (Seitenansicht), weiß. */
export const CarIcon: React.FC<{ s: number; color?: string }> = ({ s, color = "#fff" }) => (
  <svg viewBox="0 0 64 40" width={s} height={s * 0.625}>
    <path d="M6 28 V22 Q6 18 10 17 L18 15 L26 7 Q28 5 31 5 H42 Q45 5 47 8 L52 15 L57 17 Q60 18 60 22 V28 Z" fill={color} />
    <path d="M28 9 H40 Q42 9 43 11 L46 15 H24 Z" fill="rgba(0,0,0,.18)" />
    <circle cx={18} cy={29} r={6.5} fill={color} stroke="rgba(0,0,0,.25)" strokeWidth={3} />
    <circle cx={48} cy={29} r={6.5} fill={color} stroke="rgba(0,0,0,.25)" strokeWidth={3} />
  </svg>
);

/** Wort-Frame finden (z. B. wann „PDF“ gesprochen wird). */
export const at = (words: WordF[], target: string | string[], fallback = 0) => {
  const t = (Array.isArray(target) ? target : [target]).map((x) => x.toLowerCase());
  const n = (s: string) => clean(s).toLowerCase().replace(/[^a-zäöüß0-9-]/g, "");
  const w = words.find((x) => t.includes(n(x.w)));
  return w ? w.f : fallback;
};

/** Funken-Explosion ab Frame `at` (Kreise + kleine Sterne fliegen auseinander und fallen). */
export const Burst: React.FC<{ frame: number; at: number; x: number; y: number; size?: number; count?: number; seed?: string; colors?: string[] }> = ({
  frame,
  at,
  x,
  y,
  size = 1,
  count = 22,
  seed = "b",
  colors = [P.orange, P.orangeHi, "#FFFFFF", "#FFD23F"],
}) => {
  const l = frame - at;
  if (l < 0 || l > 40) return null;
  return (
    <>
      {Array.from({ length: count }).map((_, k) => {
        const a = random(`${seed}a${k}`) * Math.PI * 2;
        const v = (300 + random(`${seed}v${k}`) * 500) * size;
        const t = l / 30;
        const px = x + Math.cos(a) * v * (1 - Math.exp(-t * 3)) * 0.45;
        const py = y + Math.sin(a) * v * (1 - Math.exp(-t * 3)) * 0.45 + 260 * size * t * t;
        const s = (8 + random(`${seed}s${k}`) * 16) * size;
        const star = k % 4 === 0;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: px - s / 2,
              top: py - s / 2,
              width: s,
              height: s,
              borderRadius: star ? 2 : "50%",
              background: colors[k % colors.length],
              opacity: interpolate(l, [0, 4, 26, 40], [0, 1, 1, 0], clamp),
              transform: `rotate(${l * 12 + k * 30}deg) scale(${star ? 0.8 : 1})`,
              boxShadow: "0 2px 8px rgba(201,68,10,.25)",
            }}
          />
        );
      })}
    </>
  );
};
