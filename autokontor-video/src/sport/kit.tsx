// Baukasten für den Sport-Stil („AutoKontor Sport“): Neongelb/Schwarz/Weiß, schräge Schrift, Tempo-Streifen,
// Bewegungsunschärfe in Fahrtrichtung, Einblendungen wie bei einer Sportübertragung.
import React from "react";
import { AbsoluteFill, interpolate, random } from "remotion";
import { EASE, WordF, clamp, clean, isEmph, layoutLines } from "../lib";
import { S, SFONT } from "../theme";

export type STone = "dark" | "volt" | "light";

/** Unsichtbare SVG-Filter: waagerechte Bewegungsunschärfe. */
export const BlurDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      {[3, 8, 16, 30, 50].map((s) => (
        <filter key={s} id={`sxb${s}`} x="-50%" y="-10%" width="200%" height="120%">
          <feGaussianBlur stdDeviation={`${s} 0`} />
        </filter>
      ))}
    </defs>
  </svg>
);
/** Bewegungsunschärfe 0 … 1 → passender Filter. */
export const xblur = (a: number) => (a < 0.04 ? undefined : `url(#sxb${a < 0.15 ? 3 : a < 0.35 ? 8 : a < 0.6 ? 16 : a < 0.85 ? 30 : 50})`);

export const ease = (frame: number, from: number, d = 7) => interpolate(frame, [from, from + d], [0, 1], { ...clamp, easing: EASE });

let ctx: CanvasRenderingContext2D | null = null;
/** Breite eines Texts in der Sport-Schrift (kursiv, schwer). */
export const measure = (text: string, size: number, weight = 900) => {
  ctx ??= typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;
  if (!ctx) return text.length * size * 0.48;
  ctx.font = `italic ${weight} ${size}px "Barlow Condensed"`;
  return ctx.measureText(text).width;
};

const TONE = {
  dark: { bg: `linear-gradient(160deg, #1D2027 0%, ${S.black} 62%)`, stripe: "rgba(255,255,255,.035)", streak: "rgba(255,255,255,.22)", text: S.white, emph: S.volt },
  volt: { bg: `linear-gradient(160deg, #E4FF5C 0%, ${S.volt} 45%, #BDEB00 100%)`, stripe: "rgba(0,0,0,.07)", streak: "rgba(0,0,0,.18)", text: S.black, emph: S.black },
  light: { bg: `linear-gradient(160deg, #FFFFFF 0%, ${S.white} 55%, #E6E8E1 100%)`, stripe: "rgba(0,0,0,.035)", streak: "rgba(0,0,0,.12)", text: S.black, emph: S.black },
};
export const toneText = (t: STone) => TONE[t].text;

/** Bühne: Grundfarbe, schräge Streifen, die durchs Bild ziehen, Tempo-Striche, riesiges Hintergrundwort. */
export const SportStage: React.FC<{ tone?: STone; frame: number; width: number; height: number; seed?: string; streaks?: number; speed?: number; bgWord?: string; children?: React.ReactNode }> = ({
  tone = "dark",
  frame,
  width,
  height,
  seed = "st",
  streaks = 10,
  speed = 1,
  bgWord,
  children,
}) => {
  const T = TONE[tone];
  return (
    <AbsoluteFill style={{ background: T.bg, overflow: "hidden" }}>
      <BlurDefs />
      <AbsoluteFill style={{ backgroundImage: `repeating-linear-gradient(115deg, ${T.stripe} 0 26px, transparent 26px 120px)`, backgroundPosition: `${-frame * 9 * speed}px 0` }} />
      {bgWord && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: height * 0.5,
            whiteSpace: "nowrap",
            fontFamily: SFONT.head,
            fontStyle: "italic",
            fontWeight: 900,
            fontSize: Math.min(width, height) * 0.62,
            lineHeight: 1,
            color: "transparent",
            WebkitTextStroke: `3px ${tone === "dark" ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.08)"}`,
            transform: `translate(${width * 0.1 - frame * 4 * speed}px, -50%)`,
          }}
        >
          {bgWord}
        </div>
      )}
      {Array.from({ length: streaks }).map((_, k) => {
        const len = width * (0.12 + random(`${seed}l${k}`) * 0.35);
        const v = (28 + random(`${seed}v${k}`) * 50) * speed;
        const span = width + len + 200;
        const x = width + 100 - ((frame * v + random(`${seed}o${k}`) * span) % span);
        const y = random(`${seed}y${k}`) * height;
        const th = 2 + random(`${seed}t${k}`) * 4;
        return <div key={k} style={{ position: "absolute", left: x, top: y, width: len, height: th, borderRadius: th, background: `linear-gradient(90deg, ${T.streak}, transparent)` }} />;
      })}
      {children}
    </AbsoluteFill>
  );
};

