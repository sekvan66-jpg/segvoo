// Nacht-Szenen („AutoKontor bei Nacht“): eine Komponente pro Effekt-Name in skript-nacht*.txt.
import React from "react";
import { AbsoluteFill, interpolate, random, useVideoConfig } from "remotion";
import { BeatProps, EASE, clamp, clean, isEmph } from "../lib";
import { BRAND, C, N, NFONT } from "../theme";
import { at, useAppear } from "../premium/kit";
import { Excel, Ordner, Zettel } from "../premium/scenes";
import { Beams, ChromeText, Gauge, Kicker, LineIcon, NightStage, NightTitle, Panel } from "./kit";

const n = (w: string) => clean(w).toLowerCase().replace(/[^a-zäöüß0-9-]/g, "");

/** Inhalt als Spalte; im Querformat etwas kleiner. */
const Col: React.FC<{ children: React.ReactNode; gap?: number; top?: boolean; style?: React.CSSProperties }> = ({ children, gap = 0, top, style }) => {
  const { width, height } = useVideoConfig();
  const zoom = height > width ? 1 : 0.86;
  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: top ? "flex-start" : "center", gap, transform: `scale(${zoom})`, ...style }}>{children}</AbsoluteFill>
  );
};

/* ---------- 1. STRASSE: Nachtstraße, Zettel/Excel/Ordner fliegen auf die Kamera zu ---------- */
export const Strasse: React.FC<BeatProps> = (p) => {
  const { width: W, height: H, frame } = p;
  const hz = H * (p.vertical ? 0.52 : 0.5);
  const depth = (z: number) => hz + (H * 1.05 - hz) * z * z;
  const fz = at(p.words, "zettel", 0);
  const fe = at(p.words, "excel", 6);
  const fo = at(p.words, "ordner", 12);
  const fu = at(p.words, "überall", 18);
  const items = [
    ...[0, 1].map((k) => ({ kind: 0, k, f: fz + k * 6 })),
    ...[0, 1].map((k) => ({ kind: 1, k, f: fe + k * 6 })),
    ...[0, 1].map((k) => ({ kind: 2, k, f: fo + k * 6 })),
    ...Array.from({ length: 8 }).map((_, k) => ({ kind: k % 3, k: k + 2, f: fu + k * 3 })),
  ];
  const Comp = [Zettel, Excel, Ordner];
  return (
    <NightStage frame={frame} seed="strasse" glow={N.amber} floor={false}>
      {/* Horizont-Dunst */}
      <div style={{ position: "absolute", left: 0, right: 0, top: hz - 160, height: 320, background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${N.amber}30, transparent 70%)` }} />
      {/* Straße */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0B0E14" />
            <stop offset="100%" stopColor="#1A202B" />
          </linearGradient>
        </defs>
        <polygon points={`${W / 2 - W * 0.02},${hz} ${W / 2 + W * 0.02},${hz} ${W * 1.5},${H} ${-W * 0.5},${H}`} fill="url(#road)" />
        {[-1, 1].map((s) => (
          <line key={s} x1={W / 2 + s * W * 0.02} y1={hz} x2={W / 2 + s * W} y2={H} stroke="#C9D3E0" strokeOpacity={0.35} strokeWidth={4} />
        ))}
        {Array.from({ length: 14 }).map((_, k) => {
          const z0 = (k / 14 + frame * 0.018) % 1;
          const z1 = Math.min(1, z0 + 0.035);
          const y0 = depth(z0);
          const y1 = depth(z1);
          const w0 = 2 + z0 * z0 * 26;
          return <polygon key={k} points={`${W / 2 - w0},${y0} ${W / 2 + w0},${y0} ${W / 2 + w0 * 1.1},${y1} ${W / 2 - w0 * 1.1},${y1}`} fill="#F4F7FB" opacity={0.25 + z0 * 0.6} />;
        })}
      </svg>
      <Beams frame={frame} on={0.8} />
      {/* Papierkram fliegt auf die Kamera zu */}
      {items.map((it, i) => {
        const t = (frame - it.f) / 42;
        if (t < 0 || t > 1.1) return null;
        const z = Math.min(1, t);
        const side = random(`ss${i}`) > 0.5 ? 1 : -1;
        const spread = 0.12 + random(`sp${i}`) * 0.32;
        const x = W / 2 + side * W * spread * (0.2 + z * 1.6);
        const y = hz - 40 + (H * 0.55 - hz + 40) * z * z * (p.vertical ? 1 : 0.9) + (random(`sy${i}`) - 0.5) * 200 * z;
        const scale = (0.12 + 1.5 * z * z) * (p.vertical ? 1 : 0.85);
        const El = Comp[it.kind];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `translate(-50%,-50%) scale(${scale}) rotate(${(random(`sr${i}`) - 0.5) * 40 + t * 30 * side}deg)`,
              opacity: interpolate(t, [0, 0.12, 0.9, 1.1], [0, 1, 1, 0], clamp),
              filter: `blur(${z > 0.85 ? (z - 0.85) * 20 : 0}px)`,
            }}
          >
            <El s={1} k={it.k} />
          </div>
        );
      })}
      <Col top style={{ paddingTop: p.vertical ? 220 : 90, gap: 28 }}>
        <Kicker text="01 — Das Problem" frame={frame} />
        <NightTitle words={p.words} frame={frame} size={p.vertical ? 96 : 92} width={W * 0.86} />
      </Col>
    </NightStage>
  );
};

/* ---------- Start-Stopp-Knopf ---------- */
const EngineButton: React.FC<{ size: number; label: string; color: string; press: number; ring: number; children?: React.ReactNode }> = ({ size, label, color, press, ring, children }) => (
  <div style={{ position: "relative", width: size, height: size, transform: `scale(${1 - press * 0.06})` }}>
    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "conic-gradient(from 200deg, #F4F7FA, #8C96A3, #E7ECF1, #6E7783, #F4F7FA)", boxShadow: "0 30px 70px rgba(0,0,0,.7)" }} />
    <div style={{ position: "absolute", inset: size * 0.05, borderRadius: "50%", background: "radial-gradient(circle at 40% 30%, #2A313D 0%, #0B0E13 70%)", boxShadow: "inset 0 6px 20px rgba(0,0,0,.8)" }} />
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
      <circle cx={50} cy={50} r={40} fill="none" stroke={color} strokeWidth={1.6} strokeDasharray={`${2 * Math.PI * 40 * ring} 999`} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
    </svg>
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: size * 0.02 }}>
      {children ?? (
        <>
          <div style={{ fontFamily: NFONT.hud, fontWeight: 700, fontSize: size * 0.07, letterSpacing: "0.3em", color: N.sub }}>ENGINE</div>
          <div style={{ fontFamily: NFONT.hud, fontWeight: 800, fontSize: size * 0.2, letterSpacing: "0.08em", color, textShadow: `0 0 ${size * 0.06}px ${color}` }}>{label}</div>
        </>
      )}
    </div>
  </div>
);

/* ---------- 2. STOPP: „Damit ist jetzt Schluss.“ ---------- */
export const Stopp: React.FC<BeatProps> = (p) => {
  const ap = useAppear();
  const last = p.words[p.words.length - 1];
  const press = interpolate(p.frame - last.f, [0, 3, 9], [0, 1, 0], clamp);
  const pulse = interpolate(p.frame - last.f, [0, 22], [0, 1], clamp);
  const s = ap(p.frame, 0, 140, 15);
  const size = p.vertical ? 520 : 420;
  return (
    <NightStage frame={p.frame} seed="stopp" glow={N.red}>
      <Col gap={p.vertical ? 70 : 40}>
        <NightTitle words={p.words.slice(0, -1)} frame={p.frame} size={p.vertical ? 74 : 64} />
        <div style={{ position: "relative", transform: `scale(${0.85 + 0.15 * s})` }}>
          <div style={{ position: "absolute", left: "50%", top: "50%", width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, borderRadius: "50%", border: `4px solid ${N.red}`, transform: `scale(${1 + pulse * 0.8})`, opacity: p.frame < last.f ? 0 : (1 - pulse) * 0.8, boxShadow: `0 0 40px ${N.red}` }} />
          <EngineButton size={size} label="STOP" color={N.red} press={press} ring={interpolate(p.frame, [0, 20], [0, 1], clamp)} />
        </div>
        <ChromeText size={p.vertical ? 190 : 170} frame={p.frame} at={last.f} glow={`${N.red}88`}>
          {clean(last.w).toUpperCase()}
        </ChromeText>
      </Col>
    </NightStage>
  );
};

/* ---------- 3. ZÜNDUNG: Start-Knopf → AutoKontor ---------- */
export const Zuendung: React.FC<BeatProps> = (p) => {
  const ap = useAppear();
  const fName = at(p.words, "autokontor", 6);
  const fPress = Math.max(2, fName - 6);
  const press = interpolate(p.frame - fPress, [0, 3, 9], [0, 1, 0], clamp);
  const logo = ap(p.frame, fPress + 3, 180, 13);
  const flare = interpolate(p.frame - fPress, [2, 8, 22], [0, 1, 0], clamp);
  const size = p.vertical ? 480 : 380;
  return (
    <NightStage frame={p.frame} seed="zuendung">
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, ${N.cyan}${Math.round(flare * 80).toString(16).padStart(2, "0")} 0%, transparent 45%)` }} />
      <Col gap={p.vertical ? 60 : 36}>
        <NightTitle words={p.words.filter((w) => n(w.w) !== "autokontor")} frame={p.frame} size={p.vertical ? 64 : 56} color={N.sub} />
        <EngineButton size={size} label="START" color={N.cyan} press={press} ring={p.frame < fPress ? interpolate(p.frame, [0, fPress], [0, 0.6], clamp) : 1}>
          {p.frame >= fPress + 3 ? (
            <div
              style={{
                width: size * 0.42,
                height: size * 0.42,
                borderRadius: size * 0.1,
                background: `linear-gradient(145deg, #4B8DFF, ${C.blue} 50%, #1B4FD1)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: NFONT.head,
                fontWeight: 800,
                fontSize: size * 0.18,
                color: "#fff",
                boxShadow: `0 0 ${size * 0.15}px ${N.cyan}aa`,
                transform: `scale(${logo}) rotate(${(1 - logo) * -40}deg)`,
              }}
            >
              {BRAND.logoText}
            </div>
          ) : undefined}
        </EngineButton>
        <ChromeText size={p.vertical ? 140 : 150} frame={p.frame} at={fName} glow={`${N.cyan}66`}>
          {BRAND.name}
        </ChromeText>
      </Col>
    </NightStage>
  );
};

/* ---------- 4. SILHOUETTEN: großes und kleines Auto aus Licht gezeichnet ---------- */
const SUV = "M20 120 L20 92 Q22 80 36 76 L90 66 L130 34 Q138 28 150 28 L270 28 Q282 28 290 36 L330 66 L366 74 Q384 78 384 94 L384 120";
const COMPACT = "M16 104 L16 84 Q18 74 30 70 L64 62 L96 34 Q102 28 112 28 L184 28 Q196 28 204 38 L236 64 L262 70 Q280 74 280 88 L280 104";
const CarLine: React.FC<{ d: string; vb: [number, number]; wheels: [number, number, number][]; w: number; p: number; color?: string }> = ({ d, vb, wheels, w, p, color = N.cyan }) => {
  const h = (w * vb[1]) / vb[0];
  const svg = (op: number) => (
    <svg viewBox={`0 0 ${vb[0]} ${vb[1]}`} width={w} height={h} style={{ overflow: "visible", opacity: op }}>
      <path d={d} pathLength={1} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1} strokeDashoffset={1 - p} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      {wheels.map(([cx, cy, r], k) => (
        <circle key={k} cx={cx} cy={cy} r={r} pathLength={1} fill="none" stroke={color} strokeWidth={4} strokeDasharray={1} strokeDashoffset={1 - Math.max(0, p * 1.4 - 0.4)} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      ))}
      <line x1={0} y1={vb[1] - 6} x2={vb[0] * p} y2={vb[1] - 6} stroke={color} strokeOpacity={0.35} strokeWidth={2} />
    </svg>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {svg(1)}
      <div style={{ transform: "scaleY(-1)", marginTop: 4, maskImage: "linear-gradient(0deg, rgba(0,0,0,.35), transparent 70%)", WebkitMaskImage: "linear-gradient(0deg, rgba(0,0,0,.35), transparent 70%)" }}>{svg(0.6)}</div>
    </div>
  );
};

export const Silhouetten: React.FC<BeatProps> = (p) => {
  const fBig = at(p.words, "große", 2);
  const fSmall = at(p.words, "kleine", fBig + 8);
  const pBig = interpolate(p.frame - fBig, [0, 22], [0, 1], { ...clamp, easing: EASE });
  const pSmall = interpolate(p.frame - fSmall, [0, 20], [0, 1], { ...clamp, easing: EASE });
  const emph = p.words.find((w) => isEmph(w.w));
  return (
    <NightStage frame={p.frame} seed="silh">
      <Col gap={p.vertical ? 60 : 30}>
        <NightTitle words={p.words} only={(w) => !isEmph(w.w)} frame={p.frame} size={p.vertical ? 70 : 60} width={p.width * 0.84} />
        <div style={{ display: "flex", alignItems: "flex-end", gap: p.vertical ? 30 : 60, marginTop: 30 }}>
          <CarLine d={SUV} vb={[400, 150]} wheels={[[95, 122, 24], [305, 122, 24]]} w={p.vertical ? 560 : 620} p={pBig} />
          <CarLine d={COMPACT} vb={[300, 132]} wheels={[[72, 106, 20], [224, 106, 20]]} w={p.vertical ? 330 : 380} p={pSmall} color={N.amber} />
        </div>
        {emph && (
          <ChromeText size={p.vertical ? 130 : 130} frame={p.frame} at={emph.f} glow={`${N.cyan}55`}>
            {clean(emph.w)}
          </ChromeText>
        )}
      </Col>
    </NightStage>
  );
};

/* ---------- 5. COCKPIT: Fahrzeuge, Kunden, Verträge, Rechnungen als Cockpit-Anzeigen ---------- */
export const Cockpit: React.FC<BeatProps> = (p) => {
  const ap = useAppear();
  const fPdf = at(p.words, "pdf", Math.round(p.dur * 0.8));
  const items = [
    { f: at(p.words, "fahrzeuge", 0), kind: "gauge", value: 38, max: 50, label: "Fahrzeuge" },
    { f: at(p.words, "kunden", 8), kind: "gauge", value: 214, max: 300, label: "Kunden" },
    { f: at(p.words, "kaufverträge", 16), kind: "doc", label: "Kaufvertrag" },
    { f: at(p.words, "rechnungen", 24), kind: "doc", label: "Rechnung" },
  ] as const;
  const pw = p.vertical ? 440 : 380;
  return (
    <NightStage frame={p.frame} seed="cockpit">
      <Col gap={p.vertical ? 60 : 34}>
        <Kicker text="02 — Alles an einem Ort" frame={p.frame} />
        <NightTitle words={p.words} frame={p.frame} size={p.vertical ? 58 : 52} width={p.width * 0.86} />
        <div style={{ display: "grid", gridTemplateColumns: p.vertical ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: p.vertical ? 34 : 30 }}>
          {items.map((it, i) => {
            const a = ap(p.frame, it.f, 170, 14);
            const g = interpolate(p.frame - it.f, [0, 26], [0, 1], { ...clamp, easing: EASE });
            const pdfOn = p.frame >= fPdf + i - 2;
            return (
              <div key={i} style={{ opacity: p.frame < it.f ? 0 : Math.min(1, a * 1.4), transform: `translateY(${(1 - a) * 80}px) scale(${0.9 + 0.1 * a})` }}>
                <Panel w={pw} h={pw * 0.95} lit={interpolate(p.frame - it.f, [0, 6, 30], [0, 1, 0.3], clamp)} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: pw * 0.05 }}>
                  {it.kind === "gauge" ? (
                    <Gauge size={pw * 0.7} value={it.value} max={it.max} p={g} label={it.label} />
                  ) : (
                    <>
                      <LineIcon name="doc" s={pw * 0.36} color={N.text} w={4} />
                      <div style={{ fontFamily: NFONT.hud, fontWeight: 700, fontSize: pw * 0.11, letterSpacing: "0.06em" }}>{it.label}</div>
                      <div
                        style={{
                          fontFamily: NFONT.hud,
                          fontWeight: 800,
                          fontSize: pw * 0.08,
                          letterSpacing: "0.2em",
                          padding: `${pw * 0.015}px ${pw * 0.05}px`,
                          borderRadius: 999,
                          border: `2px solid ${pdfOn ? N.cyan : N.line}`,
                          color: pdfOn ? N.cyan : N.sub,
                          boxShadow: pdfOn ? `0 0 18px ${N.cyan}88` : "none",
                        }}
                      >
                        PDF
                      </div>
                    </>
                  )}
                </Panel>
              </div>
            );
          })}
        </div>
      </Col>
    </NightStage>
  );
};

/* ---------- 6. SCHLÜSSEL: Klick auf den Autoschlüssel ---------- */
export const Schluessel: React.FC<BeatProps> = (p) => {
  const ap = useAppear();
  const fk = at(p.words, "klicks", Math.round(p.dur * 0.5));
  const press = interpolate(p.frame - fk, [0, 3, 8], [0, 1, 0], clamp);
  const blink = p.frame >= fk ? (Math.floor((p.frame - fk) / 5) % 2 === 0 && p.frame - fk < 20 ? 1 : 0.15) : 0;
  const key = ap(p.frame, 0, 120, 14);
  const toast = ap(p.frame, fk + 6, 200, 15);
  const kw = p.vertical ? 300 : 250;
  return (
    <NightStage frame={p.frame} seed="schluessel" glow={N.amber}>
      {[-1, 1].map((s) => (
        <div key={s} style={{ position: "absolute", top: "40%", [s < 0 ? "left" : "right"]: -120, width: 360, height: 220, borderRadius: "50%", background: N.amber, filter: "blur(70px)", opacity: blink * 0.8 }} />
      ))}
      <Col gap={p.vertical ? 80 : 40}>
        <NightTitle words={p.words} frame={p.frame} size={p.vertical ? 84 : 74} />
        <div style={{ position: "relative", transform: `translateY(${(1 - key) * 200}px) rotate(${(1 - key) * -12 + Math.sin(p.frame / 18) * 2}deg)` }}>
          <div style={{ width: kw, height: kw * 1.75, borderRadius: kw * 0.45, background: "linear-gradient(160deg,#2B323E,#0C0F14)", boxShadow: "0 40px 80px rgba(0,0,0,.7), inset 0 2px 0 rgba(255,255,255,.12), 0 0 0 3px #59616E", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: kw * 0.09 }}>
            <div style={{ width: kw * 0.06, height: kw * 0.06, borderRadius: "50%", background: blink > 0.5 ? N.amber : "#3A414C", boxShadow: blink > 0.5 ? `0 0 14px ${N.amber}` : "none", marginBottom: kw * 0.04 }} />
            {["lock", "key", "car"].map((ic, i) => (
              <div
                key={ic}
                style={{
                  width: kw * 0.5,
                  height: kw * 0.38,
                  borderRadius: kw * 0.12,
                  background: "linear-gradient(180deg,#252B35,#151920)",
                  border: "1px solid rgba(255,255,255,.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: i === 1 ? `scale(${1 - press * 0.1})` : undefined,
                  boxShadow: i === 1 && press > 0 ? `0 0 20px ${N.cyan}` : "none",
                }}
              >
                <LineIcon name={ic as "lock"} s={kw * 0.22} color={i === 1 && p.frame >= fk ? N.cyan : "#AEB7C4"} w={6} />
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", left: "70%", top: "8%", opacity: p.frame < fk + 6 ? 0 : 1, transform: `translateX(${(1 - toast) * 120}px)` }}>
            <Panel w={p.vertical ? 380 : 340} style={{ display: "flex", alignItems: "center", gap: 18, padding: "22px 26px" }}>
              <LineIcon name="check" s={44} color={N.green} w={9} />
              <span style={{ fontFamily: NFONT.hud, fontWeight: 700, fontSize: p.vertical ? 38 : 34 }}>PDF erstellt</span>
            </Panel>
          </div>
        </div>
      </Col>
    </NightStage>
  );
};

/* ---------- 7. KONTROLLLEUCHTEN: E-Rechnung, ZUGFeRD, XRechnung leuchten grün ---------- */
export const Leuchten: React.FC<BeatProps> = (p) => {
  const names = ["e-rechnung", "zugferd", "xrechnung"];
  const lights = p.words.filter((w) => names.includes(n(w.w)));
  const lead = p.words.filter((w) => w.f < (lights[0]?.f ?? 1e9));
  const d = p.vertical ? 250 : 230;
  return (
    <NightStage frame={p.frame} seed="leuchten" glow={N.green}>
      <Col gap={p.vertical ? 70 : 44}>
        <Kicker text="E-Rechnung inklusive" frame={p.frame} color={N.green} />
        <NightTitle words={lead} frame={p.frame} size={p.vertical ? 84 : 72} />
        <div style={{ display: "flex", flexDirection: p.vertical ? "column" : "row", gap: p.vertical ? 46 : 70 }}>
          {lights.map((w, i) => {
            const on = interpolate(p.frame - w.f, [0, 5], [0, 1], clamp);
            return (
              <div key={i} style={{ display: "flex", flexDirection: p.vertical ? "row" : "column", alignItems: "center", gap: 30 }}>
                <div style={{ width: d * 0.62, height: d * 0.62, borderRadius: "50%", background: on > 0 ? `radial-gradient(circle at 40% 35%, #B9FFE0 0%, ${N.green} 45%, #0E6B47 100%)` : "radial-gradient(circle at 40% 35%, #2A313B, #0E1116)", boxShadow: on > 0 ? `0 0 ${50 * on}px ${N.green}, inset 0 2px 6px rgba(255,255,255,.4)` : "inset 0 2px 6px rgba(255,255,255,.08)", border: "3px solid #2E3540", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 + (1 - on) * 0.05})` }}>
                  <LineIcon name={i === 2 ? "check" : "doc"} s={d * 0.3} color={on > 0 ? "#05351F" : "#4A525E"} w={7} />
                </div>
                <div style={{ fontFamily: NFONT.hud, fontWeight: 800, fontSize: p.vertical ? 64 : 52, letterSpacing: "0.04em", color: on > 0 ? N.text : "#3E4652", minWidth: p.vertical ? 380 : undefined }}>{clean(w.w).replace(/[.,]$/, "")}</div>
              </div>
            );
          })}
        </div>
      </Col>
    </NightStage>
  );
};

