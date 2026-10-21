// Premium-Szenen: eine Komponente pro Effekt-Name in skript-premium*.txt.
import React from "react";
import { AbsoluteFill, interpolate, random, useVideoConfig } from "remotion";
import { BeatProps, EASE, clamp, clean, isEmph } from "../lib";
import { BRAND, C, FONT, P } from "../theme";
import { AppWindow, Burst, CarIcon, Card, Check, Eyes, Headline, Orb, Pill, Stage, at, useAppear } from "./kit";

/** Inhalt mittig; im Hochformat etwas größer gezoomt, damit das Bild gefüllt ist. */
const Center: React.FC<{ children: React.ReactNode; gap?: number; style?: React.CSSProperties }> = ({ children, gap = 0, style }) => {
  const { width, height } = useVideoConfig();
  const zoom = height > width ? 1.15 : 1.25;
  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap, transform: `scale(${zoom})`, ...style }}>{children}</AbsoluteFill>
  );
};

const n = (w: string) => clean(w).toLowerCase().replace(/[^a-zäöüß0-9-]/g, "");
const fadeUp = (frame: number, f: number, dist = 40) => {
  const t = interpolate(frame - f, [0, 8], [0, 1], { ...clamp, easing: EASE });
  return { opacity: frame < f ? 0 : t, transform: `translateY(${(1 - t) * dist}px)`, filter: `blur(${(1 - t) * 8}px)` };
};

/* ---------- 1. CHAOS: Zettel, Excel, Ordner fliegen überall herum (dunkel) ---------- */
const Zettel: React.FC<{ s: number; k: number }> = ({ s, k }) => (
  <div style={{ width: 230 * s, height: 210 * s, background: "linear-gradient(160deg,#FFF59A,#FFE45C)", boxShadow: "0 20px 40px rgba(0,0,0,.4)", padding: 22 * s, fontFamily: FONT.serif, fontStyle: "italic", fontSize: 40 * s, color: "#3A3200", lineHeight: 1.1 }}>
    {["Kunde ruft zurück!", "TÜV 03/26?", "Anzahlung 500 €", "Schlüssel??"][k % 4]}
  </div>
);
const Excel: React.FC<{ s: number; k: number }> = ({ s, k }) => (
  <Card w={330 * s} dark style={{ padding: 0 }}>
    <div style={{ background: "#1F7A45", color: "#fff", fontSize: 20 * s, fontWeight: 700, padding: `${10 * s}px ${14 * s}px` }}>{["Bestand_final_v3.xlsx", "Kunden_ALT.xlsx", "Rechnungen_2024.xlsx"][k % 3]}</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 * s, padding: 12 * s }}>
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i} style={{ height: 16 * s, borderRadius: 3, background: i < 4 ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.12)" }} />
      ))}
    </div>
  </Card>
);
const Ordner: React.FC<{ s: number; k: number }> = ({ s, k }) => (
  <div style={{ position: "relative", width: 280 * s, height: 200 * s }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: 120 * s, height: 40 * s, borderRadius: `${12 * s}px ${12 * s}px 0 0`, background: "#D9A04F" }} />
    <div style={{ position: "absolute", left: 0, top: 26 * s, right: 0, bottom: 0, borderRadius: 14 * s, background: "linear-gradient(170deg,#F2C57A,#E0A653)", boxShadow: "0 20px 40px rgba(0,0,0,.4)", display: "flex", alignItems: "flex-end", padding: 18 * s, fontFamily: FONT.ui, fontWeight: 700, fontSize: 26 * s, color: "#5A3A08" }}>
      {["Verträge 2024", "Rechnungen", "Kunden ALT", "Belege ???"][k % 4]}
    </div>
  </div>
);

export const Chaos: React.FC<BeatProps> = (p) => {
  const ap = useAppear();
  const { width: W, height: H, frame } = p;
  const fz = at(p.words, "zettel", 0);
  const fe = at(p.words, "excel", 6);
  const fo = at(p.words, "ordner", 12);
  const fu = at(p.words, "überall", 18);
  const items = [
    ...[0, 1].map((k) => ({ kind: 0, k, f: fz + k * 3 })),
    ...[0, 1].map((k) => ({ kind: 1, k, f: fe + k * 3 })),
    ...[0, 1].map((k) => ({ kind: 2, k, f: fo + k * 3 })),
    ...Array.from({ length: 9 }).map((_, k) => ({ kind: k % 3, k: k + 2, f: fu + k * 1.5 })),
  ];
  return (
    <Stage tone="dark" frame={frame} seed="chaos" dots={6}>
      {items.map((it, i) => {
        const z = random(`cz${i}`);
        const ang = random(`ca${i}`) * Math.PI * 2 + frame * 0.012 * (0.6 + z); // Wirbelsturm
        const rad = 0.3 + random(`cr${i}`) * 0.22;
        const x = W / 2 + Math.cos(ang) * W * rad * (p.vertical ? 1.15 : 1.4) + Math.sin((frame + i * 20) / 30) * 20;
        const y = H / 2 + Math.sin(ang) * H * rad * (p.vertical ? 0.95 : 0.9) + Math.cos((frame + i * 13) / 26) * 16;
        const s = ap(frame, it.f, 200, 13);
        const scale = (0.55 + z * 0.6) * (p.vertical ? 1 : 0.8);
        const Comp = [Zettel, Excel, Ordner][it.kind];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `translate(-50%,-50%) scale(${scale * (0.6 + 0.4 * s)}) rotate(${(random(`ct${i}`) - 0.5) * 30 + (frame - it.f) * 0.15}deg) perspective(900px) rotateY(${(random(`cy${i}`) - 0.5) * 40}deg)`,
              opacity: frame < it.f ? 0 : Math.min(1, s * 1.4) * (0.55 + z * 0.45),
              filter: `blur(${z < 0.3 ? (0.3 - z) * 16 : 0}px)`,
              zIndex: Math.round(z * 10),
            }}
          >
            <Comp s={1} k={it.k} />
          </div>
        );
      })}
      <Center style={{ zIndex: 20 }}>
        <Headline words={p.words} frame={frame} size={p.vertical ? 104 : 110} color="#fff" width={W * (p.vertical ? 0.76 : 0.68)} style={{ textShadow: "0 10px 40px rgba(0,0,0,.6)" }} />
      </Center>
    </Stage>
  );
};

