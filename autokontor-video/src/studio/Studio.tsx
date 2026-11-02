// „Studio“-Hochformat (9:16): fester Rahmen mit großer Schlagzeile, Karte mit dem animierten Premium-Spot
// (nativ gerendert, nicht als verkleinertes Video), Merkmal-Chips, die beim gesprochenen Wort abhaken,
// Fortschrittsbalken und Abschluss-Button. Nach Vorlage „AutoKontor_Neu_Studio_9zu16“, aber hochwertiger.
import React from "react";
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE, Timeline, clamp } from "../lib";
import { Spot } from "../Spot";
import { Check, Orb } from "../premium/kit";
import { BRAND, C, FONT, FPS, NFONT, P } from "../theme";

// Abschnitte: welche Szenen (Effekt-Namen aus dem Skript) gehören zu welcher Schlagzeile
const SECTIONS: { fx: string[]; h1: string; h2: string; sub: string }[] = [
  { fx: ["chaos", "schluss"], h1: "ZETTEL. EXCEL.", h2: "ZU VIEL CHAOS?", sub: "PAPIERCHAOS HAT EIN ENDE." },
  { fx: ["logo"], h1: "EINE SOFTWARE.", h2: "ALLES IM GRIFF.", sub: "DEIN HANDEL. NEU ORGANISIERT." },
  { fx: ["kugel"], h1: "FÜR AUTOHÄNDLER.", h2: "GROSS UND KLEIN.", sub: "ENTWICKELT FÜR DEINEN ALLTAG." },
  { fx: ["karten", "klick"], h1: "KAUFVERTRÄGE.", h2: "EINFACH DIGITAL.", sub: "WENIGER KLICKS, MEHR ÜBERBLICK." },
  { fx: ["badges"], h1: "RECHNUNGEN.", h2: "AUCH ALS E-RECHNUNG.", sub: "PDF, ZUGFERD UND XRECHNUNG." },
  { fx: ["lokal", "wolke"], h1: "DEINE DATEN.", h2: "BLEIBEN BEI DIR.", sub: "LOKAL AUF DEINEM RECHNER." },
  { fx: ["backup"], h1: "AUTOMATISCHE", h2: "DATENSICHERUNG.", sub: "JEDEN TAG. GANZ VON SELBST." },
  { fx: ["plattform"], h1: "LÄUFT ÜBERALL.", h2: "WINDOWS. MAC. LINUX.", sub: "DIREKT AUF DEINEM PC." },
  { fx: ["preis", "kuendbar"], h1: `AB ${BRAND.price} IM MONAT.`, h2: "MONATLICH KÜNDBAR.", sub: "ALLE PREISE ZZGL. MWST." },
  { fx: ["end"], h1: "AUTOKONTOR.", h2: "JETZT TESTEN.", sub: "STARTE NOCH HEUTE." },
];
const CHIPS: { label: string; re: RegExp }[] = [
  { label: "KAUFVERTRÄGE", re: /^kaufvertr/i },
  { label: "RECHNUNGEN", re: /^rechnungen/i },
  { label: "E-RECHNUNG", re: /^e-rechnung/i },
];

// Rahmen-Maße (1080 × 1920)
const PAD = 40;
// Die Szenen sind für 16:9 gebaut und geprüft → Spot wird in 1920 × 1080 gerendert und in die Karte skaliert
const CARD = { x: 20, y: 446, w: 1040, h: 585 };
const SPOT_W = 1920;
const SPOT_H = 1080;
const ORB = { x: 962, y: 250, size: 168 };
const INK = "#15171E";
const LILAC = "#F2EFF8";

let ctx: CanvasRenderingContext2D | null = null;
const textWidth = (text: string, size: number, weight: number, family: string) => {
  ctx ??= document.createElement("canvas").getContext("2d");
  if (!ctx) return text.length * size * 0.7;
  ctx.font = `${weight} ${size}px ${family}`;
  return ctx.measureText(text).width;
};