/* ---------- 8./9. RECHNER + WOLKE: Daten bleiben im Schutzfeld, Cloud prallt ab ---------- */
const Monitor: React.FC<{ w: number; frame: number }> = ({ w, frame }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    <div style={{ width: w, height: w * 0.6, borderRadius: w * 0.04, background: "#0A0D12", border: "3px solid #3A424E", boxShadow: `0 0 ${w * 0.15}px ${N.cyan}33`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${N.cyan}14 1px, transparent 1px), linear-gradient(90deg, ${N.cyan}14 1px, transparent 1px)`, backgroundSize: `${w / 14}px ${w / 14}px` }} />
      <div style={{ width: w * 0.24, height: w * 0.24, borderRadius: w * 0.04, background: `linear-gradient(145deg, ${N.cyan}, ${N.cyanDeep})`, boxShadow: `0 0 ${w * 0.1}px ${N.cyan}`, transform: `rotate(${Math.sin(frame / 20) * 6}deg)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: NFONT.hud, fontWeight: 800, color: "#02202E", fontSize: w * 0.05, textAlign: "center", lineHeight: 1 }}>
        DEINE
        <br />
        DATEN
      </div>
    </div>
    <div style={{ width: w * 0.08, height: w * 0.1, background: "#2A313B" }} />
    <div style={{ width: w * 0.36, height: w * 0.025, borderRadius: 6, background: "#2A313B" }} />
  </div>
);