/* ---------- 2. SCHLUSS: orange, riesiges schwarzes Wort ---------- */
export const Schluss: React.FC<BeatProps> = (p) => {
  const ap = useAppear();
  const last = p.words[p.words.length - 1];
  const s = ap(p.frame, last.f, 260, 12);
  const word = clean(last.w).toUpperCase();
  const size = Math.min(260, (p.width * 0.86) / (word.length * 0.66));
  return (
    <Stage tone="orange" frame={p.frame} seed="schluss" dots={4}>
      <Burst frame={p.frame} at={last.f} x={p.width / 2} y={p.height / 2 + 40} size={1.6} count={30} seed="schluss" colors={["#FFFFFF", "#FFE2CF", "#FFD2B5"]} />
      <Center gap={20}>
        <Headline words={p.words.slice(0, -1)} frame={p.frame} size={p.vertical ? 70 : 64} color="#fff" weight={700} />
        <div
          style={{
            fontFamily: FONT.ui,
            fontWeight: 700,
            fontSize: size,
            letterSpacing: "-0.06em",
            color: P.ink,
            lineHeight: 1,
            opacity: p.frame < last.f ? 0 : 1,
            transform: `scale(${interpolate(s, [0, 1], [1.6, 1])})`,
            filter: `blur(${interpolate(p.frame - last.f, [0, 4], [12, 0], clamp)}px)`,
          }}
        >
          {word}
        </div>
      </Center>
    </Stage>
  );
};

