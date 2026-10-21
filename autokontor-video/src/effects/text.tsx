import React from "react";
import { AbsoluteFill, interpolate, random, spring, useVideoConfig } from "remotion";
import { BeatProps, BigWords, EASE, WordF, clamp, clean, pop, shake } from "../lib";
import { C, FONT } from "../theme";

const Center: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", ...style }}>{children}</AbsoluteFill>
);

const gutter = (p: BeatProps) => (p.vertical ? 95 : 150);
const maxChars = (p: BeatProps) => (p.vertical ? 9 : 16);
const maxSize = (p: BeatProps) => (p.vertical ? 330 : 300);

/* ---------------- SLAM ---------------- */
export const Slam: React.FC<BeatProps> = (p) => {
  const { fps } = useVideoConfig();
  const s = shake(p.frame, p.words.map((w) => w.f), p.vertical ? 22 : 26, `slam${p.index}`);
  const last = p.words.length - 1;
  return (
    <Center style={{ background: `radial-gradient(circle at 50% 55%, #2a0004 0%, ${C.black} 62%)` }}>
      <div style={{ transform: `translate(${s.x}px,${s.y}px) rotate(${s.r}deg)` }}>
        <BigWords
          words={p.words}
          frame={p.frame}
          width={p.width - gutter(p) * 2}
          maxSize={maxSize(p)}
          maxChars={maxChars(p)}
          color={(w) => (w.i === last && last > 0 ? C.red : C.white)}
          styleFor={(_, l) => ({
            transform: `scale(${pop(l, fps)})`,
            filter: `blur(${interpolate(l, [0, 3], [8, 0], clamp)}px)`,
            textShadow: "0 12px 40px rgba(0,0,0,.6)",
          })}
        />
      </div>
    </Center>
  );
};

