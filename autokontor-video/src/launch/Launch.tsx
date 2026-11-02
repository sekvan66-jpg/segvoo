// AutoKontor Launch-Film – 60 s, 1920 × 1080, 30 fps, 120 BPM (30 Takte).
// Konzept: „Vom Zettelchaos zum sauberen Dashboard.“ Jede Einstellung entsteht aus der vorigen:
// Zettel/Notizen/Ordner → App-Fenster → Liste + Kundenkarte → Kaufvertrag + Rechnung → Bildschirm (offline)
// → Schild + Tresor (3D) → drei Preiskarten → oranges Auto → Unterstrich des Endtitels.
// Kamera: eine Sprache – bei jedem Übergang ein kurzer Schub nach vorn. Alle Einsätze auf dem Beat (0,5 s).
import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, random, staticFile, useCurrentFrame } from "remotion";

const NAVY = "#0B1F3A";
const ORANGE = "#FF7A1A";
const GRAY = "#E9EEF5";
const WHITE = "#FFFFFF";
const FONT = "Inter, Arial, sans-serif";

export const LAUNCH_FRAMES = 1800;
const F = (s: number) => Math.round(s * 30);
const EIO = Easing.bezier(0.65, 0, 0.35, 1);
const EOUT = Easing.bezier(0.16, 1, 0.3, 1);
const EIN = Easing.bezier(0.7, 0, 0.84, 0);
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const tw = (f: number, s0: number, s1: number, a: number, b: number, e = EIO) => interpolate(f, [F(s0), F(s1)], [a, b], { ...cl, easing: e });
const p01 = (f: number, s0: number, s1: number, e = EIO) => tw(f, s0, s1, 0, 1, e);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

type R = { x: number; y: number; w: number; h: number };
const mixR = (a: R, b: R, t: number): R => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), w: mix(a.w, b.w, t), h: mix(a.h, b.h, t) });
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mixC = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(mix(v, B[i], t))).join(",")})`;
};

/** Schlüsselbilder: [Zeit (s), Rechteck, Farbe, Radius] – dazwischen wird weich gemorpht. */
type Key = [number, R, string, number];
function keyed(f: number, keys: Key[]): { r: R; c: string; rad: number } {
  const t = f / 30;
  if (t <= keys[0][0]) return { r: keys[0][1], c: keys[0][2], rad: keys[0][3] };
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, r0, c0, d0] = keys[i];
    const [t1, r1, c1, d1] = keys[i + 1];
    if (t <= t1) {
      const p = t1 === t0 ? 1 : EIO(Math.min(1, Math.max(0, (t - t0) / (t1 - t0))));
      return { r: mixR(r0, r1, p), c: c0 === c1 ? c0 : mixC(c0, c1, p), rad: mix(d0, d1, p) };
    }
  }
  const k = keys[keys.length - 1];
  return { r: k[1], c: k[2], rad: k[3] };
}

/* ---------------- Formen für das Morphing (alle mit gleich vielen Punkten, Start oben Mitte, im Uhrzeigersinn) ---------------- */
type Pt = [number, number];
const NPTS = 96;
function resample(poly: Pt[], n = NPTS): Pt[] {
  const pts = [...poly, poly[0]];
  const seg: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    seg.push(d);
    total += d;
  }
  const out: Pt[] = [];
  let i = 0;
  let acc = 0;
  for (let k = 0; k < n; k++) {
    const target = (k / n) * total;
    while (i < seg.length - 1 && acc + seg[i] < target) {
      acc += seg[i];
      i++;
    }
    const u = seg[i] ? (target - acc) / seg[i] : 0;
    out.push([mix(pts[i][0], pts[i + 1][0], u), mix(pts[i][1], pts[i + 1][1], u)]);
  }
  return out;
}
function rrect(w: number, h: number, r: number): Pt[] {
  const p: Pt[] = [[0, -h / 2]];
  const arc = (cx: number, cy: number, a0: number) => {
    for (let k = 0; k <= 8; k++) {
      const a = a0 + (k / 8) * (Math.PI / 2);
      p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  };
  arc(w / 2 - r, -h / 2 + r, -Math.PI / 2);
  arc(w / 2 - r, h / 2 - r, 0);
  arc(-w / 2 + r, h / 2 - r, Math.PI / 2);
  arc(-w / 2 + r, -h / 2 + r, Math.PI);
  return resample(p);
}
function shield(w: number, h: number): Pt[] {
  const p: Pt[] = [];
  const top = -h / 2;
  for (let k = 0; k <= 20; k++) p.push([(k / 20) * (w / 2), top + Math.sin((k / 20) * Math.PI) * h * 0.035]);
  for (let k = 0; k <= 30; k++) {
    const u = k / 30;
    p.push([w / 2 - Math.pow(u, 2.2) * (w / 2), top + h * 0.06 + u * h * 0.94 - Math.sin(u * Math.PI) * h * 0.0]);
  }
  for (let k = 0; k <= 30; k++) {
    const u = 1 - k / 30;
    p.push([-(w / 2 - Math.pow(u, 2.2) * (w / 2)), top + h * 0.06 + u * h * 0.94]);
  }
  for (let k = 0; k <= 20; k++) p.push([-(w / 2) + (k / 20) * (w / 2), top + Math.sin((1 - k / 20) * Math.PI) * h * 0.035]);
  return resample(p);
}
function carShape(w: number, h: number): Pt[] {
  // Seitenansicht, Start oben Mitte (Dach), im Uhrzeigersinn
  const P = (x: number, y: number): Pt => [x * w - w / 2, y * h - h / 2];
  return resample([P(0.5, 0), P(0.64, 0), P(0.7, 0.03), P(0.8, 0.4), P(0.94, 0.47), P(0.99, 0.56), P(1, 0.86), P(0.97, 0.92), P(0.03, 0.92), P(0, 0.84), P(0.01, 0.55), P(0.06, 0.44), P(0.2, 0.4), P(0.3, 0.04), P(0.36, 0)]);
}
const lerpPts = (a: Pt[], b: Pt[], t: number): Pt[] => a.map((p, i) => [mix(p[0], b[i][0], t), mix(p[1], b[i][1], t)]);
const toPoly = (pts: Pt[]) => pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");

/* ---------------- Text: Zeile wird von unten in eine Maske geschoben und nach oben wieder heraus ---------------- */
const Line: React.FC<{ f: number; x: number; y: number; size: number; text: React.ReactNode; inS: number; outS?: number; color?: string; weight?: number; w?: number; align?: "left" | "center" }> = ({
  f,
  x,
  y,
  size,
  text,
  inS,
  outS,
  color = NAVY,
  weight = 800,
  w = 1600,
  align = "left",
}) => {
  if (f < F(inS) - 1) return null;
  if (outS !== undefined && f > F(outS + 0.35) + 1) return null;
  const a = tw(f, inS, inS + 0.42, 1, 0, EOUT);
  const b = outS !== undefined ? tw(f, outS, outS + 0.32, 0, 1, EIN) : 0;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: size * 1.32, overflow: "hidden", textAlign: align }}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: weight,
          fontSize: size,
          lineHeight: 1.25,
          letterSpacing: size >= 60 ? "-0.035em" : "-0.012em",
          color,
          whiteSpace: "nowrap",
          transform: `translateY(${(a - b) * 112}%)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