/* ---------- 3. LOGO: AutoKontor wird enthüllt ---------- */
const Logo: React.FC<{ size: number; frame: number; f: number }> = ({ size, frame, f }) => {
  const ap = useAppear();
  const a = ap(frame, f, 160, 12);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.24,
        background: `linear-gradient(145deg, #4B8DFF, ${C.blue} 50%, #1B4FD1)`,
        color: "#fff",
        fontFamily: FONT.ui,
        fontWeight: 700,
        fontSize: size * 0.46,
        letterSpacing: "-0.04em",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 ${size * 0.15}px ${size * 0.35}px rgba(47,123,255,.35), inset 0 2px 0 rgba(255,255,255,.35)`,
        transform: `scale(${a}) rotate(${(1 - a) * -30}deg)`,
        opacity: frame < f ? 0 : 1,
      }}
    >
      {BRAND.logoText}
    </div>
  );
};

export const LogoReveal: React.FC<BeatProps> = (p) => {
  const fName = at(p.words, "autokontor", 6);
  const t = interpolate(p.frame - fName, [0, 10], [0, 1], { ...clamp, easing: EASE });
  const ring = interpolate(p.frame, [0, 14], [0, 1], { ...clamp, easing: EASE });
  return (
    <Stage frame={p.frame} seed="logo" dots={7}>
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 900, height: 900, borderRadius: "50%", border: `3px solid ${P.orange}`, opacity: (1 - ring) * 0.5, transform: `scale(${0.3 + ring})` }} />
      </AbsoluteFill>
      <Center gap={40}>
        <Headline words={p.words.filter((w) => n(w.w) !== "autokontor")} frame={p.frame} size={64} color={P.sub} />
        <div style={{ display: "flex", flexDirection: p.vertical ? "column" : "row", alignItems: "center", gap: 36 }}>
          <Logo size={p.vertical ? 230 : 190} frame={p.frame} f={Math.max(0, fName - 4)} />
          <div style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: p.vertical ? 136 : 160, letterSpacing: "-0.05em", color: P.ink, clipPath: `inset(0 ${(1 - t) * 100}% 0 0)`, transform: `translateX(${(1 - t) * -30}px)` }}>
            {BRAND.name}
          </div>
        </div>
      </Center>
      <Burst frame={p.frame} at={fName} x={p.width / 2} y={p.height / 2} size={1.3} count={26} seed="logo" />
    </Stage>
  );
};

/* ---------- 4. KUGEL: orange Kugel mit Auto, Akzentwort darunter ---------- */
/** Kugel-Figur, die von oben ins Bild plumpst (mit Quetschen beim Aufprall). */
const DropOrb: React.FC<{ size: number; frame: number; f: number; seed: number; look?: number; children?: React.ReactNode }> = ({ size, frame, f, seed, look = 0, children }) => {
  const ap = useAppear();
  const drop = ap(frame, f, 140, 9);
  const squash = drop > 1 ? 1 + (drop - 1) * 0.7 : 1;
  const idle = 1 + Math.sin((frame + seed * 11) / 9) * 0.015;
  return (
    <div style={{ transform: `translateY(${(1 - drop) * -1000}px)`, opacity: frame < f ? 0 : 1 }}>
      <Orb size={size} sx={(1 + (squash - 1) * 0.5) * idle} sy={(1 / squash) * (2 - idle)}>
        <Eyes size={size} frame={frame} seed={seed} lx={look} mood={0.8} />
        {children}
      </Orb>
    </div>
  );
};

export const Kugel: React.FC<BeatProps> = (p) => {
  const fBig = at(p.words, "große", 2);
  const fSmall = at(p.words, "kleine", fBig + 8);
  const size = p.vertical ? 440 : 300;
  const look = interpolate(p.frame, [fSmall, fSmall + 8], [0, 0.8], clamp);
  return (
    <Stage frame={p.frame} seed="kugel" dots={4}>
      <Center gap={p.vertical ? 70 : 40}>
        <Headline words={p.words} only={(w) => !isEmph(w.w)} frame={p.frame} size={p.vertical ? 74 : 60} width={p.width * 0.8} />
        <div style={{ display: "flex", alignItems: "flex-end", gap: size * 0.12 }}>
          <DropOrb size={size} frame={p.frame} f={fBig} seed={1} look={look}>
            <div style={{ position: "absolute", bottom: size * 0.12 }}>
              <CarIcon s={size * 0.3} />
            </div>
          </DropOrb>
          <DropOrb size={size * 0.55} frame={p.frame} f={fSmall} seed={2} look={-0.8}>
            <div style={{ position: "absolute", bottom: size * 0.06 }}>
              <CarIcon s={size * 0.18} />
            </div>
          </DropOrb>
        </div>
        <Headline words={p.words} only={(w) => isEmph(w.w)} frame={p.frame} size={p.vertical ? 86 : 96} emphScale={1} />
      </Center>
    </Stage>
  );
};

/* ---------- 5. KARTEN: schwebende UI-Karten (Fahrzeuge, Kunden, Verträge, Rechnungen, PDF) ---------- */
const VehicleCard: React.FC<{ s: number }> = ({ s }) => (
  <Card w={380 * s}>
    <div style={{ height: 150 * s, borderRadius: 18 * s, background: "linear-gradient(135deg,#2B3550,#0F1424)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 * s }}>
      <CarIcon s={170 * s} color="#E9EDF7" />
    </div>
    <div style={{ fontWeight: 700, fontSize: 30 * s }}>BMW 320d Touring</div>
    <div style={{ color: P.sub, fontSize: 22 * s, margin: `${6 * s}px 0 ${12 * s}px` }}>2021 · 64.000 km</div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontWeight: 700, fontSize: 32 * s }}>24.990 €</span>
      <span style={{ background: "#E5F7EC", color: P.green, fontWeight: 700, fontSize: 20 * s, borderRadius: 999, padding: `${5 * s}px ${12 * s}px` }}>Verfügbar</span>
    </div>
  </Card>
);
const CustomerCard: React.FC<{ s: number }> = ({ s }) => (
  <Card w={360 * s}>
    <div style={{ display: "flex", alignItems: "center", gap: 18 * s }}>
      <div style={{ width: 84 * s, height: 84 * s, borderRadius: "50%", background: `linear-gradient(145deg, ${P.orangeHi}, ${P.orange})`, color: "#fff", fontWeight: 700, fontSize: 34 * s, display: "flex", alignItems: "center", justifyContent: "center" }}>MM</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 30 * s }}>Max Müller</div>
        <div style={{ color: P.sub, fontSize: 22 * s }}>Kunde seit 2023</div>
      </div>
    </div>
    <div style={{ marginTop: 20 * s, display: "flex", gap: 10 * s }}>
      {["2 Käufe", "Tel.", "E-Mail"].map((t) => (
        <span key={t} style={{ background: P.bg, borderRadius: 999, fontSize: 20 * s, padding: `${6 * s}px ${14 * s}px`, color: P.sub, fontWeight: 700 }}>{t}</span>
      ))}
    </div>
  </Card>
);
const DocCard: React.FC<{ s: number; title: string; pdf: number; frame: number }> = ({ s, title, pdf, frame }) => {
  const ap = useAppear();
  const st = ap(frame, pdf, 260, 10);
  return (
    <Card w={330 * s} style={{ height: 420 * s }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 * s }}>
        <div style={{ background: C.blue, color: "#fff", fontWeight: 700, fontSize: 18 * s, borderRadius: 6, padding: `${3 * s}px ${7 * s}px` }}>{BRAND.logoText}</div>
        <div style={{ fontSize: 16 * s, color: P.sub }}>Nr. 2026-0147</div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 32 * s, letterSpacing: "-0.02em", marginBottom: 18 * s }}>{title}</div>
      {[78, 60, 70, 50, 66].map((w, i) => (
        <div key={i} style={{ height: 12 * s, width: `${w}%`, borderRadius: 6, background: i === 0 ? "#C9CEDA" : P.line, marginBottom: 14 * s }} />
      ))}
      <div style={{ borderTop: `2px solid ${P.ink}`, marginTop: 16 * s, paddingTop: 12 * s, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 24 * s }}>
        <span>Gesamt</span>
        <span>24.990 €</span>
      </div>
      <div style={{ position: "absolute", right: 22 * s, bottom: 22 * s, background: "#E5322D", color: "#fff", fontWeight: 700, fontSize: 26 * s, borderRadius: 10 * s, padding: `${6 * s}px ${14 * s}px`, opacity: frame < pdf ? 0 : 1, transform: `scale(${interpolate(st, [0, 1], [2.4, 1])}) rotate(-6deg)` }}>PDF</div>
    </Card>
  );
};

export const Karten: React.FC<BeatProps> = (p) => {
  const ap = useAppear();
  const f = {
    fahrzeuge: at(p.words, "fahrzeuge", 0),
    kunden: at(p.words, "kunden", 8),
    vertrag: at(p.words, "kaufverträge", 16),
    rechnung: at(p.words, "rechnungen", 24),
    pdf: at(p.words, "pdf", 30),
  };
  const s = p.vertical ? 1.22 : 0.85;
  const pos = p.vertical
    ? [[-210, -580], [200, -270], [-200, 110], [215, 420]]
    : [[-610, -60], [-200, 90], [200, -70], [610, 80]];
  const cards = [
    { f: f.fahrzeuge, el: <VehicleCard s={s} /> },
    { f: f.kunden, el: <CustomerCard s={s} /> },
    { f: f.vertrag, el: <DocCard s={s} title="Kaufvertrag" pdf={f.pdf} frame={p.frame} /> },
    { f: f.rechnung, el: <DocCard s={s} title="Rechnung" pdf={f.pdf + 3} frame={p.frame} /> },
  ];
  const labels: [number, string][] = [
    [f.fahrzeuge, "Fahrzeuge."],
    [f.kunden, "Kunden."],
    [f.vertrag, "Kaufverträge."],
    [f.rechnung, "Rechnungen."],
    [f.pdf, "Alles als PDF."],
  ];
  const cur = [...labels].reverse().find(([lf]) => p.frame >= lf) ?? labels[0];
  const win = ap(p.frame, 0, 120, 16);
  const pillPop = ap(p.frame, cur[0], 260, 14);
  return (
    <Stage frame={p.frame} seed="karten" dots={4}>
      <AbsoluteFill style={{ perspective: 1800 }}>
        {/* App-Fenster schräg im Raum, die Karten fliegen daraus hervor */}
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ transform: `translateY(${(1 - win) * 300}px) rotateX(16deg) rotateY(${-18 + p.frame * 0.05}deg) scale(${(p.vertical ? 0.92 : 0.82) * (1 + p.frame * 0.0008)})`, opacity: Math.min(1, win * 1.5) }}>
            <AppWindow w={p.vertical ? 980 : 1100} frame={p.frame} at={2} />
          </div>
        </AbsoluteFill>
        <AbsoluteFill style={{ transform: `rotateX(12deg) rotateY(${-10 + p.frame * 0.06}deg) scale(${1 + p.frame * 0.0012})`, transformStyle: "preserve-3d" }}>
          {cards.map((c, i) => {
            const a = ap(p.frame, c.f, 170, 14);
            const bob = Math.sin((p.frame + i * 25) / 22) * 10;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: p.width / 2 + pos[i][0],
                  top: p.height / 2 + pos[i][1] + bob,
                  transform: `translate(-50%,-50%) translate(${(1 - a) * -pos[i][0] * 0.8}px, ${(1 - a) * -pos[i][1] * 0.8}px) scale(${0.55 + 0.45 * a}) rotate(${[-4, 3, -3, 4][i] * a}deg)`,
                  opacity: p.frame < c.f ? 0 : Math.min(1, a * 1.5),
                  filter: `blur(${(1 - Math.min(1, a)) * 10}px)`,
                }}
              >
                {c.el}
              </div>
            );
          })}
        </AbsoluteFill>
      </AbsoluteFill>
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", paddingBottom: p.vertical ? 150 : 90 }}>
        <div style={{ transform: `scale(${0.7 + 0.3 * pillPop})` }}>
          <Pill size={p.vertical ? 46 : 40}>{cur[1]}</Pill>
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

/* ---------- 6. KLICK: Cursor klickt „PDF erstellen“ ---------- */
const Cursor: React.FC<{ s: number }> = ({ s }) => (
  <svg viewBox="0 0 24 24" width={s} height={s} style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,.3))" }}>
    <path d="M4 2 L4 19 L8.5 15 L11.5 22 L14.5 20.7 L11.6 14 L17.5 14 Z" fill="#111" stroke="#fff" strokeWidth={1.4} strokeLinejoin="round" />
  </svg>
);

export const Klick: React.FC<BeatProps> = (p) => {
  const ap = useAppear();
  const fk = at(p.words, "klicks", Math.round(p.dur * 0.5));
  const move = interpolate(p.frame, [0, Math.max(4, fk - 2)], [0, 1], { ...clamp, easing: EASE });
  const press = interpolate(p.frame - fk, [0, 3, 8], [1, 0.92, 1], clamp);
  const ripple = interpolate(p.frame - fk, [0, 16], [0, 1], clamp);
  const fly = ap(p.frame, fk + 4, 120, 16);
  const bw = p.vertical ? 600 : 520;
  return (
    <Stage frame={p.frame} seed="klick" dots={4}>
      <Center gap={p.vertical ? 120 : 60}>
        <Headline words={p.words} frame={p.frame} size={p.vertical ? 80 : 72} />
        <div style={{ position: "relative", zIndex: 0 }}>
          <div style={{ position: "absolute", left: "50%", top: "50%", zIndex: -1, transform: `translate(-50%,-50%) translate(${-fly * 220}px, ${fly * 330}px) rotate(${fly * -8}deg) scale(${0.45 + fly * 0.3})`, opacity: p.frame < fk + 4 ? 0 : 1 }}>
            <DocCard s={0.8} title="Rechnung" pdf={fk + 8} frame={p.frame} />
          </div>
          <div style={{ position: "absolute", left: "50%", top: "50%", width: bw * 1.2, height: bw * 1.2, marginLeft: -bw * 0.6, marginTop: -bw * 0.6, borderRadius: "50%", border: `4px solid ${P.orange}`, opacity: p.frame < fk ? 0 : (1 - ripple) * 0.6, transform: `scale(${0.3 + ripple * 0.9})` }} />
          <div style={{ width: bw, padding: "38px 0", borderRadius: 999, background: `linear-gradient(180deg, #FF8A3D, ${P.orange})`, color: "#fff", fontFamily: FONT.ui, fontWeight: 700, fontSize: p.vertical ? 56 : 48, textAlign: "center", boxShadow: "0 24px 50px rgba(201,68,10,.35), inset 0 2px 0 rgba(255,255,255,.4)", transform: `scale(${press})` }}>
            PDF erstellen
          </div>
          <div style={{ position: "absolute", left: bw * 0.62 + (1 - move) * 360, top: 60 + (1 - move) * 420 }}>
            <Cursor s={p.vertical ? 110 : 90} />
          </div>
        </div>
      </Center>
    </Stage>
  );
};