/** Schräges Etikett wie eine Bauchbinde im Sportfernsehen. */
export const Tag: React.FC<{ children: React.ReactNode; size: number; bg?: string; color?: string; style?: React.CSSProperties }> = ({ children, size, bg = S.volt, color = S.black, style }) => (
  <div style={{ display: "inline-block", background: bg, transform: "skewX(-14deg)", padding: `${size * 0.22}px ${size * 0.7}px`, boxShadow: "0 10px 26px rgba(0,0,0,.28)", ...style }}>
    <div style={{ transform: "skewX(14deg)", fontFamily: SFONT.head, fontStyle: "italic", fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: "0.06em", color, whiteSpace: "nowrap" }}>{children}</div>
  </div>
);

/** Ein Wort schießt von rechts herein (Unschärfe, Schräglage, leichtes Überschwingen). */
export const SlamWord: React.FC<{ text: string; at: number; frame: number; size: number; color: string; emph?: "none" | "volt-block" | "black-block" | "outline"; dir?: 1 | -1; style?: React.CSSProperties }> = ({
  text,
  at,
  frame,
  size,
  color,
  emph = "none",
  dir = 1,
  style,
}) => {
  const l = frame - at;
  if (l < 0) return <span style={{ display: "inline-block", opacity: 0, fontSize: size, fontFamily: SFONT.head, fontStyle: "italic", fontWeight: 900, lineHeight: 0.92, ...style }}>{text}</span>;
  const t = interpolate(l, [0, 6], [0, 1], { ...clamp, easing: EASE });
  const over = interpolate(l, [4, 8, 12], [1, 1.06, 1], clamp);
  const block = emph === "volt-block" || emph === "black-block";
  const bw = interpolate(l, [2, 9], [0, 1], { ...clamp, easing: EASE });
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        fontFamily: SFONT.head,
        fontStyle: "italic",
        fontWeight: 900,
        fontSize: size,
        lineHeight: 0.92,
        letterSpacing: "-0.005em",
        whiteSpace: "nowrap",
        color: emph === "outline" ? "transparent" : emph === "volt-block" ? S.black : emph === "black-block" ? S.volt : color,
        WebkitTextStroke: emph === "outline" ? `${Math.max(3, size * 0.028)}px ${color}` : undefined,
        transform: `translateX(${(1 - t) * size * 2.2 * dir}px) skewX(${(1 - t) * -16}deg) scale(${over})`,
        filter: xblur(1 - t),
        opacity: Math.min(1, l / 2 + 0.3),
        padding: block ? `0 ${size * 0.08}px` : undefined,
        zIndex: 1,
        ...style,
      }}
    >
      {block && <span style={{ position: "absolute", inset: `${size * 0.02}px 0 ${size * 0.04}px`, background: emph === "volt-block" ? S.volt : S.black, transform: `skewX(-12deg) scaleX(${bw})`, transformOrigin: "left", zIndex: -1 }} />}
      {text}
    </span>
  );
};