/* ---------------- Papier-Chaos (Takte 1–3) ---------------- */
type Kind = "sheet" | "note" | "folder";
const ITEMS: { kind: Kind; idx: number }[] = [
  { kind: "sheet", idx: 0 },
  { kind: "note", idx: 0 },
  { kind: "folder", idx: 0 },
  { kind: "sheet", idx: 1 },
  { kind: "sheet", idx: 2 },
  { kind: "note", idx: 1 },
  { kind: "folder", idx: 1 },
  { kind: "sheet", idx: 3 },
  { kind: "note", idx: 2 },
  { kind: "sheet", idx: 4 },
  { kind: "folder", idx: 2 },
  { kind: "note", idx: 3 },
  { kind: "sheet", idx: 5 },
];
const SIZE: Record<Kind, [number, number]> = { sheet: [150, 196], note: [118, 118], folder: [196, 140] };
const COLOR: Record<Kind, string> = { sheet: WHITE, note: ORANGE, folder: NAVY };

function chaosRect(f: number, i: number): { r: R; rot: number } {
  const [w, h] = SIZE[ITEMS[i].kind];
  const hx = 980 + random(`hx${i}`) * 700;
  const hy = 110 + random(`hy${i}`) * 760;
  const te = 0.1 + i * 0.24;
  const e = tw(f, te, te + 0.6, 0, 1, EOUT);
  const wild = 1 + tw(f, 4.0, 5.5, 0, 1.6);
  const x = mix(2150, hx, e) + Math.sin((f + i * 37) / 11) * 22 * wild;
  const y = mix(hy + (random(`dy${i}`) - 0.5) * 300, hy, e) + Math.cos((f + i * 23) / 14) * 18 * wild;
  const rot = (random(`r${i}`) - 0.5) * 50 + Math.sin((f + i * 11) / 17) * 12 * wild + (1 - e) * 90;
  return { r: { x: x - w / 2, y: y - h / 2, w, h }, rot };
}

/* ---------------- Layouts der durchlaufenden Bausteine ---------------- */
// Fenster (Takte 4–6), rechts
const L2 = { win: { x: 900, y: 260, w: 900, h: 560 }, title: { x: 900, y: 260, w: 900, h: 44 } };
const l2Side = (k: number): R => ({ x: 900, y: 304 + k * 172, w: 200, h: 172 });
const l2Row = (i: number): R => ({ x: 1120, y: 322 + i * 80, w: 660, h: 66 });
const l2Icon = (j: number): R => ({ x: 1136, y: 322 + j * 80 + 16, w: 34, h: 34 });
// Fenster groß (Takte 7–11)
const L3 = { win: { x: 120, y: 180, w: 1680, h: 830 }, title: { x: 120, y: 180, w: 1680, h: 56 } };
const l3Side = (k: number): R => ({ x: 120, y: 236 + k * 258, w: 260, h: 258 });
const l3Row = (i: number): R => ({ x: 420, y: 260 + i * 118, w: 920, h: 100 });
const l3Icon = (j: number): R => ({ x: 448, y: 260 + j * 118 + 31, w: 70, h: 38 });
const CARD3: R = { x: 1370, y: 260, w: 390, h: 500 };
// Rechnung + Kaufvertrag (Takte 12–16)
const INV: R = { x: 1420, y: 230, w: 380, h: 540 };
const CON: R = { x: 980, y: 230, w: 380, h: 540 };
const l4Band = (k: number): R => ({ x: 1420 + k * (380 / 3), y: 230, w: 380 / 3 + 0.5, h: 72 });
const LINEW = [300, 250, 320, 230, 290, 200];
const l4Line = (i: number): R => ({ x: 1450, y: 336 + i * 30, w: LINEW[i], h: 10 });
const PDF4: R = { x: 1700, y: 714, w: 76, h: 34 };
// Bildschirm (Takte 17–20)
const SCR: R = { x: 940, y: 230, w: 840, h: 520 };
const BEZ: R = { x: 922, y: 212, w: 876, h: 556 };
const l5Title: R = { x: 940, y: 230, w: 840, h: 52 };
const l5Side = (k: number): R => ({ x: 940, y: 282 + k * 156, w: 150, h: 156 });
const l5Row = (i: number): R => ({ x: 1110, y: 300 + i * 70, w: 640, h: 54 });
// Fenster im Raum (Takt 21), wird zum Schild
const W6: R = { x: 1060, y: 330, w: 600, h: 400 };
const toW6 = (r: R): R => ({ x: W6.x + ((r.x - SCR.x) / SCR.w) * W6.w, y: W6.y + ((r.y - SCR.y) / SCR.h) * W6.h, w: (r.w / SCR.w) * W6.w, h: (r.h / SCR.h) * W6.h });
const collapse = (r: R): R => ({ x: W6.x + W6.w / 2 + (r.x + r.w / 2 - W6.x - W6.w / 2) * 0.2, y: W6.y + W6.h / 2 + (r.y + r.h / 2 - W6.y - W6.h / 2) * 0.2, w: 0, h: 0 });