/* ---------- 7. BADGES: E-Rechnung, ZUGFeRD, XRechnung ---------- */
export const Badges: React.FC<BeatProps> = (p) => {
  const ap = useAppear();
  const names = ["e-rechnung", "zugferd", "xrechnung"];
  const badgeWords = p.words.filter((w) => names.includes(n(w.w)));
  const first = badgeWords[0]?.f ?? 0;
  const lead = p.words.filter((w) => w.f < first || badgeWords.length === 0);
  return (
    <Stage frame={p.frame} seed="badges" dots={4}>
      <Center gap={p.vertical ? 70 : 40}>
        <Headline words={lead} frame={p.frame} size={p.vertical ? 84 : 66} />
        <div style={{ display: "flex", flexDirection: p.vertical ? "column" : "row", alignItems: "center", gap: p.vertical ? 60 : 80 }}>
          <div style={{ transform: `rotate(-4deg) translateY(${Math.sin(p.frame / 20) * 8}px)` }}>
            <DocCard s={p.vertical ? 0.95 : 0.85} title="Rechnung" pdf={-100} frame={p.frame} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 26, alignItems: p.vertical ? "center" : "flex-start" }}>
            {badgeWords.map((w, i) => {
              const a = ap(p.frame, w.f, 230, 13);
              return (
                <div key={i} style={{ opacity: p.frame < w.f ? 0 : 1, transform: `translateX(${(1 - a) * 120}px) scale(${0.8 + 0.2 * a})` }}>
                  <Pill size={p.vertical ? 50 : 44} bg="#fff" color={P.ink} style={{ border: `1px solid ${P.line}` }}>
                    <Check s={p.vertical ? 50 : 44} p={interpolate(p.frame - w.f, [3, 12], [0, 1], clamp)} />
                    {clean(w.w).replace(/[.,]$/, "")}
                  </Pill>
                </div>
              );
            })}
          </div>
        </div>
      </Center>
    </Stage>
  );
};