const Schutzfeld: React.FC<{ size: number; frame: number; hit?: number }> = ({ size, frame, hit = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: size,
      height: size,
      marginLeft: -size / 2,
      marginTop: -size / 2,
      borderRadius: "50%",
      border: `2px solid ${N.cyan}${hit > 0 ? "ff" : "77"}`,
      background: `radial-gradient(circle, transparent 60%, ${N.cyan}${Math.round(20 + hit * 60).toString(16)} 100%)`,
      boxShadow: `0 0 ${30 + hit * 60}px ${N.cyan}66, inset 0 0 ${30 + hit * 40}px ${N.cyan}44`,
      transform: `scale(${1 + Math.sin(frame / 14) * 0.01 + hit * 0.04})`,
    }}
  />
);

export const Rechner: React.FC<BeatProps> = (p) => {
  const ap = useAppear();
  const a = ap(p.frame, 2, 140, 14);
  const field = interpolate(p.frame, [6, 20], [0, 1], { ...clamp, easing: EASE });
  const mw = p.vertical ? 560 : 480;
  return (
    <NightStage frame={p.frame} seed="rechner">
      <Col gap={p.vertical ? 90 : 40}>
        <Kicker text="03 — Deine Daten" frame={p.frame} />
        <NightTitle words={p.words} frame={p.frame} size={p.vertical ? 74 : 64} width={p.width * 0.84} />
        <div style={{ position: "relative", transform: `scale(${0.9 + 0.1 * a})`, opacity: Math.min(1, a * 1.4) }}>
          <div style={{ opacity: field }}>
            <Schutzfeld size={mw * 1.45} frame={p.frame} />
          </div>
          <Monitor w={mw} frame={p.frame} />
        </div>
      </Col>
    </NightStage>
  );
};