/** Zeitplan eines Bausteins von der Ordnung bis zum Einklappen in das Schild. */
function lifeKeys(l2: R, l3: R, l4: R, l5: R, c2: string, c3: string, c4: string, c5: string, r2: number, r3: number, r4: number, r5: number, lag = 0): Key[] {
  return [
    [6.9, l2, c2, r2],
    [12.0, l2, c2, r2],
    [12.6, l3, c3, r3],
    [22.0 + lag, l3, c3, r3],
    [22.75 + lag, l4, c4, r4],
    [32.35, l4, c4, r4],
    [33.0, l5, c5, r5],
    [40.0, l5, c5, r5],
    [40.6, toW6(l5), c5, r5 * 0.7],
    [41.0, toW6(l5), c5, r5 * 0.7],
    [41.35, collapse(toW6(l5)), c5, 0],
  ];
}

/** Aktive Zeile im laufenden Offline-Bildschirm. */
const activeRow = (f: number) => (f < F(34.5) ? 0 : Math.floor((f - F(34.5)) / 15) % 6);

/** Kleines Auto-Symbol (flach). */
const CarGlyph: React.FC<{ w: number; color?: string }> = ({ w, color = ORANGE }) => (
  <svg viewBox="0 0 100 46" width={w} height={w * 0.46}>
    <path d="M6 34 V26 Q6 22 10 21 L24 18 L34 7 Q36 5 40 5 H62 Q66 5 68 8 L76 18 L90 21 Q94 22 94 27 V34 Z" fill={color} />
    <circle cx="27" cy="36" r="8" fill={NAVY} />
    <circle cx="73" cy="36" r="8" fill={NAVY} />
    <circle cx="27" cy="36" r="3.2" fill={WHITE} />
    <circle cx="73" cy="36" r="3.2" fill={WHITE} />
  </svg>
);

const CARS = [
  ["Kombi · 2019", "84.000 km · Diesel", "14.900 €"],
  ["SUV · 2021", "41.500 km · Benzin", "27.450 €"],
  ["Kompakt · 2018", "96.200 km · Benzin", "9.800 €"],
  ["Cabrio · 2020", "38.900 km · Benzin", "21.300 €"],
  ["Transporter · 2017", "152.000 km · Diesel", "16.700 €"],
  ["Limousine · 2022", "22.100 km · Hybrid", "32.900 €"],
];

let ctx: CanvasRenderingContext2D | null = null;
const measure = (text: string, size: number, weight: number) => {
  ctx ??= typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;
  if (!ctx) return text.length * size * 0.6;
  ctx.font = `${weight} ${size}px Inter`;
  return ctx.measureText(text).width * (1 - 0.035);
};