const Background: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at 20% 8%, #FFFFFF 0%, ${LILAC} 45%, #E9E6F2 100%)`, overflow: "hidden" }}>
    {/* warme Lichtflecken */}
    <div style={{ position: "absolute", left: 520, top: -260, width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,140,70,.22) 0%, rgba(255,140,70,0) 65%)" }} />
    <div style={{ position: "absolute", left: -380, top: 1180, width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,120,50,.14) 0%, rgba(255,120,50,0) 65%)" }} />
    {/* feine Kreisbögen um die Kugel, drehen sich langsam */}
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 9 }).map((_, k) => (
        <circle
          key={k}
          cx={ORB.x}
          cy={ORB.y}
          r={150 + k * 82}
          fill="none"
          stroke={P.orange}
          strokeOpacity={0.12 - k * 0.011}
          strokeWidth={1.6}
          strokeDasharray={k % 2 ? "2 14" : "380 60"}
          transform={`rotate(${(frame * (k % 2 ? 0.12 : -0.08) + k * 31) % 360} ${ORB.x} ${ORB.y})`}
        />
      ))}
    </svg>
  </AbsoluteFill>
);

const TopBar: React.FC<{ frame: number }> = ({ frame }) => {
  const t = interpolate(frame, [0, 14], [0, 1], { ...clamp, easing: EASE });
  return (
    <div style={{ position: "absolute", left: PAD, right: PAD, top: 52, opacity: t, transform: `translateY(${(1 - t) * -30}px)` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 66, height: 66, borderRadius: 18, background: `linear-gradient(145deg, #5B95FF 0%, ${C.blue} 55%, #1F5BE0 100%)`, boxShadow: "0 10px 24px rgba(47,123,255,.35), inset 0 1px 0 rgba(255,255,255,.4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: NFONT.head, fontWeight: 800, fontSize: 28, letterSpacing: "-0.04em" }}>
            {BRAND.logoText}
          </div>
          <div style={{ fontFamily: NFONT.head, fontWeight: 600, fontSize: 38, color: INK, letterSpacing: "-0.02em" }}>{BRAND.name}</div>
        </div>
        <div style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: 19, letterSpacing: "0.26em", color: "#8A8F9E" }}>HÄNDLERSOFTWARE</div>
      </div>
      <div style={{ marginTop: 26, height: 2, background: "linear-gradient(90deg, rgba(21,23,30,.12), rgba(21,23,30,.04))", transformOrigin: "left", transform: `scaleX(${t})` }} />
    </div>
  );
};

/** Kugel oben rechts: schwebt, Ringe kreisen, kleiner Hüpfer bei jedem neuen Abschnitt. */
const BigOrb: React.FC<{ frame: number; since: number }> = ({ frame, since }) => {
  const { fps } = useVideoConfig();
  const pop = spring({ frame: since, fps, config: { stiffness: 220, damping: 11 } });
  const s = 1 + (1 - pop) * -0.08;
  const y = Math.sin(frame / 26) * 10;
  const appear = spring({ frame: frame - 4, fps, config: { stiffness: 120, damping: 14 } });
  return (
    <div style={{ position: "absolute", left: ORB.x - ORB.size / 2, top: ORB.y - ORB.size / 2 + y, width: ORB.size, height: ORB.size, transform: `scale(${appear * s})` }}>
      <svg width={420} height={420} style={{ position: "absolute", left: ORB.size / 2 - 210, top: ORB.size / 2 - 210, overflow: "visible" }}>
        {[0, 1].map((k) => (
          <ellipse key={k} cx={210} cy={210} rx={150 - k * 24} ry={52 - k * 8} fill="none" stroke={P.orange} strokeOpacity={0.55 - k * 0.2} strokeWidth={2.4} transform={`rotate(${-24 + k * 16 + Math.sin((frame + k * 40) / 50) * 6} 210 210)`} strokeDasharray={k ? "6 10" : undefined} />
        ))}
      </svg>
      <Orb size={ORB.size} />
    </div>
  );
};