export const WolkeN: React.FC<BeatProps> = (p) => {
  const fc = at(p.words, "cloud", Math.round(p.dur * 0.6));
  const approach = interpolate(p.frame, [0, Math.max(2, fc)], [0, 1], { ...clamp, easing: EASE });
  const hit = interpolate(p.frame - fc, [0, 3, 14], [0, 1, 0], clamp);
  const bounce = interpolate(p.frame - fc, [0, 16], [0, 1], { ...clamp, easing: EASE });
  const mw = p.vertical ? 560 : 480;
  const cx = interpolate(approach, [0, 1], [mw * 1.2, mw * 0.78]) + bounce * mw * 0.5;
  const cy = interpolate(approach, [0, 1], [-mw * 0.9, -mw * 0.55]) - bounce * mw * 0.3;
  const cloudColor = p.frame >= fc ? N.red : N.sub;
  return (
    <NightStage frame={p.frame} seed="rechner">
      <Col gap={p.vertical ? 90 : 40}>
        <NightTitle words={p.words} frame={p.frame} size={p.vertical ? 84 : 70} />
        <div style={{ position: "relative" }}>
          <Schutzfeld size={mw * 1.45} frame={p.frame} hit={hit} />
          <Monitor w={mw} frame={p.frame} />
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(${cx - mw * 0.2}px, ${cy}px) scale(${1 - bounce * 0.4})`, opacity: 1 - interpolate(p.frame - fc, [8, 20], [0, 1], clamp) }}>
            <LineIcon name="cloud" s={mw * 0.42} color={cloudColor} w={4} />
            <div style={{ position: "absolute", left: "50%", top: "52%", transform: "translate(-50%,-50%)", fontFamily: NFONT.hud, fontWeight: 800, fontSize: mw * 0.14, color: N.red, opacity: p.frame < fc ? 0 : 1, textShadow: `0 0 20px ${N.red}` }}>✕</div>
          </div>
          <div style={{ position: "absolute", right: -mw * 0.05, bottom: mw * 0.12, opacity: p.frame < fc ? 0 : 1, transform: `scale(${0.6 + 0.4 * interpolate(p.frame - fc, [0, 8], [0, 1], clamp)})` }}>
            <Panel w={mw * 0.42} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px" }}>
              <LineIcon name="lock" s={mw * 0.08} color={N.green} w={8} />
              <span style={{ fontFamily: NFONT.hud, fontWeight: 800, fontSize: mw * 0.06, letterSpacing: "0.12em" }}>LOKAL</span>
            </Panel>
          </div>
        </div>
      </Col>
    </NightStage>
  );
};

/* ---------- 10. TACHO: Sicherung jeden Tag ---------- */
export const Tacho: React.FC<BeatProps> = (p) => {
  const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const fill = interpolate(p.frame, [4, Math.max(8, p.dur - 8)], [0, 1], { ...clamp, easing: EASE });
  const size = p.vertical ? 520 : 400;
  return (
    <NightStage frame={p.frame} seed="tacho" glow={N.green}>
      <Col gap={p.vertical ? 70 : 34}>
        <NightTitle words={p.words} frame={p.frame} size={p.vertical ? 72 : 62} width={p.width * 0.84} />
        <Gauge size={size} value={100} max={100} p={fill} label="% gesichert" color={N.green} />
        <div style={{ display: "flex", gap: p.vertical ? 14 : 18 }}>
          {days.map((d, i) => {
            const on = fill * 7 > i + 0.5;
            return (
              <div key={d} style={{ width: p.vertical ? 116 : 110, padding: "16px 0", borderRadius: 18, textAlign: "center", fontFamily: NFONT.hud, fontWeight: 800, fontSize: p.vertical ? 40 : 36, color: on ? "#03311D" : N.sub, background: on ? N.green : N.panel, border: `1px solid ${on ? N.green : N.line}`, boxShadow: on ? `0 0 24px ${N.green}88` : "none" }}>
                {d}
              </div>
            );
          })}
        </div>
      </Col>
    </NightStage>
  );
};

/* ---------- 11. KENNZEICHEN: Windows, Mac, Linux als deutsche Nummernschilder ---------- */
const Plate: React.FC<{ text: string; w: number }> = ({ text, w }) => {
  const h = w * 0.22;
  return (
    <div style={{ width: w, height: h, borderRadius: h * 0.12, background: "linear-gradient(180deg,#FFFFFF,#E9EDF2)", border: `${h * 0.05}px solid #111`, display: "flex", alignItems: "stretch", overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,.6)" }}>
      <div style={{ width: h * 0.42, background: "#0F3FB0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: `${h * 0.1}px 0` }}>
        <svg viewBox="0 0 20 20" width={h * 0.3} height={h * 0.3}>
          {Array.from({ length: 12 }).map((_, k) => (
            <circle key={k} cx={10 + 7 * Math.cos((k / 12) * Math.PI * 2)} cy={10 + 7 * Math.sin((k / 12) * Math.PI * 2)} r={1.1} fill="#FFD400" />
          ))}
        </svg>
        <span style={{ color: "#fff", fontFamily: NFONT.hud, fontWeight: 800, fontSize: h * 0.32 }}>D</span>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: NFONT.hud, fontWeight: 800, fontSize: h * 0.68, letterSpacing: "0.06em", color: "#111" }}>{text}</div>
    </div>
  );
};