export const Launch: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;

  // Kamera: kurzer Schub nach vorn bei jedem Übergang
  const CUTS = [6, 12, 22, 32, 40, 48, 54];
  const cam = 1 + CUTS.reduce((s, c) => s + 0.03 * Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, (f - F(c) + 9) / 27)))), 0);
  const navyBg = f >= F(40.6);

  /* ---------- durchlaufende Bausteine ---------- */
  const blocks: React.ReactNode[] = [];
  const showBlocks = f < F(41.4);
  // Fenster-Körper (Rahmen / Rechnung / Bildschirm / Fenster im Raum)
  const bodyKeys: Key[] = [
    [6.55, { x: L2.win.x + L2.win.w / 2, y: L2.win.y + L2.win.h / 2, w: 0, h: 0 }, GRAY, 18],
    [6.95, L2.win, GRAY, 18],
    [12.0, L2.win, GRAY, 18],
    [12.6, L3.win, GRAY, 22],
    [22.0, L3.win, GRAY, 22],
    [22.75, INV, WHITE, 6],
    [32.35, INV, WHITE, 6],
    [33.0, SCR, GRAY, 4],
    [40.0, SCR, GRAY, 4],
    [40.6, W6, WHITE, 28],
  ];
  const body = keyed(f, bodyKeys);
  const outline = f < F(22.0) ? 4 : tw(f, 22.0, 22.5, 4, 0);
  // Bildschirmrahmen + Fuß + WLAN (Takte 17–21)
  const bez = keyed(f, [
    [32.7, { x: SCR.x + 18, y: SCR.y + 18, w: SCR.w - 36, h: SCR.h - 36 }, NAVY, 26],
    [33.15, BEZ, NAVY, 26],
    [40.0, BEZ, NAVY, 26],
    [40.6, { x: -500, y: -500, w: 2920, h: 2080 }, NAVY, 0],
  ]);
  if (f >= F(32.7) && f < F(40.7)) {
    blocks.push(<div key="bez" style={{ position: "absolute", left: bez.r.x, top: bez.r.y, width: bez.r.w, height: bez.r.h, borderRadius: bez.rad, background: NAVY }} />);
  }
  // Kaufvertrag-Seite (aus der Kundenkarte)
  const cardKeys: Key[] = [
    [18.0, { ...CARD3, x: 2000 }, WHITE, 18],
    [18.6, CARD3, WHITE, 18],
    [22.0, CARD3, WHITE, 18],
    [22.75, CON, WHITE, 6],
    [32.0, CON, WHITE, 6],
    [32.4, INV, WHITE, 6],
  ];
  if (showBlocks) {
    if (f < F(41.0)) blocks.push(
      <div
        key="body"
        style={{
          position: "absolute",
          left: body.r.x,
          top: body.r.y,
          width: body.r.w,
          height: body.r.h,
          borderRadius: body.rad,
          background: body.c,
          boxShadow: outline > 0.05 ? `inset 0 0 0 ${outline}px ${NAVY}` : undefined,
        }}
      />,
    );
    if (f >= F(18.0) && f < F(32.45)) {
      const cd = keyed(f, cardKeys);
      blocks.push(<div key="card" style={{ position: "absolute", left: cd.r.x, top: cd.r.y, width: cd.r.w, height: cd.r.h, borderRadius: cd.rad, background: WHITE, boxShadow: f < F(22.0) ? `inset 0 0 0 4px ${NAVY}` : undefined }} />);
    }
    // Titelleiste
    if (f >= F(6.7)) {
      const tk = keyed(f, [
        [6.7, { ...L2.title, x: L2.title.x + L2.title.w / 2, w: 0 }, NAVY, 0],
        [7.2, L2.title, NAVY, 0],
        [12.0, L2.title, NAVY, 0],
        [12.6, L3.title, NAVY, 0],
        [22.0, L3.title, NAVY, 0],
        [22.75, { x: INV.x, y: INV.y, w: INV.w, h: 72 }, NAVY, 0],
        [32.35, { x: INV.x, y: INV.y, w: INV.w, h: 72 }, NAVY, 0],
        [33.0, l5Title, NAVY, 0],
        [40.0, l5Title, NAVY, 0],
        [40.6, toW6(l5Title), NAVY, 0],
        [41.0, toW6(l5Title), NAVY, 0],
        [41.35, collapse(toW6(l5Title)), NAVY, 0],
      ]);
      blocks.push(<div key="title" style={{ position: "absolute", left: tk.r.x, top: tk.r.y, width: tk.r.w, height: tk.r.h, background: NAVY, borderRadius: f < F(22) ? "18px 18px 0 0" : 0 }} />);
    }
    // Papierstücke → Bausteine
    ITEMS.forEach((it, i) => {
      const lag = i * 0.03;
      const tA = 5.5 + i * 0.05;
      let st: { r: R; c: string; rad: number };
      let rot = 0;
      let deco = 1;
      if (t < tA) {
        const ch = chaosRect(f, i);
        st = { r: ch.r, c: COLOR[it.kind], rad: it.kind === "note" ? 4 : 8 };
        rot = ch.rot;
      } else {
        const keys: Key[] =
          it.kind === "sheet"
            ? lifeKeys(l2Row(it.idx), l3Row(it.idx), l4Line(it.idx), l5Row(it.idx), WHITE, WHITE, GRAY, WHITE, 10, 14, 5, 8, lag)
            : it.kind === "note"
              ? lifeKeys(l2Icon(it.idx), l3Icon(it.idx), PDF4, { x: 1110, y: l5Row(0).y, w: 8, h: 54 }, ORANGE, ORANGE, ORANGE, ORANGE, 8, 8, 6, 3, lag)
              : lifeKeys(l2Side(it.idx), l3Side(it.idx), l4Band(it.idx), l5Side(it.idx), NAVY, NAVY, NAVY, NAVY, 0, 0, 0, 0, lag);
        const ch = chaosRect(F(tA), i);
        const m = EIO(Math.min(1, (t - tA) / (6.9 - tA)));
        const first = keys[0];
        st = t < first[0] ? { r: mixR(ch.r, first[1], m), c: mixC(COLOR[it.kind], first[2], m), rad: mix(8, first[3], m) } : keyed(f, keys);
        rot = t < first[0] ? ch.rot * (1 - m) : 0;
        deco = t < first[0] ? 1 - Math.min(1, m * 2.5) : 0;
        // Offline-Bildschirm: Markierung wandert mit
        if (it.kind === "note" && t >= 33.0 && t < 40.6) st = { ...st, r: { ...st.r, y: mix(st.r.y, l5Row(activeRow(f)).y, t >= 34.5 ? 1 : 0) } };
      }
      // Vorsprung der Fahrzeug-Symbole in der Liste: Notiz wird zum Auto (Takte 7–11)
      const carMorph = it.kind === "note" ? p01(f, 12.5 + it.idx * 0.5, 12.9 + it.idx * 0.5) * (1 - p01(f, 22.0, 22.3)) : 0;
      const [w, h] = SIZE[it.kind];
      blocks.push(
        <div
          key={`it${i}`}
          style={{
            position: "absolute",
            left: st.r.x,
            top: st.r.y,
            width: st.r.w,
            height: st.r.h,
            transform: `rotate(${rot}deg)`,
            borderRadius: st.rad,
            background: carMorph > 0.5 ? "transparent" : st.c,
            overflow: "hidden",
          }}
        >
          {deco > 0.01 && it.kind === "sheet" && (
            <div style={{ position: "absolute", inset: 0, padding: "22px 18px", display: "flex", flexDirection: "column", gap: 13, opacity: deco }}>
              <div style={{ height: 12, width: "70%", background: NAVY, borderRadius: 3 }} />
              {[90, 80, 86, 60, 74].map((ww, k) => (
                <div key={k} style={{ height: 7, width: `${ww}%`, background: GRAY, borderRadius: 3 }} />
              ))}
            </div>
          )}
          {deco > 0.01 && it.kind === "note" && (
            <div style={{ position: "absolute", inset: 0, padding: 18, display: "flex", flexDirection: "column", gap: 10, opacity: deco }}>
              {[80, 60, 70].map((ww, k) => (
                <div key={k} style={{ height: 7, width: `${ww}%`, background: WHITE, borderRadius: 3, opacity: 0.85 }} />
              ))}
            </div>
          )}
          {deco > 0.01 && it.kind === "folder" && (
            <div style={{ position: "absolute", left: 14, top: 14, width: w * 0.36, height: h * 0.16, background: ORANGE, borderRadius: 4, opacity: deco }} />
          )}
          {carMorph > 0.5 && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.6 + 0.4 * carMorph})` }}>
              <CarGlyph w={st.r.w} />
            </div>
          )}
        </div>,
      );
    });
    // Zusätzliche Auto-Symbole für die Zeilen 5 und 6
    [4, 5].forEach((i) => {
      const a = p01(f, 12.5 + i * 0.5, 12.9 + i * 0.5, EOUT) * (1 - p01(f, 21.9, 22.2));
      if (a <= 0.01) return;
      const r = l3Icon(i);
      blocks.push(
        <div key={`car${i}`} style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, transform: `scale(${a})` }}>
          <CarGlyph w={r.w} />
        </div>,
      );
    });
  }

  /* ---------- Inhalte, die auf den Bausteinen sitzen ---------- */
  const ui: React.ReactNode[] = [];
  // Fenster-Punkte (Takte 4–11)
  if (f >= F(7.2) && f < F(22.0)) {
    const tr = keyed(f, [
      [7.2, L2.title, NAVY, 0],
      [12.0, L2.title, NAVY, 0],
      [12.6, L3.title, NAVY, 0],
    ]).r;
    const a = p01(f, 7.2, 7.6, EOUT) * (1 - p01(f, 21.8, 22.0));
    ui.push(
      <div key="dots" style={{ position: "absolute", left: tr.x + 20, top: tr.y + tr.h / 2 - 7, display: "flex", gap: 10, opacity: a }}>
        {[0, 1, 2].map((k) => (
          <div key={k} style={{ width: 14, height: 14, borderRadius: 7, background: k === 0 ? ORANGE : WHITE }} />
        ))}
      </div>,
    );
  }
  // Seitenleiste + Liste (Takte 7–11)
  if (f >= F(12.55) && f < F(22.2)) {
    const out = p01(f, 21.85, 22.1, EIN);
    ["Fahrzeuge", "Kunden", "Verträge", "Rechnungen"].forEach((lab, k) => {
      const a = p01(f, 12.6 + k * 0.08, 13.0 + k * 0.08, EOUT) * (1 - out);
      ui.push(
        <div key={`side${k}`} style={{ position: "absolute", left: 140, top: 262 + k * 64, width: 220, height: 50, borderRadius: 12, background: k === 0 ? ORANGE : "transparent", display: "flex", alignItems: "center", paddingLeft: 18, boxSizing: "border-box", opacity: a, transform: `translateX(${(1 - a) * -30}px)` }}>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 24, color: WHITE, letterSpacing: "-0.01em" }}>{lab}</span>
        </div>,
      );
    });
    CARS.forEach((c, i) => {
      const r = l3Row(i);
      const a = p01(f, 12.5 + i * 0.5, 12.95 + i * 0.5, EOUT) * (1 - out);
      if (a <= 0.01) return;
      ui.push(
        <div key={`row${i}`} style={{ position: "absolute", left: r.x + 130, top: r.y, width: r.w - 160, height: r.h, display: "flex", alignItems: "center", justifyContent: "space-between", opacity: a, transform: `translateX(${(1 - a) * 40}px)` }}>
          <div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 30, color: NAVY, letterSpacing: "-0.02em" }}>{c[0]}</div>
            <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 21, color: NAVY, opacity: 0.6, marginTop: 4 }}>{c[1]}</div>
          </div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, color: NAVY, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{c[2]}</div>
        </div>,
      );
    });
  }
  // Auswahl der ersten Fahrzeugzeile (Takt 9) → daraufhin kommt die Kundenkarte
  if (f >= F(17.0) && f < F(22.2)) {
    const r0 = l3Row(0);
    const a = p01(f, 17.0, 17.3, EOUT) * (1 - p01(f, 21.85, 22.1, EIN));
    ui.push(<div key="sel" style={{ position: "absolute", left: r0.x - 4 * a, top: r0.y - 4 * a, width: r0.w + 8 * a, height: r0.h + 8 * a, borderRadius: 16, boxShadow: `inset 0 0 0 4px ${ORANGE}`, opacity: a }} />);
  }
  // Kundenkarte (Takte 10–11)
  if (f >= F(18.0) && f < F(22.3)) {
    const cd = keyed(f, cardKeys).r;
    const a = p01(f, 18.4, 18.8, EOUT) * (1 - p01(f, 22.0, 22.25, EIN));
    const press = interpolate(f - F(22.0), [0, 3, 8], [0, 1, 0], cl);
    ui.push(
      <div key="cardui" style={{ position: "absolute", left: cd.x, top: cd.y, width: cd.w, height: cd.h, opacity: a }}>
        <div style={{ height: 14, background: NAVY, borderRadius: "18px 18px 0 0" }} />
        <div style={{ padding: "34px 34px", display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 84, height: 84, borderRadius: 42, background: NAVY, color: WHITE, fontFamily: FONT, fontWeight: 800, fontSize: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>MM</div>
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, color: NAVY, letterSpacing: "-0.02em" }}>Max Mustermann</div>
              <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 21, color: NAVY, opacity: 0.6, marginTop: 4 }}>Kunde seit 2023</div>
            </div>
          </div>
          <div style={{ height: 2, background: GRAY }} />
          <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 22, color: NAVY, opacity: 0.6 }}>Interesse</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <CarGlyph w={64} />
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 26, color: NAVY }}>Kombi · 2019</span>
          </div>
          <div style={{ marginTop: 18, height: 64, borderRadius: 14, background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 - press * 0.05})` }}>
            <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 25, color: WHITE }}>Kaufvertrag erstellen</span>
          </div>
        </div>
      </div>,
    );
  }
  // Kaufvertrag + Rechnung (Takte 12–16)
  if (f >= F(22.6) && f < F(32.3)) {
    const out = p01(f, 31.8, 32.1, EIN);
    const a1 = p01(f, 22.75, 23.15, EOUT) * (1 - out);
    const a2 = p01(f, 23.0, 23.4, EOUT) * (1 - out);
    ui.push(
      <div key="con" style={{ position: "absolute", left: CON.x, top: CON.y, width: CON.w, height: CON.h, opacity: a1 }}>
        <div style={{ height: 72, background: NAVY }} />
        <div style={{ padding: "26px 30px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, color: NAVY, letterSpacing: "-0.02em" }}>Kaufvertrag</div>
          <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 19, color: NAVY, opacity: 0.6 }}>Max Mustermann · Kombi · 2019</div>
          {[300, 260, 310, 220, 280, 240].map((w, k) => (
            <div key={k} style={{ height: 10, width: w, background: GRAY, borderRadius: 5 }} />
          ))}
          <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ width: 150, height: 3, background: NAVY }} />
              <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 16, color: NAVY, opacity: 0.6, marginTop: 6 }}>Unterschrift</div>
            </div>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: WHITE, background: ORANGE, padding: "6px 14px", borderRadius: 6, transform: `scale(${p01(f, 23.5, 23.8, EOUT)})` }}>PDF</div>
          </div>
        </div>
      </div>,
    );
    ui.push(
      <div key="inv" style={{ position: "absolute", left: INV.x, top: INV.y, width: INV.w, height: INV.h, opacity: a2 }}>
        <div style={{ height: 72, display: "flex", alignItems: "center", paddingLeft: 30, fontFamily: FONT, fontWeight: 800, fontSize: 32, color: WHITE, letterSpacing: "-0.02em" }}>Rechnung</div>
        <div style={{ position: "absolute", left: 30, right: 30, bottom: 26, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 22, color: NAVY }}>Gesamt</span>
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, color: NAVY, marginRight: 96 }}>14.900 €</span>
        </div>
      </div>,
    );
    ["E-Rechnung", "ZUGFeRD", "XRechnung"].forEach((lab, k) => {
      const ts = 27.0 + k * 0.5;
      const s = p01(f, ts, ts + 0.3, EOUT) * (1 - out);
      if (s <= 0.01) return;
      ui.push(
        <div key={`st${k}`} style={{ position: "absolute", left: INV.x + 30, top: INV.y + 532 - 240 + k * 64, height: 50, padding: "0 22px", borderRadius: 25, background: NAVY, display: "flex", alignItems: "center", gap: 12, transform: `scale(${mix(1.5, 1, s)}) rotate(${(1 - s) * -8}deg)`, transformOrigin: "left center", opacity: Math.min(1, s * 2) }}>
          <svg viewBox="0 0 24 24" width={26} height={26}>
            <circle cx="12" cy="12" r="11" fill={ORANGE} />
            <path d="M6.5 12.5 L10.5 16 L17.5 8.5" fill="none" stroke={WHITE} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 24, color: WHITE }}>{lab}</span>
        </div>,
      );
    });
  }
  // Mauszeiger + Klick (Takt 11)
  if (f >= F(21.0) && f < F(22.5)) {
    const m = p01(f, 21.0, 21.85);
    const bx = CARD3.x + CARD3.w / 2 + 40;
    const by = CARD3.y + CARD3.h - 70;
    const x = mix(1840, bx, m);
    const y = mix(1000, by, m);
    const ring = interpolate(f - F(22.0), [0, 12], [0, 1], cl);
    const a = 1 - p01(f, 22.25, 22.45);
    ui.push(
      <React.Fragment key="cursor">
        {f >= F(22.0) && <div style={{ position: "absolute", left: bx - 60 * ring, top: by - 60 * ring, width: 120 * ring, height: 120 * ring, borderRadius: "50%", border: `4px solid ${ORANGE}`, opacity: 1 - ring }} />}
        <svg viewBox="0 0 24 24" width={56} height={56} style={{ position: "absolute", left: x, top: y, opacity: a, transform: `scale(${1 - interpolate(f - F(22.0), [0, 3, 8], [0, 0.15, 0], cl)})` }}>
          <path d="M4 2 L4 20 L9 15 L12.5 22 L15.5 20.6 L12 14 L19 14 Z" fill={NAVY} stroke={WHITE} strokeWidth={1.4} strokeLinejoin="round" />
        </svg>
      </React.Fragment>,
    );
  }
  // Offline-Bildschirm: Statusanzeige, WLAN, Fuß (Takte 17–20)
  if (f >= F(33.0) && f < F(40.15)) {
    for (let i = 0; i < 6; i++) {
      const rr = l5Row(i);
      const a = p01(f, 33.0 + i * 0.06, 33.3 + i * 0.06, EOUT) * (1 - p01(f, 39.85, 40.1, EIN));
      ui.push(
        <div key={`mcar${i}`} style={{ position: "absolute", left: rr.x + 22, top: rr.y + 15, transform: `scale(${a})`, transformOrigin: "left center", display: "flex", alignItems: "center", gap: 18 }}>
          <CarGlyph w={52} />
          <div style={{ width: [220, 180, 240, 160, 210, 190][i], height: 9, borderRadius: 5, background: NAVY, opacity: 0.18 }} />
        </div>,
      );
    }
  }
  if (f >= F(32.8) && f < F(40.7)) {
    const exitUp = p01(f, 40.0, 40.5, EIN);
    const st = p01(f, 34.5, 34.85, EOUT) * (1 - p01(f, 40.0, 40.2));
    ui.push(
      <div key="pill" style={{ position: "absolute", left: SCR.x + SCR.w - 210, top: SCR.y + 10, height: 32, padding: "0 14px", borderRadius: 16, background: ORANGE, display: "flex", alignItems: "center", gap: 8, transform: `scale(${st})`, transformOrigin: "right center" }}>
        <div style={{ width: 10, height: 10, borderRadius: 5, background: WHITE, opacity: Math.floor(f / 15) % 2 ? 0.45 : 1 }} />
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 18, color: WHITE, whiteSpace: "nowrap" }}>Offline · läuft</span>
      </div>,
    );
    const w = p01(f, 33.0, 33.4, EOUT);
    const cross = p01(f, 34.0, 34.3, EOUT);
    ui.push(
      <svg key="wifi" viewBox="0 0 120 100" width={140} height={117} style={{ position: "absolute", left: 1360 - 70, top: 50 - exitUp * 260, transform: `scale(${0.6 + 0.4 * w})`, opacity: Math.min(1, w * 2) }}>
        {[46, 31, 16].map((r, k) => (
          <path key={k} d={`M ${60 - r} ${78 - r * 0.62} A ${r} ${r} 0 0 1 ${60 + r} ${78 - r * 0.62}`} fill="none" stroke={NAVY} strokeWidth={10} strokeLinecap="round" />
        ))}
        <circle cx="60" cy="82" r="7" fill={NAVY} />
        <path d="M 14 12 L 106 92" fill="none" stroke={ORANGE} strokeWidth={12} strokeLinecap="round" strokeDasharray={124} strokeDashoffset={124 * (1 - cross)} />
      </svg>,
    );
    const stand = p01(f, 32.85, 33.3, EOUT) * (1 - exitUp);
    ui.push(
      <div key="stand" style={{ position: "absolute", left: 0, top: 0, transform: `translateY(${(1 - stand) * 160}px)`, opacity: stand > 0.02 ? 1 : 0 }}>
        <div style={{ position: "absolute", left: 1310, top: BEZ.y + BEZ.h, width: 100, height: 54, background: NAVY, clipPath: "polygon(18% 0, 82% 0, 100% 100%, 0 100%)" }} />
        <div style={{ position: "absolute", left: 1220, top: BEZ.y + BEZ.h + 54, width: 280, height: 18, borderRadius: 9, background: NAVY }} />
      </div>,
    );
  }

  /* ---------- Held: Fenster → Schild (3D) → Preiskarte → Auto → Unterstrich ---------- */
  let hero: React.ReactNode = null;
  if (f >= F(41.0)) {
    let pts = rrect(W6.w, W6.h, 28);
    let cx = W6.x + W6.w / 2;
    let cy = W6.y + W6.h / 2;
    let color = WHITE;
    let ry = 0;
    let rx = 0;
    let depth = 0;
    const SH = shield(440, 520);
    const CARD = rrect(380, 460, 32);
    const CAR = carShape(560, 210);
    const BAR = rrect(620, 16, 8);
    if (t >= 41.0) {
      const m = p01(f, 41.0, 42.0);
      pts = lerpPts(pts, SH, m);
      cy = mix(cy, 540, m);
      ry = mix(0, -26, m) + p01(f, 42.0, 47.9, Easing.linear) * 10;
      rx = mix(0, 10, m) - p01(f, 42.0, 47.9, Easing.linear) * 4;
      depth = p01(f, 41.2, 42.0);
    }
    if (t >= 48.0) {
      const m = p01(f, 48.0, 48.6);
      pts = lerpPts(SH, CARD, m);
      cx = mix(cx, 960, m);
      cy = mix(540, 520, m);
      ry = mix(-16, 0, m);
      rx = mix(6, 0, m);
      depth = 1 - m;
      color = mixC(WHITE, ORANGE, m);
    }
    let pulse = 0;
    if (t >= 50.0 && t < 53.6) {
      const d = ((f - F(50.0)) % 15) / 15;
      pulse = Math.exp(-d * 9) * 0.025;
    }
    pts = pulse > 0 ? pts.map((q) => [q[0] * (1 + pulse), q[1] * (1 + pulse)] as Pt) : pts;
    if (t >= 54.0) {
      const m = p01(f, 54.0, 54.75);
      pts = lerpPts(CARD, CAR, m);
      cx = 960;
      cy = mix(520, 540, m);
      color = ORANGE;
      depth = 0;
      ry = 0;
      rx = 0;
    }
    if (t >= 54.75) {
      cx = 960 + Math.sin((f - F(54.75)) / 4) * 3;
      cy = 540 - Math.abs(Math.sin((f - F(54.75)) / 3.2)) * 4 * (1 - p01(f, 55.3, 55.5));
    }
    if (t >= 55.5) {
      const m = p01(f, 55.5, 56.0);
      pts = lerpPts(CAR, BAR, m);
      cx = 960;
      cy = mix(540, 660, m);
    }
    const W = 760;
    const Hh = 760;
    const layer = (k: number, fill: string) => (
      <svg key={k} width={W} height={Hh} viewBox={`${-W / 2} ${-Hh / 2} ${W} ${Hh}`} style={{ position: "absolute", left: 0, top: 0, transform: `translateZ(${-k * 6 * depth}px)` }}>
        <polygon points={toPoly(pts)} fill={fill} />
      </svg>
    );
    const dialIn = p01(f, 42.0, 42.5, EOUT) * (1 - p01(f, 47.8, 48.05, EIN));
    const spin = tw(f, 43.5, 44.5, 0, 240) + tw(f, 45.5, 45.7, 0, 20, EOUT);
    hero = (
      <div style={{ position: "absolute", left: cx - W / 2, top: cy - Hh / 2, width: W, height: Hh, perspective: 1400 }}>
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateX(${rx}deg) rotateY(${ry}deg)` }}>
          {depth > 0.01 && Array.from({ length: 12 }, (_, k) => layer(12 - k, ORANGE))}
          {layer(0, color)}
          {dialIn > 0.01 && (
            <svg width={W} height={Hh} viewBox={`${-W / 2} ${-Hh / 2} ${W} ${Hh}`} style={{ position: "absolute", left: 0, top: 0, transform: `translateZ(2px) scale(${dialIn})` }}>
              <circle cx={0} cy={-6} r={128} fill="none" stroke={NAVY} strokeWidth={16} />
              <circle cx={0} cy={-6} r={86} fill="none" stroke={NAVY} strokeWidth={8} />
              <g transform={`translate(0 -6) rotate(${spin})`}>
                {[0, 120, 240].map((a) => (
                  <rect key={a} x={-7} y={-112} width={14} height={86} rx={7} fill={NAVY} transform={`rotate(${a})`} />
                ))}
              </g>
              <circle cx={0} cy={-6} r={30} fill={ORANGE} />
            </svg>
          )}
        </div>
      </div>
    );
  }
  // Räder des Autos (Takte 28) → fliegen zum Punkt im Titel
  let wheels: React.ReactNode = null;
  const TITLE = "AutoKontor";
  const TS = 170;
  const titleW = measure(TITLE + ".", TS, 900);
  const dotX = 960 - titleW / 2 + measure(TITLE, TS, 900) + TS * 0.12;
  const dotY = 440 + TS * 0.98;
  if (f >= F(54.55) && f < F(56.1)) {
    const a = p01(f, 54.55, 54.8, EOUT);
    const m = p01(f, 55.5, 56.0);
    const rot = (f - F(54.55)) * 14;
    [[-0.26, 0.42], [0.26, 0.42]].forEach(([wx, wy], k) => {
      const x = mix(960 + wx * 560, dotX, m);
      const y = mix(540 + wy * 210, dotY, m);
      const r = mix(40, 0, m) * a;
      wheels = (
        <>
          {wheels}
          <svg key={k} width={r * 2 + 2} height={r * 2 + 2} viewBox="-50 -50 100 100" style={{ position: "absolute", left: x - r, top: y - r }}>
            <circle r={48} fill={WHITE} />
            <circle r={20} fill={NAVY} />
            <g transform={`rotate(${rot})`}>
              {[0, 90, 180, 270].map((q) => (
                <rect key={q} x={-4} y={-46} width={8} height={24} rx={4} fill={NAVY} transform={`rotate(${q})`} />
              ))}
            </g>
          </svg>
        </>
      );
    });
  }
  // Fahrtlinien hinter dem Auto
  const speed =
    f >= F(54.8) && f < F(55.55)
      ? [0, 1, 2].map((k) => {
          const l = p01(f, 54.8 + k * 0.05, 55.1 + k * 0.05, EOUT) * (1 - p01(f, 55.35, 55.55));
          return <div key={k} style={{ position: "absolute", left: 960 - 280 - 40 - 140 * l, top: 470 + k * 34, width: 140 * l, height: 8, borderRadius: 4, background: WHITE }} />;
        })
      : null;

  // Preiskarten Start / Pro (aus dem Schild herausgefahren)
  const sideCards: React.ReactNode[] = [];
  if (f >= F(48.4) && f < F(54.6)) {
    (
      [
        ["Start", "19 €", 48.5, 530, -1],
        ["Pro", "39 €", 49.0, 1390, 1],
      ] as const
    ).forEach(([name, price, ts, x, dir]) => {
      const m = p01(f, ts, ts + 0.6);
      const out = p01(f, 54.0, 54.5, EIN);
      const cx = mix(960, x, m) + dir * out * 1400;
      const s = mix(0.9, 1, m);
      sideCards.push(
        <div key={name} style={{ position: "absolute", left: cx - 190, top: 290, width: 380, height: 460, borderRadius: 32, background: WHITE, transform: `scale(${s})` }}>
          <Line f={f} x={0} y={56} w={380} align="center" size={42} weight={700} text={name} inS={ts + 0.25} outS={53.8} />
          <Line f={f} x={0} y={150} w={380} align="center" size={112} weight={900} text={price} inS={ts + 0.35} outS={53.8} />
        </div>,
      );
    });
  }

  return (
    <AbsoluteFill style={{ background: navyBg ? NAVY : GRAY, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${cam})`, transformOrigin: "50% 50%" }}>
        {sideCards}
        {hero}
        {blocks}
        {ui}
        {speed}
        {wheels}

        {/* ---------- Text ---------- */}
        {/* 0–6 s */}
        <Line f={f} x={120} y={210} size={150} weight={900} text="Zettel." inS={0.5} outS={5.5} />
        <Line f={f} x={120} y={380} size={150} weight={900} text="Excel." inS={1.5} outS={5.55} />
        <Line f={f} x={120} y={550} size={150} weight={900} text="Ordner." inS={2.5} outS={5.6} />
        <Line f={f} x={120} y={720} size={150} weight={900} text="Chaos?" color={ORANGE} inS={3.5} outS={5.65} />
        {/* 6–12 s */}
        <Line f={f} x={120} y={330} size={110} weight={900} text="AutoKontor." inS={7.0} outS={11.6} />
        {f >= F(7.5) && f < F(12.0) && <div style={{ position: "absolute", left: 124, top: 492, width: 120, height: 12, background: ORANGE, transformOrigin: "left", transform: `scaleX(${p01(f, 7.5, 7.9, EOUT) * (1 - p01(f, 11.6, 11.9, EIN))})` }} />}
        <Line f={f} x={120} y={540} size={52} weight={600} text="Die Software für" inS={8.0} outS={11.65} />
        <Line f={f} x={120} y={610} size={52} weight={600} text="Gebrauchtwagenhändler." inS={8.5} outS={11.7} />
        {/* 12–22 s */}
        <Line f={f} x={120} y={66} size={62} weight={800} text="Fahrzeuge und Kunden an einem Ort." inS={13.0} outS={21.8} />
        {/* 22–32 s */}
        <Line f={f} x={120} y={300} size={84} text="Kaufvertrag" inS={23.0} outS={26.75} />
        <Line f={f} x={120} y={405} size={84} text="und Rechnung" inS={23.5} outS={26.8} />
        <Line f={f} x={120} y={530} size={52} weight={600} text="mit wenigen Klicks." inS={24.0} outS={26.85} />
        <Line f={f} x={120} y={300} size={84} text="Auch als" inS={27.0} outS={31.75} />
        <Line f={f} x={120} y={405} size={84} text="E-Rechnung" color={ORANGE} inS={27.5} outS={31.8} />
        <Line f={f} x={120} y={530} size={52} weight={600} text="(ZUGFeRD, XRechnung)." inS={28.0} outS={31.85} />
        {/* 32–40 s */}
        <Line f={f} x={120} y={300} size={84} text="Läuft offline" inS={33.0} outS={39.75} />
        <Line f={f} x={120} y={405} size={84} text="auf deinem PC." inS={33.5} outS={39.8} />
        {(["Windows", "Mac", "Linux"] as const).map((os, k) => {
          const ts = 36.0 + k * 0.5;
          const a = p01(f, ts, ts + 0.35, EOUT) * (1 - p01(f, 39.8, 40.1, EIN));
          if (a <= 0.01) return null;
          const xs = [120, 362, 528][k];
          return (
            <div key={os} style={{ position: "absolute", left: xs, top: 560, height: 66, padding: "0 30px", borderRadius: 33, background: NAVY, display: "flex", alignItems: "center", transform: `translateY(${(1 - a) * 40}px)`, opacity: Math.min(1, a * 2) }}>
              <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 32, color: WHITE, letterSpacing: "-0.01em" }}>{os}</span>
            </div>
          );
        })}
        {/* 40–48 s */}
        <Line f={f} x={120} y={280} size={84} color={WHITE} text="Deine Daten" inS={41.0} outS={47.75} />
        <Line f={f} x={120} y={385} size={84} color={ORANGE} text="bleiben bei dir." inS={41.5} outS={47.8} />
        <Line f={f} x={120} y={525} size={40} weight={600} color={GRAY} text="Automatische Datensicherung." inS={43.5} outS={47.85} />
        <Line f={f} x={120} y={590} size={40} weight={600} color={GRAY} text="Unterstützt GoBD-Anforderungen." inS={45.5} outS={47.9} />
        {/* 48–54 s: Text der Basic-Karte (auf dem Helden) */}
        <Line f={f} x={770} y={346} w={380} align="center" size={42} weight={700} color={WHITE} text="Basic" inS={48.75} outS={53.8} />
        <Line f={f} x={770} y={440} w={380} align="center" size={112} weight={900} color={WHITE} text="29 €" inS={48.85} outS={53.8} />
        <Line f={f} x={0} y={800} w={1920} align="center" size={32} weight={600} color={GRAY} text="pro Monat zzgl. USt." inS={50.0} outS={53.8} />
        {/* 54–60 s */}
        <Line
          f={f}
          x={0}
          y={440}
          w={1920}
          align="center"
          size={TS}
          weight={900}
          color={WHITE}
          text={
            <>
              {TITLE}
              <span style={{ color: ORANGE, opacity: f >= F(55.95) ? 1 : 0 }}>.</span>
            </>
          }
          inS={55.55}
        />
        <Line f={f} x={0} y={712} w={1920} align="center" size={52} weight={600} color={WHITE} text="7 Tage kostenlos testen." inS={57.0} />
      </AbsoluteFill>
      <Audio src={staticFile("launch/voice-placed.wav")} />
      <Audio src={staticFile("musik-launch.mp3")} volume={0.85} />
    </AbsoluteFill>
  );
};