/** Gesprochene Wörter als schräge, riesige Schlagzeile, Zeile für Zeile. Größe passt sich der Breite an. */
export const SportTitle: React.FC<{
  words: WordF[];
  frame: number;
  maxW: number;
  maxSize: number;
  maxChars?: number;
  tone: STone;
  align?: "center" | "left";
  emphStyle?: "volt-block" | "black-block" | "outline" | "color";
  emphColor?: string;
  only?: (w: WordF) => boolean;
  upper?: boolean;
  lineGap?: number;
}> = ({ words, frame, maxW, maxSize, maxChars = 12, tone, align = "center", emphStyle, emphColor, only, upper = true, lineGap = 0.04 }) => {
  const list = words.filter((w) => (only ? only(w) : true));
  const lines = layoutLines(list, maxChars);
  const txt = (w: WordF) => {
    const c = clean(w.w) + (w.hy ? "-" : "");
    return upper ? c.toUpperCase() : c;
  };
  const widest = Math.max(1, ...lines.map((ln) => measure(ln.map(txt).join(" "), 100)));
  const size = Math.min(maxSize, (100 * maxW) / widest);
  const es = emphStyle ?? (tone === "dark" ? "color" : tone === "volt" ? "black-block" : "volt-block");
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align === "center" ? "center" : "flex-start", gap: size * lineGap }}>
      {lines.map((ln, li) => (
        <div key={li} style={{ display: "flex", gap: size * 0.2, alignItems: "baseline" }}>
          {ln.map((w) => {
            const em = isEmph(w.w);
            return (
              <SlamWord
                key={`${w.i}-${w.w}`}
                text={txt(w)}
                at={w.f}
                frame={frame}
                size={size}
                color={em && es === "color" ? (emphColor ?? TONE[tone].emph) : em && es === "outline" ? (emphColor ?? TONE[tone].emph) : TONE[tone].text}
                emph={em ? (es === "color" ? "none" : es) : "none"}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

/** Schräger Balken, der über das Bild wischt. */
export const SlashBar: React.FC<{ progress: number; width: number; height: number; color: string; thick?: number; angle?: number }> = ({ progress, width, height, color, thick = 0.4, angle = -16 }) => {
  const w = width * thick;
  const x = interpolate(progress, [0, 1], [width + w, -w * 2]);
  return <div style={{ position: "absolute", left: x, top: -height * 0.2, width: w, height: height * 1.4, background: color, transform: `skewX(${angle}deg)` }} />;
};

/** Haken im Kreis. */
export const SCheck: React.FC<{ s: number; p?: number; bg?: string; fg?: string }> = ({ s, p = 1, bg = S.green, fg = S.black }) => (
  <svg viewBox="0 0 24 24" width={s} height={s} style={{ transform: `scale(${0.4 + 0.6 * Math.min(1, p)})`, opacity: Math.min(1, p * 2) }}>
    <circle cx={12} cy={12} r={11} fill={bg} />
    <path d="M6.5 12.5 L10.5 16 L17.5 8.5" fill="none" stroke={fg} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={20} strokeDashoffset={20 * (1 - Math.min(1, p))} />
  </svg>
);

/** AK-Abzeichen im Sport-Look. */
export const Badge: React.FC<{ s: number; dark?: boolean }> = ({ s, dark = true }) => (
  <div
    style={{
      width: s,
      height: s,
      borderRadius: s * 0.22,
      background: dark ? `linear-gradient(150deg, #23262D 0%, ${S.black} 70%)` : S.volt,
      boxShadow: `0 ${s * 0.1}px ${s * 0.25}px rgba(0,0,0,.35), inset 0 2px 0 rgba(255,255,255,.12)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: SFONT.head,
      fontStyle: "italic",
      fontWeight: 900,
      fontSize: s * 0.52,
      color: dark ? S.volt : S.black,
      letterSpacing: "-0.02em",
    }}
  >
    AK
  </div>
);