export const Kennzeichen: React.FC<BeatProps> = (p) => {
  const ap = useAppear();
  const names = ["windows", "mac", "linux", "büro", "laptop"];
  const plates = p.words.filter((w) => names.includes(n(w.w).replace(/[.,]/g, "")));
  const lead = p.words.filter((w) => w.f < (plates[0]?.f ?? 1e9));
  const pw = p.vertical ? 760 : 560;
  return (
    <NightStage frame={p.frame} seed="kennz">
      <Beams frame={p.frame} on={0.45} />
      <Col gap={p.vertical ? 60 : 40}>
        <Kicker text="Läuft überall" frame={p.frame} />
        <NightTitle words={lead} frame={p.frame} size={p.vertical ? 84 : 70} />
        <div style={{ display: "flex", flexDirection: p.vertical ? "column" : "row", gap: p.vertical ? 44 : 40 }}>
          {plates.map((w, i) => {
            const a = ap(p.frame, w.f, 200, 14);
            return (
              <div key={i} style={{ opacity: p.frame < w.f ? 0 : 1, transform: `translateX(${(1 - a) * (p.vertical ? 600 : 0)}px) translateY(${(1 - a) * (p.vertical ? 0 : 300)}px) rotate(${(1 - a) * 8}deg)` }}>
                <Plate text={clean(w.w).replace(/[.,]$/, "").toUpperCase()} w={pw} />
              </div>
            );
          })}
        </div>
      </Col>
    </NightStage>
  );
};