/* ---------- 8./9. LOKAL + WOLKE: Daten-Kugel bleibt im Laptop, Wolke geht leer aus ---------- */
const LaptopFlat: React.FC<{ w: number; children?: React.ReactNode }> = ({ w, children }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    <div style={{ width: w, height: w * 0.63, borderRadius: w * 0.04, background: "#14171F", padding: w * 0.025, boxShadow: "0 40px 80px rgba(30,40,70,.25)" }}>
      <div style={{ width: "100%", height: "100%", borderRadius: w * 0.02, background: `linear-gradient(180deg,#FFFFFF,${P.bg})`, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", left: 0, top: 0 }}>
          <AppWindow w={w * 0.95} frame={60} />
        </div>
        <div style={{ position: "absolute", inset: 0, background: "rgba(238,240,245,.55)", backdropFilter: "blur(2px)" }} />
        {children}
      </div>
    </div>
    <div style={{ width: w * 1.16, height: w * 0.035, borderRadius: `0 0 ${w * 0.03}px ${w * 0.03}px`, background: "linear-gradient(180deg,#C9CED9,#9EA5B4)" }} />
  </div>
);

const Shield: React.FC<{ s: number; p: number }> = ({ s, p }) => (
  <svg viewBox="0 0 24 24" width={s} height={s} style={{ transform: `scale(${p})` }}>
    <path d="M12 2 L20 5 V11 C20 16 16.5 20 12 22 C7.5 20 4 16 4 11 V5 Z" fill={P.green} />
    <path d="M8 12 L11 15 L16.5 9" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CloudGuy: React.FC<{ s: number; sad: number }> = ({ s, sad }) => (
  <svg viewBox="0 0 120 80" width={s} height={s * 0.66}>
    <defs>
      <radialGradient id="cg" cx="35%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#E8F0FF" />
        <stop offset="60%" stopColor="#8FB2FF" />
        <stop offset="100%" stopColor="#4F7FE8" />
      </radialGradient>
    </defs>
    <path d="M30 70 Q8 70 8 52 Q8 36 26 34 Q28 14 50 12 Q70 10 78 28 Q96 22 106 38 Q116 54 102 66 Q98 70 90 70 Z" fill="url(#cg)" />
    <ellipse cx={50} cy={46} rx={6} ry={7 - sad * 3} fill="#14171F" />
    <ellipse cx={76} cy={46} rx={6} ry={7 - sad * 3} fill="#14171F" />
    <path d={sad > 0.5 ? "M54 62 Q63 56 72 62" : "M54 58 Q63 64 72 58"} fill="none" stroke="#14171F" strokeWidth={3} strokeLinecap="round" />
  </svg>
);

export const Lokal: React.FC<BeatProps> = (p) => {
  const ap = useAppear();
  const drop = ap(p.frame, 3, 150, 10);
  const lw = p.vertical ? 700 : 640;
  return (
    <Stage frame={p.frame} seed="lokal" dots={4}>
      <Center gap={p.vertical ? 90 : 50}>
        <Headline words={p.words} frame={p.frame} size={p.vertical ? 66 : 62} width={p.width * 0.78} />
        <LaptopFlat w={lw}>
          <div style={{ transform: `translateY(${(1 - drop) * -500}px)`, display: "flex", flexDirection: "column", alignItems: "center", gap: lw * 0.02 }}>
            <Orb size={lw * 0.3}>
              <Eyes size={lw * 0.3} frame={p.frame} seed={3} ly={0.3} mood={0.9} />
            </Orb>
            <Pill size={lw * 0.05}>Deine Daten</Pill>
          </div>
        </LaptopFlat>
      </Center>
    </Stage>
  );
};

export const Wolke: React.FC<BeatProps> = (p) => {
  const ap = useAppear();
  const fc = at(p.words, "cloud", Math.round(p.dur * 0.6));
  const enter = ap(p.frame, 0, 140, 14);
  const pull = interpolate(p.frame, [4, Math.max(5, fc - 2)], [0, 1], { ...clamp, easing: EASE }) * (p.frame < fc ? 1 : 0);
  const snap = ap(p.frame, fc, 260, 10);
  const shield = ap(p.frame, fc, 240, 11);
  const gone = interpolate(p.frame - fc, [4, 16], [0, 1], clamp);
  const lw = p.vertical ? 700 : 640;
  return (
    <Stage frame={p.frame} seed="lokal" dots={4}>
      <Center gap={p.vertical ? 170 : 90}>
        <Headline words={p.words} frame={p.frame} size={p.vertical ? 72 : 66} />
        <div style={{ position: "relative" }}>
          <LaptopFlat w={lw}>
            <div style={{ transform: `translate(${pull * lw * 0.12 * (1 - snap)}px, ${-pull * lw * 0.12 * (1 - snap)}px) scale(${1 + pull * 0.12 * (1 - snap)}, ${1 - pull * 0.1 * (1 - snap)})` }}>
              <Orb size={lw * 0.3}>
                <Eyes size={lw * 0.3} frame={p.frame} seed={3} lx={p.frame < fc ? 0.9 : 0} ly={p.frame < fc ? -0.8 : 0.2} mood={p.frame < fc ? -0.7 : 1} />
              </Orb>
            </div>
            <div style={{ position: "absolute", right: lw * 0.06, bottom: lw * 0.05, opacity: p.frame < fc ? 0 : 1 }}>
              <Shield s={lw * 0.16} p={shield} />
            </div>
          </LaptopFlat>
          <div
            style={{
              position: "absolute",
              right: -lw * 0.1,
              top: -lw * 0.24,
              transform: `translate(${(1 - enter) * 500}px, ${-(1 - enter) * 200}px) scale(${1 - gone * 0.6}) rotate(${gone * 20}deg)`,
              opacity: 1 - gone,
            }}
          >
            <CloudGuy s={lw * 0.5} sad={p.frame >= fc ? 1 : 0} />
            <div style={{ position: "absolute", left: "50%", top: "40%", transform: "translate(-50%,-50%)", fontFamily: FONT.ui, fontWeight: 700, fontSize: lw * 0.2, color: "#E5322D", opacity: p.frame < fc ? 0 : 1 }}>✕</div>
          </div>
        </div>
      </Center>
    </Stage>
  );
};

/* ---------- 10. BACKUP: jeden Tag ein Häkchen ---------- */
export const Backup: React.FC<BeatProps> = (p) => {
  const ap = useAppear();
  const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const spin = p.frame * 6;
  const cw = p.vertical ? 108 : 120;
  const o = ap(p.frame, 0, 160, 12);
  return (
    <Stage frame={p.frame} seed="backup" dots={4}>
      <Center gap={p.vertical ? 90 : 50}>
        <div style={{ transform: `scale(${o})` }}>
          <Orb size={p.vertical ? 300 : 230}>
            <svg viewBox="0 0 24 24" width={p.vertical ? 150 : 115} height={p.vertical ? 150 : 115} style={{ transform: `rotate(${spin}deg)` }}>
              <path d="M20 12 A8 8 0 1 1 17.7 6.3" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" />
              <path d="M18.5 2.5 L18 6.8 L13.8 6.4" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Orb>
        </div>
        <Headline words={p.words} frame={p.frame} size={p.vertical ? 72 : 64} width={p.width * 0.88} />
        <div style={{ display: "flex", gap: 14 }}>
          {days.map((d, i) => {
            const f = 6 + i * Math.max(2, (p.dur - 14) / days.length);
            const a = ap(p.frame, f, 260, 12);
            return (
              <Card key={d} w={cw} style={{ padding: 0, height: cw * 1.25, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <span style={{ fontWeight: 700, fontSize: cw * 0.28, color: P.sub }}>{d}</span>
                <div style={{ transform: `scale(${p.frame < f ? 0 : a})` }}>
                  <Check s={cw * 0.42} p={interpolate(p.frame - f, [2, 9], [0, 1], clamp)} />
                </div>
              </Card>
            );
          })}
        </div>
      </Center>
    </Stage>
  );
};

/* ---------- 11. PLATTFORM: Windows, Mac, Linux ---------- */
const OsIcon: React.FC<{ k: number; s: number }> = ({ k, s }) => {
  const st = { fill: "none", stroke: P.ink, strokeWidth: 5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 100 100" width={s} height={s}>
      {k === 0 && (
        <>
          <rect x={12} y={18} width={76} height={50} rx={6} {...st} />
          <path d="M40 84 H60 M50 68 V84" {...st} />
        </>
      )}
      {k === 1 && (
        <>
          <rect x={20} y={22} width={60} height={42} rx={5} {...st} />
          <path d="M10 74 H90 l-6 8 H16 Z" {...st} />
        </>
      )}
      {k === 2 && (
        <>
          <path d="M18 30 L40 50 L18 70" {...st} />
          <path d="M50 72 H82" {...st} />
        </>
      )}
    </svg>
  );
};

export const Plattform: React.FC<BeatProps> = (p) => {
  const ap = useAppear();
  const map: Record<string, number> = { windows: 0, büro: 0, mac: 1, laptop: 1, linux: 2 };
  const cards = p.words.filter((w) => n(w.w).replace(/[.,]/g, "") in map);
  const lead = p.words.filter((w) => w.f < (cards[0]?.f ?? 1e9));
  const cw = p.vertical ? 300 : 340;
  return (
    <Stage frame={p.frame} seed="plattform" dots={4}>
      <Center gap={p.vertical ? 80 : 60}>
        <Headline words={lead} frame={p.frame} size={p.vertical ? 76 : 66} />
        <div style={{ display: "flex", flexDirection: p.vertical ? "column" : "row", gap: p.vertical ? 40 : 50 }}>
          {cards.map((w, i) => {
            const a = ap(p.frame, w.f, 220, 12);
            return (
              <div key={i} style={{ opacity: p.frame < w.f ? 0 : 1, transform: `translateY(${(1 - a) * 120}px) scale(${0.7 + 0.3 * a}) rotate(${(1 - a) * 8}deg)` }}>
                <Card w={p.vertical ? 620 : cw} style={{ display: "flex", flexDirection: p.vertical ? "row" : "column", alignItems: "center", gap: 30, padding: p.vertical ? "34px 50px" : 40 }}>
                  <OsIcon k={map[n(w.w).replace(/[.,]/g, "")]} s={p.vertical ? 120 : 140} />
                  <span style={{ fontWeight: 700, fontSize: p.vertical ? 76 : 64, letterSpacing: "-0.03em" }}>{clean(w.w).replace(/[.,]$/, "")}</span>
                </Card>
              </div>
            );
          })}
        </div>
      </Center>
    </Stage>
  );
};

/* ---------- 12. PREIS: orange Kugel „19 €“, „im Monat“, „zzgl. MwSt.“ ---------- */
export const PreisP: React.FC<BeatProps> = (p) => {
  const ap = useAppear();
  const fNum = p.words.find((w) => /\d/.test(w.w))?.f ?? 4;
  const pop = ap(p.frame, fNum, 200, 9);
  const num = parseInt(BRAND.price, 10) || 19;
  const shown = Math.round(interpolate(p.frame - fNum, [0, 10], [0, num], clamp));
  const size = p.vertical ? 560 : 420;
  const before = p.words.filter((w) => w.f < fNum);
  const after = p.words.filter((w) => w.f > fNum && !/^€/.test(clean(w.w)));
  return (
    <Stage frame={p.frame} seed="preis" dots={5}>
      <Center gap={p.vertical ? 40 : 20}>
        <Headline words={before} frame={p.frame} size={p.vertical ? 80 : 64} />
        <div style={{ opacity: p.frame < fNum ? 0 : 1, transform: `scale(${pop})` }}>
          <Orb size={size}>
            <span style={{ fontFamily: FONT.ui, fontWeight: 700, color: "#fff", fontSize: size * 0.3, letterSpacing: "-0.04em", textShadow: "0 4px 14px rgba(120,30,0,.35)" }}>
              {shown} €
            </span>
          </Orb>
        </div>
        <Headline words={after} frame={p.frame} size={p.vertical ? 84 : 70} emphScale={1.3} />
        <div style={{ fontFamily: FONT.ui, fontSize: p.vertical ? 38 : 30, color: P.sub, ...fadeUp(p.frame, fNum + 4, 16) }}>{BRAND.priceNote}</div>
      </Center>
      <Burst frame={p.frame} at={fNum} x={p.width / 2} y={p.height / 2} size={1.5} count={32} seed="preis" />
    </Stage>
  );
};

/* ---------- 13. KÜNDBAR: Abo-Karte mit Häkchen ---------- */
export const Kuendbar: React.FC<BeatProps> = (p) => {
  const ap = useAppear();
  const fk = at(p.words, "kündbar", Math.round(p.dur * 0.5));
  const a = ap(p.frame, 0, 170, 14);
  const toggle = interpolate(p.frame - fk, [0, 6], [0, 1], { ...clamp, easing: EASE });
  const w = p.vertical ? 760 : 620;
  return (
    <Stage frame={p.frame} seed="kuendbar" dots={4}>
      <Center gap={p.vertical ? 90 : 50}>
        <Headline words={p.words} frame={p.frame} size={p.vertical ? 86 : 70} />
        <div style={{ transform: `translateY(${(1 - a) * 120}px)`, opacity: Math.min(1, a * 1.5) }}>
          <Card w={w}>
            <div style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 30 }}>
              <Orb size={w * 0.14}>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: w * 0.04 }}>{BRAND.price}</span>
              </Orb>
              <div>
                <div style={{ fontWeight: 700, fontSize: w * 0.06 }}>Dein Abo</div>
                <div style={{ color: P.sub, fontSize: w * 0.04 }}>
                  {BRAND.pricePrefix} {BRAND.price} {BRAND.priceUnit} · {BRAND.priceNote}
                </div>
              </div>
            </div>
            {[
              ["Laufzeit", "monatlich"],
              ["Kündigen", "jederzeit"],
            ].map(([k, v], i) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${w * 0.028}px 0`, borderTop: `1px solid ${P.line}`, fontSize: w * 0.048 }}>
                <span style={{ color: P.sub }}>{k}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 14, fontWeight: 700 }}>
                  {v}
                  {i === 1 ? (
                    <div style={{ width: w * 0.11, height: w * 0.06, borderRadius: 999, background: interpolate(toggle, [0, 1], [0, 1]) > 0.5 ? P.green : "#C9CED9", position: "relative" }}>
                      <div style={{ position: "absolute", top: w * 0.006, left: w * 0.006 + toggle * w * 0.05, width: w * 0.048, height: w * 0.048, borderRadius: "50%", background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,.25)" }} />
                    </div>
                  ) : (
                    <Check s={w * 0.055} />
                  )}
                </span>
              </div>
            ))}
          </Card>
        </div>
      </Center>
    </Stage>
  );
};

/* ---------- 14. ENDE: Logo, Slogan, Button, Preis ---------- */
export const EndP: React.FC<BeatProps> = (p) => {
  const ap = useAppear();
  const fCta = p.words.find((w) => /\d/.test(w.w))?.f ?? at(p.words, "jetzt", 0);
  const cta = ap(p.frame, fCta, 180, 13);
  const shine = interpolate(p.frame - fCta, [10, 34], [-40, 140], clamp);
  const u = p.vertical ? 0.86 : 0.8;
  const [s1, s2] = BRAND.slogan.split(". ");
  return (
    <Stage frame={p.frame} seed="end" dots={5}>
      <Center gap={0}>
        <Logo size={220 * u} frame={p.frame} f={0} />
        <div style={{ marginTop: 44 * u, fontFamily: FONT.ui, fontWeight: 700, fontSize: 140 * u, letterSpacing: "-0.05em", color: P.ink, ...fadeUp(p.frame, 3, 50) }}>{BRAND.name}</div>
        <div style={{ marginTop: 10 * u, fontSize: 64 * u, color: P.sub, fontFamily: FONT.ui, ...fadeUp(p.frame, 8, 30) }}>
          {s1}. <span style={{ fontFamily: FONT.serif, fontStyle: "italic", color: P.orange, fontSize: 80 * u }}>{s2}</span>
        </div>
        <div
          style={{
            marginTop: 80 * u,
            padding: `${36 * u}px ${64 * u}px`,
            borderRadius: 999,
            background: `linear-gradient(180deg, #FF8A3D, ${P.orange})`,
            color: "#fff",
            fontFamily: FONT.ui,
            fontWeight: 700,
            fontSize: 50 * u,
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 24px 60px rgba(201,68,10,.35), inset 0 2px 0 rgba(255,255,255,.4)",
            opacity: p.frame < fCta ? 0 : 1,
            transform: `scale(${interpolate(cta, [0, 1], [0.7, 1])})`,
          }}
        >
          {BRAND.cta}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(110deg, transparent ${shine - 12}%, rgba(255,255,255,.55) ${shine}%, transparent ${shine + 12}%)` }} />
        </div>
        <div style={{ marginTop: 40 * u, fontFamily: FONT.ui, fontWeight: 700, fontSize: 44 * u, color: P.ink, ...fadeUp(p.frame, fCta + 6, 20) }}>
          {BRAND.pricePrefix} {BRAND.price} {BRAND.priceUnit}
          <span style={{ marginLeft: 14 * u, fontWeight: 400, fontSize: 30 * u, color: P.sub }}>{BRAND.priceNote}</span>
        </div>
        <div style={{ marginTop: 20 * u, fontFamily: FONT.ui, fontSize: 30 * u, letterSpacing: "0.1em", color: P.sub, ...fadeUp(p.frame, fCta + 10, 20) }}>{BRAND.platforms}</div>
      </Center>
      <Burst frame={p.frame} at={fCta} x={p.width / 2} y={p.height * 0.62} size={1.4} count={34} seed="end" />
    </Stage>
  );
};

export const PREMIUM_EFFECTS: Record<string, React.FC<any>> = {
  chaos: Chaos,
  schluss: Schluss,
  logo: LogoReveal,
  kugel: Kugel,
  karten: Karten,
  klick: Klick,
  badges: Badges,
  lokal: Lokal,
  wolke: Wolke,
  backup: Backup,
  plattform: Plattform,
  preis: PreisP,
  kuendbar: Kuendbar,
  end: EndP,
};