const HeadLine: React.FC<{ text: string; size: number; color: string; local: number; exit: number; delay: number; shimmer?: boolean }> = ({ text, size, color, local, exit, delay, shimmer }) => {
  const t = interpolate(local - delay, [0, 14], [0, 1], { ...clamp, easing: EASE });
  const shine = ((local * 1.6) % 260) - 60;
  return (
    <div style={{ overflow: "hidden", paddingBottom: size * 0.08, marginBottom: -size * 0.04 }}>
      <div
        style={{
          fontFamily: NFONT.head,
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1.06,
          letterSpacing: "-0.025em",
          whiteSpace: "nowrap",
          transform: `translateY(${(1 - t) * 105 - exit * 105}%)`,
          color,
          ...(shimmer
            ? {
                backgroundImage: `linear-gradient(100deg, ${color} 0%, ${color} ${shine - 18}%, #FFC59C ${shine}%, ${color} ${shine + 18}%, ${color} 100%)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }
            : {}),
        }}
      >
        {text}
      </div>
    </div>
  );
};

const Chip: React.FC<{ label: string; p: number }> = ({ label, p }) => (
  <div
    style={{
      flex: 1,
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: "#fff",
      borderRadius: 18,
      padding: "22px 18px",
      border: `2px solid ${p > 0.5 ? "rgba(29,185,84,.45)" : "rgba(21,23,30,.08)"}`,
      boxShadow: p > 0.5 ? "0 12px 26px rgba(29,185,84,.18)" : "0 8px 20px rgba(30,40,70,.07)",
      transform: `scale(${1 + Math.sin(Math.min(1, p) * Math.PI) * 0.06})`,
      fontFamily: FONT.ui,
      fontWeight: 700,
      fontSize: 25,
      letterSpacing: "0.01em",
      color: p > 0.5 ? INK : "#7A8090",
      whiteSpace: "nowrap",
    }}
  >
    <div style={{ position: "relative", width: 38, height: 38, flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2.5px solid rgba(21,23,30,.18)", opacity: 1 - p }} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${p})` }}>
        <Check s={38} p={p} />
      </div>
    </div>
    {label}
  </div>
);

/** Unten: dunkle Leiste → am Ende orange Button mit Glanz und Puls. */
const BottomBar: React.FC<{ frame: number; endAt: number }> = ({ frame, endAt }) => {
  const { fps } = useVideoConfig();
  const intro = interpolate(frame, [10, 26], [0, 1], { ...clamp, easing: EASE });
  const cta = spring({ frame: frame - endAt, fps, config: { stiffness: 140, damping: 13 } });
  const l = frame - endAt;
  const pulse = l > 18 ? 1 + Math.sin((l - 18) / 6) * 0.018 : 1;
  const sweep = l > 10 ? (((l - 10) % 45) / 45) * 160 - 30 : -40;
  return (
    <div style={{ position: "absolute", left: PAD, right: PAD, top: 1448, height: 156, opacity: intro, transform: `translateY(${(1 - intro) * 40}px)` }}>
      {/* dunkle Leiste */}
      <div style={{ position: "absolute", inset: 0, borderRadius: 30, background: "linear-gradient(180deg, #23263A 0%, #171927 100%)", boxShadow: "0 22px 50px rgba(20,22,40,.28)", overflow: "hidden", opacity: 1 - cta, transform: `scale(${1 - cta * 0.04})` }}>
        <div style={{ height: 8, background: `linear-gradient(90deg, ${P.orange}, #FF9A55)` }} />
        <div style={{ padding: "30px 40px" }}>
          <div style={{ fontFamily: NFONT.head, fontWeight: 600, fontSize: 40, color: "#fff", letterSpacing: "-0.01em" }}>Mehr Zeit für deinen Autohandel.</div>
          <div style={{ fontFamily: FONT.ui, fontWeight: 400, fontSize: 27, color: "#B9BDCA", marginTop: 8 }}>Weniger Papier. Mehr Überblick.</div>
        </div>
      </div>
      {/* Abschluss-Button */}
      {l > -2 && (
        <div style={{ position: "absolute", inset: 0, opacity: cta, transform: `scale(${(0.9 + cta * 0.1) * pulse})` }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 30, background: `linear-gradient(180deg, #FF8740 0%, ${P.orange} 55%, #E9550F 100%)`, boxShadow: "0 24px 60px rgba(233,85,15,.45), inset 0 2px 0 rgba(255,255,255,.35)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 30px 0 44px" }}>
            <div style={{ position: "absolute", top: 0, bottom: 0, left: `${sweep}%`, width: "22%", background: "linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.45) 50%, rgba(255,255,255,0) 100%)", transform: "skewX(-18deg)" }} />
            <div style={{ fontFamily: NFONT.head, fontWeight: 800, fontSize: 50, color: "#fff", letterSpacing: "-0.01em", position: "relative" }}>7 TAGE KOSTENLOS TESTEN</div>
            <div style={{ width: 96, height: 96, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", boxShadow: "0 8px 18px rgba(120,40,0,.25)" }}>
              <svg width={40} height={40} viewBox="0 0 24 24" style={{ transform: `translateX(${Math.sin(l / 5) * 3}px)` }}>
                <path d="M5 12 H18 M12.5 6 L18.5 12 L12.5 18" fill="none" stroke={P.orange} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div style={{ position: "absolute", top: 180, left: 0, right: 0, textAlign: "center", fontFamily: FONT.ui, fontWeight: 700, fontSize: 28, color: "#4A4F5C" }}>
            Danach {BRAND.pricePrefix} {BRAND.price} {BRAND.priceUnit} <span style={{ fontWeight: 400, fontSize: 24 }}>{BRAND.priceNote}</span> · monatlich kündbar
          </div>
        </div>
      )}
    </div>
  );
};

export const Studio: React.FC<{ timeline: Timeline }> = ({ timeline }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const beats = timeline.beats;

  // Startframe jedes Abschnitts (erste Szene, die dazugehört)
  const starts = SECTIONS.map((s) => {
    const b = beats.find((x) => s.fx.includes(x.effect));
    return b ? Math.round(b.start * FPS) : Infinity;
  });
  starts[0] = 0;
  let cur = 0;
  for (let i = 0; i < SECTIONS.length; i++) if (frame >= starts[i]) cur = i;
  const sec = SECTIONS[cur];
  const local = frame - starts[cur];
  const next = starts.slice(cur + 1).find((v) => v !== Infinity) ?? Infinity;
  const exit = next === Infinity ? 0 : interpolate(frame, [next - 7, next], [0, 1], { ...clamp, easing: EASE });
  const endAt = starts[SECTIONS.length - 1] === Infinity ? durationInFrames : starts[SECTIONS.length - 1];

  // Schlagzeile: beide Zeilen gleich groß, so groß wie möglich (max. 92 px), passt in die Breite
  const maxW = ORB.x - ORB.size / 2 - PAD - 36;
  const size = Math.min(84, ...[sec.h1, sec.h2].map((t) => (84 * maxW) / textWidth(t, 84, 800, "Sora")));

  // Chips haken ab, wenn das Wort gesprochen wird
  const words = beats.flatMap((b) => b.words);
  const chipP = CHIPS.map((c) => {
    const w = words.find((x) => c.re.test(x.w.replace(/[*~]/g, "")));
    const at = w ? Math.round(w.start * FPS) : endAt;
    return spring({ frame: frame - at, fps, config: { stiffness: 180, damping: 14 } });
  });

  const cardIn = spring({ frame: frame - 2, fps, config: { stiffness: 110, damping: 16 } });
  const float = Math.sin(frame / 34) * 4;
  const progress = Math.min(1, frame / Math.max(1, endAt));
  const low = interpolate(frame, [8, 22], [0, 1], { ...clamp, easing: EASE });
  const subT = interpolate(local, [4, 16], [0, 1], { ...clamp, easing: EASE });

  return (
    <AbsoluteFill style={{ background: LILAC }}>
      <Background frame={frame} />
      <BigOrb frame={frame} since={local} />
      <TopBar frame={frame} />

      {/* Schlagzeile */}
      <div style={{ position: "absolute", left: PAD, top: 200, width: maxW, height: 220, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <HeadLine text={sec.h1} size={size} color={INK} local={local} exit={exit} delay={0} />
        <HeadLine text={sec.h2} size={size} color={P.orange} local={local} exit={exit} delay={4} shimmer />
      </div>

      {/* Karte mit dem animierten Spot */}
      <div
        style={{
          position: "absolute",
          left: CARD.x,
          top: CARD.y + float,
          width: CARD.w,
          height: CARD.h,
          borderRadius: 30,
          overflow: "hidden",
          boxShadow: `0 0 0 3px ${P.orange}, 0 0 0 10px rgba(255,106,26,.10), 0 40px 90px rgba(150,60,20,.22), 0 10px 26px rgba(30,40,70,.12)`,
          transform: `scale(${0.92 + 0.08 * cardIn})`,
          opacity: cardIn,
          background: P.bg,
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, width: SPOT_W, height: SPOT_H, transform: `scale(${CARD.w / SPOT_W})`, transformOrigin: "0 0" }}>
          <Sequence width={SPOT_W} height={SPOT_H} durationInFrames={durationInFrames} layout="none" name="Spot in der Karte">
            <Spot timeline={timeline} />
          </Sequence>
        </div>
        {/* feiner Glanz oben */}
        <div style={{ position: "absolute", inset: 0, borderRadius: 30, background: "linear-gradient(180deg, rgba(255,255,255,.16) 0%, rgba(255,255,255,0) 18%)", pointerEvents: "none" }} />
      </div>

      {/* Fortschritt */}
      <div style={{ position: "absolute", left: CARD.x + 20, top: CARD.y + CARD.h + 26, width: CARD.w - 40, height: 8, borderRadius: 4, background: "rgba(255,106,26,.16)", opacity: low }}>
        <div style={{ width: `${progress * 100}%`, height: "100%", borderRadius: 4, background: `linear-gradient(90deg, #FFA162, ${P.orange})`, boxShadow: "0 0 14px rgba(255,106,26,.6)" }} />
      </div>

      {/* Unterzeile */}
      <div style={{ position: "absolute", left: PAD, top: 1102, opacity: low, transform: `translateY(${(1 - low) * 24}px)` }}>
        <div style={{ display: "inline-block", fontFamily: FONT.ui, fontWeight: 700, fontSize: 21, letterSpacing: "0.16em", color: "#D9530E", background: "rgba(255,106,26,.12)", border: "1.5px solid rgba(255,106,26,.28)", borderRadius: 999, padding: "8px 18px" }}>DEIN DIGITALER AUTOHANDEL</div>
        <div style={{ marginTop: 22, height: 60, overflow: "hidden" }}>
          <div style={{ fontFamily: NFONT.head, fontWeight: 800, fontSize: 46, color: INK, letterSpacing: "-0.01em", whiteSpace: "nowrap", opacity: subT * (1 - exit), transform: `translateY(${(1 - subT) * 30 - exit * 20}px)` }}>{sec.sub}</div>
        </div>
        <div style={{ marginTop: 8, fontFamily: FONT.ui, fontWeight: 700, fontSize: 24, letterSpacing: "0.08em", color: "#8A8F9E" }}>AUTOHAUS-SOFTWARE, DIE MITDENKT.</div>
      </div>

      {/* Merkmal-Chips */}
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 1316, display: "flex", gap: 16, opacity: low, transform: `translateY(${(1 - low) * 30}px)` }}>
        {CHIPS.map((c, i) => (
          <Chip key={c.label} label={c.label} p={chipP[i]} />
        ))}
      </div>

      <BottomBar frame={frame} endAt={endAt} />

      {/* Fußzeile */}
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 1716, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: low * (1 - interpolate(frame, [endAt, endAt + 8], [0, 1], clamp)) }}>
        <div style={{ fontFamily: FONT.ui, fontSize: 25, color: "#7A8090", letterSpacing: "0.04em" }}>Windows  ·  Mac  ·  Linux</div>
        <div style={{ fontFamily: NFONT.head, fontWeight: 800, fontSize: 22, color: INK, letterSpacing: "0.22em" }}>AUTOKONTOR</div>
      </div>
    </AbsoluteFill>
  );
};