/* ---------- 12. PREISSCHILD an der Windschutzscheibe ---------- */
export const Preisschild: React.FC<BeatProps> = (p) => {
  const ap = useAppear();
  const fNum = p.words.find((w) => /\d/.test(w.w))?.f ?? 4;
  const drop = ap(p.frame, Math.max(0, fNum - 6), 120, 7);
  const swing = Math.sin((p.frame - fNum) / 7) * 6 * Math.exp(-Math.max(0, p.frame - fNum) / 30);
  const sw = p.vertical ? 600 : 460;
  const after = p.words.filter((w) => w.f > fNum && !/^€/.test(clean(w.w)));
  return (
    <NightStage frame={p.frame} seed="preis" glow={N.amber}>
      {/* Windschutzscheibe */}
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: p.width * 0.95, height: p.height * (p.vertical ? 0.55 : 0.75), clipPath: "polygon(12% 0, 88% 0, 100% 100%, 0 100%)", background: "linear-gradient(170deg, rgba(120,150,190,.18), rgba(10,14,20,.6) 55%, rgba(80,110,150,.15))", boxShadow: "inset 0 0 120px rgba(0,0,0,.8)" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,.08) 34%, transparent 38%, transparent 60%, rgba(255,255,255,.05) 63%, transparent 66%)" }} />
        </div>
      </AbsoluteFill>
      <Col>
        <Kicker text="04 — Der Preis" frame={p.frame} color={N.amber} />
        <div style={{ height: 30 }} />
        <div style={{ transformOrigin: "50% -200px", transform: `translateY(${(1 - drop) * -900}px) rotate(${swing}deg)` }}>
          <div style={{ width: 2, height: 120, margin: "0 auto", background: "linear-gradient(180deg, transparent, #9AA4B2)" }} />
          <div style={{ width: sw, borderRadius: 26, background: "#FBFBF8", boxShadow: "0 50px 90px rgba(0,0,0,.7)", overflow: "hidden", textAlign: "center", fontFamily: NFONT.head, color: "#111" }}>
            <div style={{ background: N.red, color: "#fff", fontFamily: NFONT.hud, fontWeight: 800, fontSize: sw * 0.07, letterSpacing: "0.3em", padding: `${sw * 0.025}px 0` }}>ANGEBOT</div>
            <div style={{ padding: `${sw * 0.05}px 0 ${sw * 0.06}px` }}>
              <div style={{ fontFamily: NFONT.hud, fontWeight: 700, fontSize: sw * 0.08, color: "#555" }}>{BRAND.pricePrefix}</div>
              <div style={{ fontWeight: 800, fontSize: sw * 0.3, letterSpacing: "-0.05em", lineHeight: 1 }}>{BRAND.price}</div>
              <div style={{ fontFamily: NFONT.hud, fontWeight: 700, fontSize: sw * 0.08, letterSpacing: "0.06em", marginTop: sw * 0.02 }}>
                {after.map((w) => clean(w.w).replace(/[.,]$/, "")).join(" ").toUpperCase() || "PRO MONAT"}
              </div>
              <div style={{ fontFamily: NFONT.hud, fontWeight: 500, fontSize: sw * 0.05, color: "#666", marginTop: sw * 0.02 }}>{BRAND.priceNote}</div>
            </div>
          </div>
        </div>
      </Col>
    </NightStage>
  );
};

