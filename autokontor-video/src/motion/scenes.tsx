// Motion-Szenen (AutoKontor im Stil der Vorlage): eine Komponente pro Effekt-Name in skript-motion.txt.
// Koordinaten in einer 1080 × 1080-Bühne (Room), die im Hoch- und Querformat mittig sitzt.
import React from "react";
import { AbsoluteFill, interpolate, random } from "remotion";
import { BeatProps, EASE, clamp } from "../lib";
import { BRAND, FONT, M } from "../theme";
import { at } from "../premium/kit";
import { Glyph, Logo, Room, Tile, appear, fly, whipOut } from "./kit";

const H: React.CSSProperties = { fontFamily: FONT.ui, letterSpacing: "-0.035em", lineHeight: 1 };
const abs = (x: number, y: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ position: "absolute", left: x, top: y, ...extra });

/** Wort, das beim Sprechen in 3D aufklappt. */
const Word: React.FC<{ text: string; at: number; frame: number; size: number; color?: string; grad?: boolean; weight?: number }> = ({ text, at: a, frame, size, color = M.ink, grad, weight = 800 }) => {
  const t = appear(frame, a, 12);
  return (
    <span
      style={{
        ...H,
        display: "inline-block",
        fontSize: size,
        fontWeight: weight,
        color: grad ? "transparent" : color,
        backgroundImage: grad ? `linear-gradient(100deg, ${M.accent}, ${M.accent2})` : undefined,
        WebkitBackgroundClip: grad ? "text" : undefined,
        backgroundClip: grad ? "text" : undefined,
        opacity: frame < a ? 0 : t,
        transform: `translateY(${(1 - t) * -70}px) rotateX(${(1 - t) * 70}deg)`,
        filter: t < 0.98 ? `blur(${(1 - t) * 18}px)` : undefined,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
};

/* ---------- 1. ICONS: Fahrzeuge · Kaufverträge · E-Rechnung fliegen versetzt herein ---------- */
const ICONS = [
  { label: "Fahrzeuge", key: "fahrzeuge", glyph: "car" as const, c1: "#FF9A5C", c2: "#E5431A", glow: "rgba(229,67,26,.5)" },
  { label: "Kaufverträge", key: "kaufverträge", glyph: "doc" as const, c1: "#6CB0FF", c2: "#1D4ED8", glow: "rgba(37,99,235,.5)" },
  { label: "E-Rechnung", key: "e-rechnung", glyph: "einvoice" as const, c1: "#4ADE9B", c2: "#047857", glow: "rgba(5,150,105,.5)" },
];
export const Icons: React.FC<BeatProps> = (p) => {
  const { frame, width, height, dur } = p;
  return (
    <Room width={width} height={height}>
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateY(${18 + frame * 0.05}deg)`, ...whipOut(frame, dur) }}>
        {ICONS.map((ic, k) => {
          const f = at(p.words, ic.key, k * 8);
          return (
            <div key={ic.key} style={{ ...abs(150 + k * 30, 170 + k * 255), display: "flex", alignItems: "center", gap: 52, ...fly(frame, f, { x: 520, z: -900, ry: -60, ry2: 0, rx: 14, rx2: 0, d: 14, drift: 0 }) }}>
              <Tile size={196} c1={ic.c1} c2={ic.c2} glow={ic.glow}>
                <Glyph name={ic.glyph} />
              </Tile>
              <div style={{ ...H, fontSize: 100, fontWeight: 700, color: "#2B2C33" }}>{ic.label}</div>
            </div>
          );
        })}
      </div>
    </Room>
  );
};

/* ---------- 2. BIG ICON: „Alles in einer Software.“ ---------- */
export const Bigicon: React.FC<BeatProps> = (p) => {
  const { frame, width, height, words } = p;
  const t = interpolate(frame, [0, 18], [0, 1], { ...clamp, easing: EASE });
  const halo = appear(frame, 2, 22);
  return (
    <Room width={width} height={height}>
      <div style={{ ...abs(540 - 360, 600 - 360), width: 720, height: 720, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,.45) 0%, rgba(37,99,235,.24) 38%, rgba(255,255,255,0) 70%)", opacity: halo, transform: `scale(${0.5 + 0.6 * halo})` }} />
      <div style={{ ...abs(0, 150), width: 1080, display: "flex", justifyContent: "center", gap: 26, perspective: 800 }}>
        {words.map((w, i) => (
          <Word key={i} text={w.w.replace(/[.,]/g, "") + (i === words.length - 1 ? "." : "")} at={w.f} frame={frame} size={92} grad={i === words.length - 1} />
        ))}
      </div>
      <div
        style={{
          ...abs(540 - 190, 420),
          opacity: Math.min(1, t * 2),
          transform: `translateZ(${(1 - t) * -1300}px) scale(${0.2 + 0.8 * t + Math.max(0, frame - 18) * 0.0015}) rotateX(${(1 - t) * 42 + 6 * t}deg) rotateY(${-8 + frame * 0.25}deg)`,
          filter: t < 0.98 ? `blur(${(1 - t) * 36}px)` : undefined,
        }}
      >
        <Tile size={380} c1="#8B95FF" c2="#6D28D9" glow="rgba(99,102,241,.75)">
          <div style={{ ...H, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 150, letterSpacing: "-0.05em" }}>AK</div>
        </Tile>
      </div>
    </Room>
  );
};

/* ---------- 3. INFO-KARTE: dunkle, gekippte Karte mit Logo, Stichpunkten, Button ---------- */
export const Infokarte: React.FC<BeatProps> = (p) => {
  const { frame, width, height, words } = p;
  const fg = at(words, "große", 24);
  const fa = at(words, "autohändler", 40);
  const bullets = ["Kaufverträge & Rechnungen als PDF", "E-Rechnung: ZUGFeRD & XRechnung", "Daten bleiben auf deinem PC"];
  const btn = appear(frame, fa, 12);
  const pulse = frame > fa + 12 ? 1 + Math.sin((frame - fa) / 5) * 0.045 : 1;
  const card = fly(frame, 0, { x: -700, z: -800, ry: 52, ry2: -16, rx: 20, rx2: 8, d: 18, drift: 0.12 });
  return (
    <Room width={width} height={height} persp={1500}>
      <div style={{ ...abs(130, 190), width: 820, ...card }}>
        <div
          style={{
            borderRadius: 58,
            padding: "60px 64px 56px",
            background: "linear-gradient(155deg, #2D2F37 0%, #1C1D23 60%, #141519 100%)",
            border: "1px solid rgba(255,255,255,.09)",
            boxShadow: "0 70px 130px -30px rgba(20,20,40,.55), 0 20px 44px rgba(20,20,40,.25), inset 0 1px 0 rgba(255,255,255,.12)",
            display: "flex",
            flexDirection: "column",
            gap: 38,
            color: "#fff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
            <Logo size={136} />
            <div>
              <div style={{ ...H, fontSize: 72, fontWeight: 800 }}>{BRAND.name}</div>
              <div style={{ ...H, fontSize: 32, fontWeight: 500, color: "#B9BAC6", letterSpacing: "-0.01em", marginTop: 12, opacity: appear(frame, fg, 10) }}>Für große & kleine Autohändler</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {bullets.map((b, i) => {
              const bt = appear(frame, 12 + i * 6, 10);
              return (
                <div key={b} style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 36, fontWeight: 500, color: "#DCDDE3", letterSpacing: "-0.01em", opacity: bt, transform: `translateX(${(1 - bt) * -50}px)`, filter: bt < 0.98 ? `blur(${(1 - bt) * 12}px)` : undefined }}>
                  <span style={{ width: 16, height: 16, borderRadius: "50%", background: M.accent, boxShadow: "0 0 16px rgba(124,58,237,.9)", flex: "none" }} />
                  {b}
                </div>
              );
            })}
          </div>
          <div style={{ alignSelf: "flex-end", padding: "24px 42px", borderRadius: 999, background: "linear-gradient(180deg, #9466FA, #7C3AED)", fontSize: 36, fontWeight: 700, boxShadow: "0 18px 40px -8px rgba(124,58,237,.75), inset 0 1px 1px rgba(255,255,255,.4)", opacity: btn, transform: `scale(${(0.5 + 0.5 * btn) * pulse})` }}>
            Jetzt testen!
          </div>
        </div>
      </div>
    </Room>
  );
};

/* ---------- 4. SUCHFELD: „Kaufvertrag erstellen“ wird getippt → PDF ---------- */
export const Suchfeld: React.FC<BeatProps> = (p) => {
  const { frame, width, height, words, dur } = p;
  const fm = at(words, "mit", 16);
  const fk = at(words, "klicks", 30);
  const fp = at(words, "pdf", 40);
  const text = "Kaufvertrag erstellen";
  const n = Math.round(interpolate(frame, [6, Math.max(12, fm)], [0, text.length], clamp));
  const press = interpolate(frame - fk, [0, 3, 8], [0, 1, 0], clamp);
  const res = fly(frame, fk + 2, { x: 0, y: 160, z: -500, ry: 0, ry2: 0, rx: 50, rx2: 6, d: 12, blur: 24, sx: 1, drift: 0 });
  const pdf = appear(frame, fp, 8);
  return (
    <Room width={width} height={height}>
      <div style={{ position: "absolute", inset: 0, ...whipOut(frame, dur, 1) }}>
        <div style={{ ...abs(100, 300), ...fly(frame, 0, { x: 600, z: -700, ry: -55, ry2: 14, rx: 16, rx2: 6, d: 14, drift: -0.08 }) }}>
          <div style={{ width: 880, height: 156, borderRadius: 80, display: "flex", alignItems: "center", gap: 30, padding: "0 54px", boxSizing: "border-box", background: "rgba(255,255,255,.86)", border: "1px solid #fff", boxShadow: "0 50px 90px -24px rgba(40,40,80,.32), 0 12px 26px rgba(40,40,80,.1)", transform: `scale(${1 - press * 0.03})` }}>
            <div style={{ width: 64, height: 64, flex: "none" }}>
              <Glyph name="search" color={M.accent} w={6} />
            </div>
            <span style={{ ...H, fontSize: 60, fontWeight: 600, whiteSpace: "nowrap" }}>{text.slice(0, n)}</span>
            <span style={{ width: 5, height: 72, borderRadius: 3, background: M.accent, marginLeft: -18, opacity: Math.floor(frame / 15) % 2 ? 0.15 : 1 }} />
          </div>
        </div>
        {frame >= fk && (
          <div style={{ ...abs(170, 540), ...res }}>
            <div style={{ width: 760, borderRadius: 40, padding: "34px 40px", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 28, background: "#FFFFFF", boxShadow: "0 40px 80px -24px rgba(40,40,80,.3), 0 8px 18px rgba(40,40,80,.08)" }}>
              <Tile size={110} c1="#6CB0FF" c2="#1D4ED8" glow="rgba(37,99,235,.45)">
                <Glyph name="doc" />
              </Tile>
              <div style={{ flex: 1 }}>
                <div style={{ ...H, fontSize: 42, fontWeight: 700 }}>Kaufvertrag</div>
                <div style={{ ...H, fontSize: 28, fontWeight: 500, color: M.grey, marginTop: 10, letterSpacing: "-0.01em" }}>mit wenigen Klicks erstellt</div>
              </div>
              <div style={{ ...H, fontSize: 36, fontWeight: 800, color: "#fff", background: M.red, padding: "12px 22px", borderRadius: 14, letterSpacing: "0.02em", transform: `scale(${0.4 + 0.6 * pdf})`, opacity: pdf, boxShadow: "0 12px 26px -6px rgba(220,38,38,.6)" }}>PDF</div>
            </div>
          </div>
        )}
      </div>
    </Room>
  );
};

/** Bildkarte (Platzhalter-Fläche mit Farbverlauf und Motiv). */
const Bild: React.FC<{ kind: 0 | 1 | 2 }> = ({ kind }) => {
  const bg = [
    "linear-gradient(135deg,#1E3A8A 0%,#2563EB 50%,#67E8F9 100%)",
    "linear-gradient(135deg,#3B0F7A 0%,#7C3AED 50%,#C4B5FD 100%)",
    "linear-gradient(135deg,#064E3B 0%,#059669 50%,#6EE7B7 100%)",
  ][kind];
  return (
    <div style={{ width: 640, height: 430, borderRadius: 56, position: "relative", overflow: "hidden", background: bg, boxShadow: "0 50px 100px -26px rgba(20,20,50,.45), inset 0 1px 0 rgba(255,255,255,.3)" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,.25), rgba(255,255,255,0) 42%)" }} />
      {kind === 0 && (
        <svg viewBox="0 0 200 80" width={520} style={{ position: "absolute", left: 60, bottom: 56, filter: "drop-shadow(0 22px 20px rgba(0,0,0,.35))" }}>
          <path d="M10 58 L14 44 Q16 38 24 37 L58 33 L80 18 Q85 14 94 14 H130 Q140 14 146 20 L162 34 L182 38 Q192 40 192 50 V58 Z" fill="#F4F6FA" />
          <path d="M86 20 H128 L142 33 H70 Z" fill="#1E293B" opacity=".75" />
          <circle cx="50" cy="60" r="13" fill="#0F172A" />
          <circle cx="50" cy="60" r="6" fill="#CBD5E1" />
          <circle cx="156" cy="60" r="13" fill="#0F172A" />
          <circle cx="156" cy="60" r="6" fill="#CBD5E1" />
        </svg>
      )}
      {kind === 1 && (
        <div style={{ position: "absolute", left: 60, right: 60, top: 70, display: "flex", flexDirection: "column", gap: 22 }}>
          {["MM", "JS", "AK"].map((ini, i) => (
            <div key={ini} style={{ display: "flex", alignItems: "center", gap: 22, background: "rgba(255,255,255,.9)", borderRadius: 26, padding: "16px 22px", boxShadow: "0 12px 26px rgba(40,10,90,.25)" }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: ["#F59E0B", "#10B981", M.accent][i], color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 24 }}>{ini}</div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ height: 14, width: `${70 - i * 12}%`, borderRadius: 7, background: "#2B2C33" }} />
                <div style={{ height: 10, width: `${50 - i * 6}%`, borderRadius: 5, background: "#B5B7C2" }} />
              </div>
            </div>
          ))}
        </div>
      )}
      {kind === 2 && (
        <div style={{ position: "absolute", left: 200, top: 50, width: 240, height: 320, background: "#fff", borderRadius: 18, boxShadow: "0 24px 44px rgba(0,40,20,.35)", padding: 28, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 14 }}>
          {[80, 60, 70, 45, 65].map((w, i) => (
            <div key={i} style={{ height: 12, width: `${w}%`, borderRadius: 6, background: i ? "#C9CBD3" : "#2B2C33" }} />
          ))}
          <div style={{ marginTop: "auto", alignSelf: "flex-end", background: M.red, color: "#fff", fontWeight: 800, fontSize: 26, padding: "8px 14px", borderRadius: 10 }}>PDF</div>
        </div>
      )}
    </div>
  );
};

/* ---------- 5. BILDKARTEN: Fahrzeuge, Kunden, Rechnungen wischen durch ---------- */
export const Bildkarten: React.FC<BeatProps> = (p) => {
  const { frame, width, height, words, dur } = p;
  const items = [
    { word: "Fahrzeuge", f: at(words, "fahrzeuge", 0) },
    { word: "Kunden", f: at(words, "kunden", 14) },
    { word: "Rechnungen", f: at(words, "rechnungen", 28) },
  ];
  return (
    <Room width={width} height={height}>
      {items.map((it, k) => {
        const next = k < 2 ? items[k + 1].f : dur;
        if (frame < it.f - 1 || frame > next) return null;
        const out = k < 2 ? interpolate(frame, [next - 5, next], [0, 1], { ...clamp, easing: (x) => x * x }) : 0;
        const s = fly(frame, it.f, { x: 760, z: -500, ry: -48, ry2: -10, rx: 10, rx2: 4, d: 10, blur: 40, drift: 0.1 });
        return (
          <div key={it.word} style={{ position: "absolute", inset: 0, transform: `translateX(${-out * 1000}px)`, filter: out > 0.02 ? `blur(${out * 40}px)` : undefined }}>
            <div style={{ ...abs(220, 170), ...s }}>
              <Bild kind={k as 0 | 1 | 2} />
            </div>
            <div style={{ ...abs(0, 700), width: 1080, display: "flex", justifyContent: "center", perspective: 800 }}>
              <Word text={it.word} at={it.f + 3} frame={frame} size={140} weight={900} />
            </div>
          </div>
        );
      })}
    </Room>
  );
};

/* ---------- 6. ZÄHLER: ab 19 € im Monat (zzgl. MwSt.) ---------- */
export const Zaehler: React.FC<BeatProps> = (p) => {
  const { frame, width, height, words } = p;
  const f19 = at(words, "19", 6);
  const fm = at(words, "monat", 18);
  const fi = at(words, "im", fm - 4);
  const pc = interpolate(frame, [Math.max(0, f19 - 6), f19 + 10], [0, 1], clamp);
  const val = Math.round(19 * (1 - Math.pow(1 - pc, 3)));
  const box = fly(frame, 0, { x: 0, y: 200, z: -600, ry: 0, ry2: -6, rx: 50, rx2: 6, d: 14, sx: 1, drift: 0.08 });
  return (
    <Room width={width} height={height}>
      <div style={{ ...abs(0, 190), width: 1080, display: "flex", flexDirection: "column", alignItems: "center", ...box }}>
        <div style={{ ...H, fontSize: 70, fontWeight: 700, color: M.grey, opacity: appear(frame, 0, 8) }}>ab</div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ ...H, fontSize: 360, fontWeight: 900, letterSpacing: "-0.06em", fontVariantNumeric: "tabular-nums", backgroundImage: `linear-gradient(100deg, ${M.accent}, ${M.accent2})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", lineHeight: 0.95 }}>{val}</span>
          <span style={{ ...H, fontSize: 160, fontWeight: 900, color: M.accent, marginTop: 40 }}>€</span>
        </div>
        <div style={{ display: "flex", gap: 22, perspective: 800 }}>
          <Word text="im" at={fi} frame={frame} size={84} />
          <Word text="Monat" at={fm} frame={frame} size={84} />
        </div>
        <div style={{ ...H, fontSize: 40, fontWeight: 600, color: M.grey, marginTop: 26, letterSpacing: "0", opacity: appear(frame, fi, 10) }}>{BRAND.priceNote} · monatlich kündbar</div>
      </div>
    </Room>
  );
};

/* ---------- 7. CHART: grüne Karte – täglich gesichert, Balken wachsen ---------- */
export const Chart: React.FC<BeatProps> = (p) => {
  const { frame, width, height, words, dur } = p;
  const fr = at(words, "rechner", 24);
  const fj = at(words, "jeden", 40);
  const fs = at(words, "gesichert", 52);
  const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const hts = [52, 64, 58, 72, 80, 88, 100];
  const card = fly(frame, 0, { x: 720, z: -800, ry: -50, ry2: 16, rx: 18, rx2: 6, d: 16, drift: -0.12 });
  const neon = appear(frame, fj, 10);
  const black = interpolate(frame, [dur - 9, dur], [0, 1], { ...clamp, easing: (x) => x * x });
  return (
    <Room width={width} height={height}>
      <div style={{ ...abs(140, 200), width: 800, ...card }}>
        <div style={{ borderRadius: 60, padding: "56px 64px", background: "linear-gradient(160deg, #0B4A2C 0%, #06331E 55%, #031D11 100%)", border: "1px solid rgba(57,255,136,.22)", boxShadow: "0 60px 120px -30px rgba(6,60,30,.6), 0 0 90px -20px rgba(57,255,136,.35), inset 0 1px 0 rgba(255,255,255,.12)", display: "flex", flexDirection: "column", gap: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
            <Tile size={96} c1="#4ADE9B" c2="#047857" glow="rgba(57,255,136,.45)">
              <Glyph name="lock" />
            </Tile>
            <div>
              <div style={{ ...H, fontSize: 40, fontWeight: 600, color: "#CFF7DF", opacity: appear(frame, 4, 10) }}>Deine Daten auf deinem Rechner</div>
              <div style={{ ...H, fontSize: 30, fontWeight: 500, color: "#7FBF9B", marginTop: 10, letterSpacing: "0", opacity: appear(frame, fr, 10) }}>lokal · ohne Cloud</div>
            </div>
          </div>
          <div style={{ ...H, fontSize: 104, fontWeight: 900, color: M.neon, textShadow: `0 0 ${24 + 20 * Math.max(0, Math.sin((frame - fs) / 6))}px rgba(57,255,136,.6), 0 0 60px rgba(57,255,136,.3)`, opacity: neon, transform: `translateY(${(1 - neon) * 30}px)` }}>Täglich gesichert</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 22, height: 230, borderBottom: "3px solid rgba(57,255,136,.35)" }}>
            {days.map((d, i) => {
              const g = interpolate(frame - fj - i * 2.5, [0, 14], [0, 1], { ...clamp, easing: EASE });
              const ok = appear(frame, fs + i * 1.5, 6);
              return (
                <div key={d} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 30, height: 30, opacity: ok, transform: `scale(${0.5 + 0.5 * ok})` }}>
                    <Glyph name="check" color={M.neon} w={8} />
                  </div>
                  <div style={{ width: "100%", height: `${hts[i] * 0.72 * g}%`, borderRadius: "16px 16px 5px 5px", background: "linear-gradient(180deg, #7DFFB3 0%, #39FF88 40%, #12B85C 100%)", boxShadow: "0 0 24px rgba(57,255,136,.45)" }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 22, marginTop: -26 }}>
            {days.map((d) => (
              <div key={d} style={{ flex: 1, textAlign: "center", fontSize: 26, fontWeight: 600, color: "#7FBF9B" }}>{d}</div>
            ))}
          </div>
        </div>
      </div>
      {/* Übergang ins Schwarze: von oben einschiebender Verlauf */}
      {black > 0 && <div style={{ position: "absolute", left: -600, right: -600, top: -1400, height: 1400 + 2400 * black, background: "linear-gradient(180deg, #000 0%, #000 82%, rgba(0,0,0,0) 100%)" }} />}
    </Room>
  );
};

/* ---------- 8. LOGO-GLOW: schwarz, Logo leuchtet auf, „7 Tage kostenlos testen“ ---------- */
export const Logoglow: React.FC<BeatProps> = (p) => {
  const { frame, width, height, words } = p;
  const f7 = at(words, "7", 8);
  const s = interpolate(frame, [0, 14], [0, 1], { ...clamp, easing: EASE });
  const flare = interpolate(frame, [4, 10, 22], [0, 1, 0.35], clamp);
  return (
    <Room width={width} height={height} tone="black">
      <div style={{ ...abs(540 - 420, 400 - 420), width: 840, height: 840, borderRadius: "50%", background: `radial-gradient(circle, rgba(220,38,38,${0.5 * flare}) 0%, rgba(124,58,237,${0.3 * flare}) 32%, rgba(0,0,0,0) 66%)` }} />
      <div style={{ ...abs(540 - 160, 250), opacity: s, transform: `scale(${0.4 + 0.6 * s}) translateZ(${(1 - s) * -600}px)`, filter: s < 0.98 ? `blur(${(1 - s) * 26}px)` : undefined }}>
        <Logo size={320} glow={flare} glowColor={`rgba(220,38,38,${0.85 * flare})`} />
      </div>
      <div style={{ ...abs(0, 660), width: 1080, display: "flex", justifyContent: "center", gap: 22, perspective: 800 }}>
        {["Jetzt", "7", "Tage", "kostenlos", "testen"].map((w, i) => {
          const wf = words[i]?.f ?? f7 + i * 4;
          return <Word key={w} text={w} at={wf} frame={frame} size={66} color="#FFFFFF" weight={800} />;
        })}
      </div>
      <div style={{ ...abs(0, 790), width: 1080, textAlign: "center", fontSize: 32, fontWeight: 600, color: "#8E91A0", letterSpacing: "0.12em", opacity: appear(frame, f7 + 6, 10) }}>WINDOWS · MAC · LINUX</div>
    </Room>
  );
};

/* ---------- 9. ABSCHLUSS: dunkelblau, Name groß, Suchleiste im Glitch-Rahmen ---------- */
export const Abschluss: React.FC<BeatProps> = (p) => {
  const { frame, width, height, words } = p;
  const fh = at(words, "handel", 24);
  const fd = at(words, "in", fh + 12);
  const name = fly(frame, 0, { x: 0, y: -200, z: -600, ry: 0, ry2: 0, rx: -55, rx2: 0, d: 14, sx: 1, drift: 0 });
  const bar = appear(frame, 8, 12);
  const q = "AutoKontor";
  const n = Math.round(interpolate(frame, [12, 28], [0, q.length], clamp));
  const j = (k: number) => (random(`gl${Math.floor(frame / 3)}${k}`) - 0.5) * 12;
  return (
    <Room width={width} height={height} tone="navy">
      <div style={{ ...abs(0, 250), width: 1080, display: "flex", justifyContent: "center", ...name }}>
        <div style={{ ...H, fontSize: 150, fontWeight: 900, color: "#fff", letterSpacing: "-0.05em" }}>{BRAND.name}</div>
      </div>
      <div style={{ ...abs(130, 470), width: 820, height: 150, opacity: bar, transform: `scale(${0.7 + 0.3 * bar})`, filter: bar < 0.98 ? `blur(${(1 - bar) * 20}px)` : undefined }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 80, border: `5px solid ${M.cyan}`, transform: `translate(${-5 + j(1)}px, ${j(2) / 2}px)`, mixBlendMode: "screen" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: 80, border: `5px solid ${M.pink}`, transform: `translate(${5 + j(3)}px, ${j(4) / 2}px)`, mixBlendMode: "screen" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: 80, border: "5px solid #fff", boxShadow: "0 0 40px rgba(37,244,238,.35), 0 0 60px rgba(254,44,85,.25)" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 28, padding: "0 56px" }}>
          <div style={{ width: 58, height: 58, flex: "none" }}>
            <Glyph name="search" w={6} />
          </div>
          <span style={{ ...H, fontSize: 60, fontWeight: 700, color: "#fff", textShadow: `${-3 + j(5) / 3}px 0 0 rgba(37,244,238,.85), ${3 + j(6) / 3}px 0 0 rgba(254,44,85,.85)`, whiteSpace: "nowrap" }}>{q.slice(0, n)}</span>
          <span style={{ width: 5, height: 64, background: "#fff", marginLeft: -16, opacity: Math.floor(frame / 15) % 2 ? 0.1 : 0.9 }} />
        </div>
      </div>
      <div style={{ ...abs(0, 690), width: 1080, display: "flex", justifyContent: "center", gap: 20, perspective: 800 }}>
        <Word text="Dein Handel." at={fh} frame={frame} size={58} color="#C9CCD8" weight={600} />
        <Word text="In deiner Hand." at={fd} frame={frame} size={58} color="#B69CFF" weight={700} />
      </div>
      <div style={{ ...abs(0, 800), width: 1080, textAlign: "center", fontSize: 30, fontWeight: 500, color: "#8E91A0", opacity: appear(frame, fd + 8, 12) }}>
        {BRAND.pricePrefix} {BRAND.price} {BRAND.priceUnit} {BRAND.priceNote} · 7 Tage kostenlos testen
      </div>
    </Room>
  );
};

export const MOTION_EFFECTS: Record<string, React.FC<any>> = {
  icons: Icons,
  bigicon: Bigicon,
  infokarte: Infokarte,
  suchfeld: Suchfeld,
  bildkarten: Bildkarten,
  zaehler: Zaehler,
  chart: Chart,
  logoglow: Logoglow,
  abschluss: Abschluss,
};
