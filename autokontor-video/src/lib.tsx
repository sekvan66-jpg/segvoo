import React from "react";
import { interpolate, Easing, random, spring } from "remotion";
import { FONT, FPS } from "./theme";

export type Word = { w: string; start: number; end: number };
export type Beat = { effect: string; text: string; words: Word[]; start: number; end: number };
export type WordF = Word & { f: number; fe: number; i: number };
export type BeatProps = { beat: Beat; index: number; words: WordF[]; frame: number; dur: number; width: number; height: number; vertical: boolean; screenshot: string | null };

export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const toFrames = (beat: Beat): WordF[] =>
  beat.words.map((w, i) => ({
    ...w,
    i,
    f: i === 0 ? 0 : Math.max(0, Math.round((w.start - beat.start) * FPS)),
    fe: Math.max(1, Math.round((w.end - beat.start) * FPS)),
  }));

export const clean = (w: string) => w.replace(/[–-]$/, "").trim();

/** Wörter in Zeilen aufteilen, damit sie riesig und trotzdem lesbar sind. */
export function layoutLines(words: WordF[], maxChars: number): WordF[][] {
  const lines: WordF[][] = [];
  let cur: WordF[] = [];
  let len = 0;
  for (const w of words) {
    const l = clean(w.w).length;
    if (cur.length && len + 1 + l > maxChars) {
      lines.push(cur);
      cur = [];
      len = 0;
    }
    cur.push(w);
    len += (len ? 1 : 0) + l;
  }
  if (cur.length) lines.push(cur);
  return lines;
}

/** Schriftgröße so wählen, dass die längste Zeile in die Breite passt (Anton ≈ 0.5em pro Zeichen). */
export function fitSize(lines: WordF[][], width: number, max: number, charW = 0.5) {
  const longest = Math.max(...lines.map((l) => l.map((w) => clean(w.w)).join(" ").length));
  return Math.min(max, width / (longest * charW));
}

/** Kamerawackler, der bei jedem Wortanfang kurz ausschlägt. */
export function shake(frame: number, hits: number[], amp: number, seed: string) {
  let x = 0;
  let y = 0;
  let r = 0;
  for (const h of hits) {
    const t = frame - h;
    if (t < 0 || t > 10) continue;
    const decay = Math.exp(-t / 2.8);
    x += (random(`${seed}x${h}${t}`) - 0.5) * 2 * amp * decay;
    y += (random(`${seed}y${h}${t}`) - 0.5) * 2 * amp * decay;
    r += (random(`${seed}r${h}${t}`) - 0.5) * 1.6 * decay;
  }
  return { x, y, r };
}

export const pop = (frame: number, fps: number, from = 2.4) =>
  interpolate(spring({ frame, fps, config: { damping: 11, stiffness: 260, mass: 0.6 } }), [0, 1], [from, 1]);

type WordStyle = (w: WordF, local: number) => React.CSSProperties;

/** Große Kinetic-Typography-Zeilen. Jedes Wort erscheint exakt zu seinem Zeitpunkt. */
export const BigWords: React.FC<{
  words: WordF[];
  frame: number;
  width: number;
  maxSize: number;
  maxChars: number;
  styleFor: WordStyle;
  color?: (w: WordF) => string;
  font?: string;
  align?: "center" | "left";
  upper?: boolean;
  lineHeight?: number;
}> = ({ words, frame, width, maxSize, maxChars, styleFor, color, font = FONT.display, align = "center", upper = true, lineHeight = 0.98 }) => {
  const lines = layoutLines(words, maxChars);
  const size = fitSize(lines, width, maxSize, font === FONT.display ? 0.44 : 0.62);
  return (
    <div style={{ width, textAlign: align, fontFamily: font, fontSize: size, lineHeight, letterSpacing: "-0.01em" }}>
      {lines.map((line, li) => (
        <div key={li} style={{ whiteSpace: "nowrap" }}>
          {line.map((w, wi) => {
            const local = frame - w.f;
            const visible = local >= 0;
            return (
              <span
                key={w.i}
                style={{
                  display: "inline-block",
                  marginRight: wi < line.length - 1 ? "0.18em" : 0,
                  color: color ? color(w) : "#fff",
                  opacity: visible ? 1 : 0,
                  willChange: "transform",
                  ...(visible ? styleFor(w, local) : {}),
                }}
              >
                {upper ? clean(w.w).toUpperCase() : clean(w.w)}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