/* ---------- 13. KÜNDBAR: Abo-Einstellungen wie im Bordmenü ---------- */
export const KuendbarN: React.FC<BeatProps> = (p) => {
  const ap = useAppear();
  const fk = at(p.words, "kündbar", Math.round(p.dur * 0.5));
  const a = ap(p.frame, 0, 150, 15);
  const tg = interpolate(p.frame - fk, [0, 6], [0, 1], { ...clamp, easing: EASE });
  const w = p.vertical ? 780 : 640;
  return (
    <NightStage frame={p.frame} seed="kuend">
      <Col gap={p.vertical ? 80 : 40}>
        <NightTitle words={p.words} frame={p.frame} size={p.vertical ? 90 : 76} />
        <div style={{ transform: `translateY(${(1 - a) * 120}px)`, opacity: Math.min(1, a * 1.4) }}>
          <Panel w={w} style={{ padding: `${w * 0.06}px ${w * 0.07}px` }}>
            <div style={{ fontFamily: NFONT.hud, fontWeight: 700, fontSize: w * 0.04, letterSpacing: "0.3em", color: N.cyan, marginBottom: w * 0.04 }}>EINSTELLUNGEN · ABO</div>
            {[
              ["Laufzeit", "monatlich", true],
              ["Kündigung", "jederzeit", false],
            ].map(([k, v, fixed], i) => (
              <div key={String(k)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${w * 0.03}px 0`, borderTop: `1px solid ${N.line}`, fontSize: w * 0.06 }}>
                <span style={{ color: N.sub, fontWeight: 500 }}>{k}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 18, fontWeight: 800 }}>
                  {v}
                  {fixed ? (
                    <LineIcon name="check" s={w * 0.06} color={N.green} w={10} />
                  ) : (
                    <div style={{ width: w * 0.12, height: w * 0.065, borderRadius: 999, background: tg > 0.5 ? N.cyan : "#2B323D", boxShadow: tg > 0.5 ? `0 0 20px ${N.cyan}` : "none", position: "relative" }}>
                      <div style={{ position: "absolute", top: w * 0.008, left: w * 0.008 + tg * w * 0.055, width: w * 0.049, height: w * 0.049, borderRadius: "50%", background: "#fff" }} />
                    </div>
                  )}
                </span>
              </div>
            ))}
            <div style={{ fontFamily: NFONT.hud, fontSize: w * 0.04, color: N.sub, marginTop: w * 0.02 }}>
              {BRAND.pricePrefix} {BRAND.price} {BRAND.priceUnit} · {BRAND.priceNote}
            </div>
          </Panel>
        </div>
      </Col>
    </NightStage>
  );
};

/* ---------- 14. FINALE: Logo im Scheinwerferlicht, Button, Preis ---------- */
export const Finale: React.FC<BeatProps> = (p) => {
  const ap = useAppear();
  const fCta = p.words.find((w) => /\d/.test(w.w))?.f ?? at(p.words, "jetzt", 0);
  const logo = ap(p.frame, 0, 150, 13);
  const cta = ap(p.frame, fCta, 180, 13);
  const shine = interpolate(p.frame - fCta, [10, 36], [-40, 140], clamp);
  const fade = (f: number) => interpolate(p.frame - f, [0, 10], [0, 1], { ...clamp, easing: EASE });
  const [s1, s2] = BRAND.slogan.split(". ");
  const u = p.vertical ? 1 : 0.82;
  return (
    <NightStage frame={p.frame} seed="finale">
      <Beams frame={p.frame} on={interpolate(p.frame, [0, 20], [0, 0.7], clamp)} />
      <Col>
        <div
          style={{
            width: 210 * u,
            height: 210 * u,
            borderRadius: 50 * u,
            background: `linear-gradient(145deg, #4B8DFF, ${C.blue} 50%, #1B4FD1)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: NFONT.head,
            fontWeight: 800,
            fontSize: 92 * u,
            color: "#fff",
            boxShadow: `0 0 ${90 * logo}px ${N.cyan}88, inset 0 2px 0 rgba(255,255,255,.35)`,
            transform: `scale(${logo})`,
          }}
        >
          {BRAND.logoText}
        </div>
        <div style={{ height: 40 * u }} />
        <ChromeText size={150 * u} frame={p.frame} at={3} glow={`${N.cyan}55`}>
          {BRAND.name}
        </ChromeText>
        <div style={{ marginTop: 22 * u, fontFamily: NFONT.head, fontWeight: 400, fontSize: 52 * u, color: N.sub, opacity: fade(8) }}>
          {s1}. <span style={{ color: N.cyan, fontWeight: 600 }}>{s2}</span>
        </div>
        <div
          style={{
            marginTop: 80 * u,
            padding: `${34 * u}px ${60 * u}px`,
            borderRadius: 999,
            background: `linear-gradient(180deg, #7BE2FF, ${N.cyan} 45%, ${N.cyanDeep})`,
            color: "#02202E",
            fontFamily: NFONT.head,
            fontWeight: 800,
            fontSize: 46 * u,
            position: "relative",
            overflow: "hidden",
            boxShadow: `0 0 ${60 * cta}px ${N.cyan}aa, inset 0 2px 0 rgba(255,255,255,.5)`,
            opacity: p.frame < fCta ? 0 : 1,
            transform: `scale(${interpolate(cta, [0, 1], [0.7, 1])})`,
          }}
        >
          {BRAND.cta}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(110deg, transparent ${shine - 12}%, rgba(255,255,255,.7) ${shine}%, transparent ${shine + 12}%)` }} />
        </div>
        <div style={{ marginTop: 38 * u, fontFamily: NFONT.hud, fontWeight: 700, fontSize: 46 * u, letterSpacing: "0.04em", color: N.text, opacity: fade(fCta + 6) }}>
          {BRAND.pricePrefix} {BRAND.price} {BRAND.priceUnit}
          <span style={{ marginLeft: 14 * u, fontWeight: 500, fontSize: 32 * u, color: N.sub }}>{BRAND.priceNote}</span>
        </div>
        <div style={{ marginTop: 16 * u, fontFamily: NFONT.hud, fontWeight: 500, fontSize: 32 * u, letterSpacing: "0.24em", color: N.sub, opacity: fade(fCta + 10) }}>{BRAND.platforms.toUpperCase()}</div>
      </Col>
    </NightStage>
  );
};

export const NACHT_EFFECTS: Record<string, React.FC<any>> = {
  strasse: Strasse,
  stopp: Stopp,
  zuendung: Zuendung,
  silhouetten: Silhouetten,
  cockpit: Cockpit,
  schluessel: Schluessel,
  leuchten: Leuchten,
  rechner: Rechner,
  wolke: WolkeN,
  tacho: Tacho,
  kennzeichen: Kennzeichen,
  preisschild: Preisschild,
  kuendbar: KuendbarN,
  finale: Finale,
};