/* ---------------- GLITCH ---------------- */
export const Glitch: React.FC<BeatProps> = (p) => {
  let g = 0;
  for (const w of p.words) {
    const l = p.frame - w.f;
    if (l >= 0 && l < 10) g = Math.max(g, Math.exp(-l / 3));
  }
  if (random(`spike${p.index}${Math.floor(p.frame / 3)}`) > 0.84) g = Math.max(g, 0.55);
  const text = (color: string, extra: React.CSSProperties = {}) => (
    <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", ...extra }}>
      <BigWords
        words={p.words}
        frame={p.frame}
        width={p.width - gutter(p) * 2}
        maxSize={maxSize(p)}
        maxChars={maxChars(p)}
        color={() => color}
        styleFor={(_, l) => ({ transform: `scale(${interpolate(l, [0, 5], [1.25, 1], { ...clamp, easing: EASE })})` })}
      />
    </div>
  );
  const bands = 7;
  return (
    <AbsoluteFill style={{ background: C.black }}>
      {text(C.red, { transform: `translateX(${-26 * g}px)`, mixBlendMode: "screen", opacity: 0.9 })}
      {text(C.cyan, { transform: `translateX(${26 * g}px)`, mixBlendMode: "screen", opacity: 0.7 * g })}
      {Array.from({ length: bands }).map((_, b) => {
        const top = (b / bands) * 100;
        const bottom = 100 - ((b + 1) / bands) * 100;
        const dx = (random(`band${p.index}${b}${Math.floor(p.frame / 2)}`) - 0.5) * 140 * g;
        return text(C.white, { clipPath: `inset(${top}% 0 ${bottom}% 0)`, transform: `translateX(${dx}px)` });
      })}
      {/* horizontale Störstreifen */}
      {g > 0.3 &&
        Array.from({ length: 4 }).map((_, k) => (
          <div
            key={k}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${random(`ln${p.index}${k}${p.frame}`) * 100}%`,
              height: 2 + random(`lh${k}${p.frame}`) * 10,
              background: k % 2 ? C.red : C.white,
              opacity: 0.5 * g,
            }}
          />
        ))}
      {/* kurzer Weißblitz am Anfang */}
      <AbsoluteFill style={{ background: C.white, opacity: interpolate(p.frame, [0, 2], [0.7, 0], clamp) }} />
    </AbsoluteFill>
  );
};

/* ---------------- STRETCH ---------------- */
export const Stretch: React.FC<BeatProps> = (p) => {
  const common = { words: p.words, frame: p.frame, width: p.width - gutter(p) * 2, maxSize: maxSize(p), maxChars: maxChars(p) };
  const streak = interpolate(p.frame, [0, 9], [0, 1], { ...clamp, easing: EASE });
  return (
    <AbsoluteFill style={{ background: C.black, justifyContent: "center", alignItems: "center" }}>
      {/* roter Lichtstreifen fährt durchs Bild */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          width: "100%",
          height: p.vertical ? 260 : 220,
          transform: `translate(${interpolate(streak, [0, 1], [-100, 100])}%, -50%) scaleY(${1 - streak * 0.7})`,
          background: `linear-gradient(90deg, transparent, ${C.red}, transparent)`,
          filter: "blur(30px)",
          opacity: 0.85,
        }}
      />
      {/* Geisterbild mit Bewegungsunschärfe */}
      <div style={{ position: "absolute", opacity: 0.45 }}>
        <BigWords
          {...common}
          color={() => C.red}
          styleFor={(_, l) => ({
            transform: `scaleX(${interpolate(l, [0, 10], [7, 1.6], { ...clamp, easing: EASE })})`,
            filter: `blur(${interpolate(l, [0, 10], [24, 10], clamp)}px)`,
            opacity: interpolate(l, [0, 10], [1, 0], clamp),
          })}
        />
      </div>
      <BigWords
        {...common}
        styleFor={(_, l) => ({
          transform: `translateX(${interpolate(l, [0, 8], [260, 0], { ...clamp, easing: EASE })}px) scaleX(${interpolate(l, [0, 8], [3.4, 1], { ...clamp, easing: EASE })})`,
          filter: `blur(${interpolate(l, [0, 6], [14, 0], clamp)}px)`,
        })}
      />
    </AbsoluteFill>
  );
};

/* ---------------- FLASH ---------------- */
export const Flash: React.FC<BeatProps> = (p) => {
  const s = shake(p.frame, p.words.map((w) => w.f), 9, `flash${p.index}`);
  return (
    <Center style={{ background: C.red }}>
      <div style={{ transform: `translate(${s.x}px,${s.y}px) rotate(${s.r * 0.5}deg)` }}>
        <BigWords
          words={p.words}
          frame={p.frame}
          width={p.width - gutter(p) * 2}
          maxSize={maxSize(p)}
          maxChars={maxChars(p)}
          color={() => C.black}
          styleFor={(_, l) => ({ transform: `scale(${interpolate(l, [0, 4], [1.35, 1], { ...clamp, easing: EASE })})` })}
        />
      </div>
      <AbsoluteFill style={{ background: C.white, opacity: interpolate(p.frame, [0, 2], [1, 0], clamp) }} />
    </Center>
  );
};

/* ---------------- MORPH ---------------- */
type Shape = (t: number) => number;
const R = 1;
const circle: Shape = () => R;
const square: Shape = (t) => (R * 0.84) / Math.max(Math.abs(Math.cos(t)), Math.abs(Math.sin(t)));
const star: Shape = (t) => {
  const ri = 0.44 * R;
  const step = Math.PI / 5;
  let a = t + Math.PI / 2;
  a = ((a % (2 * step)) + 2 * step) % (2 * step);
  const [r1, a1, r2, a2] = a < step ? [R, 0, ri, step] : [ri, step, R, 2 * step];
  return (r1 * r2 * Math.sin(a2 - a1)) / (r1 * Math.sin(a - a1) + r2 * Math.sin(a2 - a));
};
const SHAPES = [circle, square, star];

export const Morph: React.FC<BeatProps & { occ: number }> = (p) => {
  const { fps } = useVideoConfig();
  const from = SHAPES[p.occ % 3];
  const to = SHAPES[(p.occ + 1) % 3];
  const m = spring({ frame: p.frame, fps, config: { damping: 14, stiffness: 160 } });
  const size = Math.min(p.width, p.height) * (p.vertical ? 0.78 : 0.62);
  const rot = (p.occ * 40 + p.frame * 1.4) * (Math.PI / 180);
  const pts = Array.from({ length: 120 }, (_, k) => {
    const t = (k / 120) * Math.PI * 2;
    const r = (from(t) * (1 - m) + to(t) * m) * (size / 2) * interpolate(p.frame, [0, 6], [0.6, 1], { ...clamp, easing: EASE });
    return `${size / 2 + r * Math.cos(t + rot)},${size / 2 + r * Math.sin(t + rot)}`;
  }).join(" ");
  return (
    <Center style={{ background: C.black }}>
      <svg width={size} height={size} style={{ position: "absolute", filter: `drop-shadow(0 0 60px ${C.red}88)` }}>
        <polygon points={pts} fill={C.red} />
      </svg>
      <BigWords
        words={p.words}
        frame={p.frame}
        width={p.width - gutter(p) * 2}
        maxSize={p.vertical ? 260 : 240}
        maxChars={maxChars(p)}
        styleFor={(_, l) => ({ transform: `scale(${pop(l, fps, 1.8)})`, textShadow: "0 10px 50px rgba(0,0,0,.55)" })}
      />
    </Center>
  );
};

/* ---------------- TYPE (Schreibmaschine) ---------------- */
export const Type: React.FC<BeatProps> = (p) => {
  const words = p.words;
  const lastI = words.length - 1;
  const typed = (w: WordF) => {
    const txt = clean(w.w);
    const n = Math.round(interpolate(p.frame, [w.f, Math.max(w.f + 1, w.fe - 1)], [0, txt.length], clamp));
    return txt.slice(0, n);
  };
  const full = words.map((w) => clean(w.w)).join(" ");
  const inner = p.width - gutter(p) * 2 - 80;
  const size = Math.min(p.vertical ? 120 : 110, inner / (Math.min(full.length, p.vertical ? 11 : 22) * 0.62));
  const lines: WordF[][] = [];
  let cur: WordF[] = [];
  let len = 0;
  const maxC = Math.floor(inner / (size * 0.62));
  for (const w of words) {
    const l = clean(w.w).length;
    if (cur.length && len + 1 + l > maxC) { lines.push(cur); cur = []; len = 0; }
    cur.push(w);
    len += (len ? 1 : 0) + l;
  }
  lines.push(cur);
  const activeLine = lines.findIndex((l) => l.some((w) => p.frame < w.fe));
  const cursorOn = Math.floor(p.frame / 8) % 2 === 0;
  const boxIn = interpolate(p.frame, [words[lastI].fe - 2, words[lastI].fe + 4], [0, 1], { ...clamp, easing: EASE });
  return (
    <Center
      style={{
        background: `${C.ink}`,
        backgroundImage: "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }}
    >
      <div
        style={{
          width: p.width - gutter(p) * 2,
          padding: 40,
          borderRadius: 28,
          border: `2px solid ${C.red}55`,
          background: "linear-gradient(180deg, rgba(255,30,30,.08), rgba(0,0,0,.5))",
          boxShadow: `0 0 80px ${C.red}33, inset 0 0 40px rgba(255,30,30,.08)`,
          transform: `scale(${interpolate(p.frame, [0, 6], [0.92, 1], { ...clamp, easing: EASE })})`,
        }}
      >
        <div style={{ fontFamily: FONT.mono, fontSize: size * 0.32, color: C.grey, marginBottom: size * 0.3, letterSpacing: "0.1em" }}>
          {"> autokontor --start"}
        </div>
        {lines.map((line, li) => (
          <div key={li} style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: size, color: C.white, lineHeight: 1.25, whiteSpace: "nowrap" }}>
            {line.map((w, wi) => {
              const isLast = w.i === lastI;
              return (
                <span key={w.i} style={{ position: "relative", marginRight: wi < line.length - 1 ? "0.6em" : 0 }}>
                  {isLast && (
                    <span
                      style={{
                        position: "absolute",
                        left: "-0.15em",
                        right: "-0.15em",
                        top: "0.05em",
                        bottom: "0.02em",
                        background: C.red,
                        transform: `scaleX(${boxIn})`,
                        transformOrigin: "left",
                        borderRadius: 6,
                      }}
                    />
                  )}
                  <span style={{ position: "relative" }}>{typed(w)}</span>
                </span>
              );
            })}
            {li === (activeLine === -1 ? lines.length - 1 : activeLine) && (
              <span style={{ display: "inline-block", width: "0.55em", height: "0.9em", marginLeft: 8, background: C.red, opacity: cursorOn ? 1 : 0, verticalAlign: "-0.1em" }} />
            )}
          </div>
        ))}
      </div>
    </Center>
  );
};
