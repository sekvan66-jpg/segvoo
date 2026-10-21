import React from "react";
import { AbsoluteFill, Img, interpolate, random, spring, staticFile, useVideoConfig } from "remotion";
import { BeatProps, BigWords, CARD_ICONS, EASE, WordF, cardKey, cardWords, clamp, clean, pop } from "../lib";
import { BRAND, C, FONT } from "../theme";

const norm = (w: string) => w.toLowerCase().replace(/[^a-zäöüß0-9]/g, "");
const wordIndex = (words: WordF[], target: string | string[], fallback: number) => {
  const targets = Array.isArray(target) ? target : [target];
  for (const t of targets) {
    const i = words.findIndex((w) => norm(w.w) === t);
    if (i >= 0) return i;
  }
  return Math.min(words.length - 1, fallback);
};

/* ---------------- LAPTOP ---------------- */
const FakeUI: React.FC<{ frame: number }> = ({ frame }) => {
  const rows = [
    ["BMW 320d Touring", "2021", "64.000 km", "24.990 €", "Verfügbar"],
    ["Mercedes C 220 d", "2020", "81.500 km", "26.450 €", "Reserviert"],
    ["Audi A4 Avant 40 TDI", "2022", "39.900 km", "31.900 €", "Verfügbar"],
    ["BMW X3 xDrive20d", "2019", "98.000 km", "27.700 €", "Verkauft"],
    ["Mercedes GLC 300", "2021", "52.300 km", "38.490 €", "Verfügbar"],
  ];
  const status = (s: string) => (s === "Verfügbar" ? "#22C55E" : s === "Reserviert" ? "#F59E0B" : C.grey);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#0E1220", fontFamily: FONT.ui, color: "#fff", display: "flex" }}>
      <div style={{ width: "19%", background: "#0A0D18", padding: "4%", borderRight: "1px solid #1C2236" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8%", marginBottom: "18%" }}>
          <div style={{ background: C.blue, borderRadius: 6, fontWeight: 700, fontSize: "0.9em", padding: "3px 6px" }}>AK</div>
          <div style={{ fontWeight: 700, fontSize: "0.85em" }}>{BRAND.name}</div>
        </div>
        {["Fahrzeuge", "Kunden", "Verträge", "Rechnungen", "Statistik"].map((t, i) => (
          <div key={t} style={{ fontSize: "0.72em", padding: "7% 8%", borderRadius: 6, marginBottom: "4%", background: i === 0 ? "#1B2A55" : "transparent", color: i === 0 ? "#fff" : "#8E97B5" }}>
            {t}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, padding: "3.5%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3%" }}>
          <div style={{ fontWeight: 700, fontSize: "1.15em" }}>Fahrzeugbestand</div>
          <div style={{ background: C.blue, borderRadius: 6, padding: "4px 10px", fontSize: "0.7em", fontWeight: 700 }}>+ Fahrzeug</div>
        </div>
        <div style={{ display: "flex", gap: "3%", marginBottom: "3.5%" }}>
          {[["Im Bestand", "38"], ["Verkauft (Monat)", "11"], ["Ø Standzeit", "41 Tage"]].map(([a, b], i) => (
            <div key={a} style={{ flex: 1, background: "#151B2E", borderRadius: 8, padding: "2.5% 3%", opacity: interpolate(frame, [4 + i * 3, 10 + i * 3], [0, 1], clamp) }}>
              <div style={{ fontSize: "0.6em", color: "#8E97B5" }}>{a}</div>
              <div style={{ fontSize: "1.1em", fontWeight: 700 }}>{b}</div>
            </div>
          ))}
        </div>
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "2.4fr 0.8fr 1.2fr 1.1fr 1.1fr",
              alignItems: "center",
              fontSize: "0.68em",
              padding: "2% 2.5%",
              marginBottom: "1.6%",
              background: "#121829",
              borderRadius: 6,
              opacity: interpolate(frame, [8 + i * 2, 14 + i * 2], [0, 1], clamp),
              transform: `translateY(${interpolate(frame, [8 + i * 2, 14 + i * 2], [12, 0], { ...clamp, easing: EASE })}px)`,
            }}
          >
            <span style={{ fontWeight: 700 }}>{r[0]}</span>
            <span style={{ color: "#8E97B5" }}>{r[1]}</span>
            <span style={{ color: "#8E97B5" }}>{r[2]}</span>
            <span style={{ fontWeight: 700 }}>{r[3]}</span>
            <span style={{ color: status(r[4]) }}>● {r[4]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Laptop: React.FC<BeatProps> = (p) => {
  const { fps } = useVideoConfig();
  const lw = p.vertical ? p.width * 0.8 : p.width * 0.44;
  const sh = lw * 0.62;
  const enter = spring({ frame: p.frame, fps, config: { damping: 16, stiffness: 120 } });
  const shine = interpolate(p.frame, [8, 26], [-60, 160], clamp);
  const laptop = (
    <div style={{ perspective: 2000, transform: `translateY(${(1 - enter) * 500}px)` }}>
      <div style={{ transform: `rotateX(${interpolate(enter, [0, 1], [28, 6])}deg) scale(${1 + p.frame / p.dur * 0.04})`, transformOrigin: "50% 100%" }}>
        <div
          style={{
            width: lw,
            height: sh,
            background: "#0A0A0C",
            borderRadius: lw * 0.03,
            padding: lw * 0.018,
            boxShadow: `0 0 0 2px #2A2A30, 0 40px 120px rgba(255,30,30,.25), 0 0 ${lw * 0.15}px rgba(47,123,255,.25)`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: lw * 0.012, overflow: "hidden", fontSize: lw * 0.024 }}>
            {p.screenshot ? <Img src={staticFile(p.screenshot)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} /> : <FakeUI frame={p.frame} />}
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(105deg, transparent ${shine - 20}%, rgba(255,255,255,.18) ${shine}%, transparent ${shine + 20}%)` }} />
          </div>
        </div>
        <div style={{ width: lw * 1.14, height: lw * 0.03, marginLeft: -lw * 0.07, background: "linear-gradient(180deg,#3A3A42,#16161A)", borderRadius: `0 0 ${lw * 0.03}px ${lw * 0.03}px` }} />
      </div>
    </div>
  );
  const text = (
    <BigWords
      words={p.words}
      frame={p.frame}
      width={p.vertical ? p.width - 220 : p.width * 0.36}
      maxSize={p.vertical ? 200 : 180}
      maxChars={p.vertical ? 15 : 10}
      align={p.vertical ? "center" : "left"}
      color={(w) => (w.i === p.words.length - 1 ? C.red : C.white)}
      styleFor={(_, l) => ({ transform: `scale(${pop(l, fps, 2)})` })}
    />
  );
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 70%, #1a0306 0%, ${C.black} 60%)`, justifyContent: "center", alignItems: "center" }}>
      {p.vertical ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 120 }}>
          {text}
          {laptop}
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 80 }}>
          {text}
          {laptop}
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ---------------- LOCK ---------------- */
export const Lock: React.FC<BeatProps> = (p) => {
  const { fps } = useVideoConfig();
  const size = p.vertical ? 440 : 380;
  const close = spring({ frame: p.frame - 9, fps, config: { damping: 9, stiffness: 300 } });
  const gather = interpolate(p.frame, [0, 12], [0, 1], { ...clamp, easing: EASE });
  const ring = interpolate(p.frame, [11, 26], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: C.black, justifyContent: "center", alignItems: "center" }}>
      {Array.from({ length: 60 }).map((_, k) => {
        const a = random(`pa${k}`) * Math.PI * 2;
        const d = 500 + random(`pd${k}`) * 900;
        const x = Math.cos(a) * d * (1 - gather);
        const y = Math.sin(a) * d * (1 - gather) - (p.vertical ? 200 : 120);
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              width: 8,
              height: 8,
              borderRadius: 4,
              background: k % 3 ? C.red : C.white,
              transform: `translate(${x}px, ${y}px)`,
              opacity: 1 - gather * 0.95,
              boxShadow: `0 0 12px ${C.red}`,
            }}
          />
        );
      })}
      <div style={{ display: "flex", flexDirection: p.vertical ? "column" : "row", alignItems: "center", gap: p.vertical ? 110 : 120 }}>
        <div style={{ position: "relative", width: size, height: size }}>
          <div
            style={{
              position: "absolute",
              inset: -size * 0.3,
              borderRadius: "50%",
              border: `6px solid ${C.red}`,
              transform: `scale(${0.6 + ring * 0.8})`,
              opacity: (1 - ring) * 0.9,
            }}
          />
          <svg viewBox="0 0 100 100" width={size} height={size} style={{ transform: `scale(${pop(p.frame, fps, 0.4)})`, filter: `drop-shadow(0 0 40px ${C.red}AA)` }}>
            <path
              d="M30 48 V34 a20 20 0 0 1 40 0 V48"
              fill="none"
              stroke="#E8E8EE"
              strokeWidth={8}
              strokeLinecap="round"
              transform={`translate(0 ${interpolate(close, [0, 1], [-16, 0])})`}
            />
            <rect x={18} y={44} width={64} height={48} rx={10} fill={C.red} />
            <rect x={18} y={44} width={64} height={18} rx={10} fill="rgba(255,255,255,.12)" />
            <circle cx={50} cy={64} r={6} fill={C.black} />
            <rect x={47} y={66} width={6} height={13} rx={3} fill={C.black} />
          </svg>
        </div>
        <BigWords
          words={p.words}
          frame={p.frame}
          width={p.vertical ? p.width - 140 : p.width * 0.42}
          maxSize={p.vertical ? 190 : 170}
          maxChars={p.vertical ? 13 : 12}
          align={p.vertical ? "center" : "left"}
          color={(w) => (w.i >= p.words.length - 2 ? C.red : C.white)}
          styleFor={(_, l) => ({ transform: `scale(${pop(l, fps, 1.8)})` })}
        />
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- OS-KARTEN ---------------- */
const Icon: React.FC<{ k: number; s: number }> = ({ k, s }) => {
  const st = { fill: "none", stroke: "#fff", strokeWidth: 5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
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

export const OS: React.FC<BeatProps> = (p) => {
  const { fps } = useVideoConfig();
  const cw = p.vertical ? 760 : 480;
  const ch = p.vertical ? 300 : 440;
  const cards = cardWords(p.words);
  const sweep = interpolate(p.frame, [cards.at(-1)!.f + 4, cards.at(-1)!.f + 22], [-30, 130], clamp);
  // Wörter vor der ersten Karte (z. B. „zum Beispiel“) als Überschrift, damit das Bild nie leer ist
  const lead = p.words.slice(0, p.words.indexOf(cards[0]));
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, #200307 0%, ${C.black} 65%)`, justifyContent: "center", alignItems: "center", flexDirection: "column", gap: p.vertical ? 70 : 60 }}>
      {lead.length > 0 && (
        <div style={{ fontFamily: FONT.display, fontSize: p.vertical ? 110 : 96, color: C.red, textTransform: "uppercase", display: "flex", gap: "0.25em" }}>
          {lead.map((w) => (
            <span key={w.i} style={{ opacity: p.frame < w.f ? 0 : 1, display: "inline-block", transform: `scale(${pop(p.frame - w.f, fps, 1.8)})` }}>
              {clean(w.w)}
            </span>
          ))}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: p.vertical ? "column" : "row", gap: p.vertical ? 50 : 60 }}>
        {cards.map((w, k) => {
          const l = p.frame - w.f;
          const s = spring({ frame: l, fps, config: { damping: 12, stiffness: 220 } });
          return (
            <div
              key={k}
              style={{
                width: cw,
                height: ch,
                borderRadius: 36,
                background: "linear-gradient(160deg, rgba(255,255,255,.12), rgba(255,255,255,.03))",
                border: "2px solid rgba(255,255,255,.18)",
                boxShadow: `0 30px 80px rgba(0,0,0,.6), inset 0 0 0 1px rgba(255,30,30,${0.4 * s})`,
                display: "flex",
                flexDirection: p.vertical ? "row" : "column",
                alignItems: "center",
                justifyContent: "center",
                gap: p.vertical ? 50 : 30,
                opacity: l < 0 ? 0 : 1,
                transform: `translateY(${(1 - s) * 140}px) scale(${0.7 + 0.3 * s})`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Icon k={CARD_ICONS[cardKey(w.w)] ?? k} s={p.vertical ? 150 : 170} />
              <div style={{ fontFamily: FONT.display, fontSize: p.vertical ? 130 : 110, color: "#fff", textTransform: "uppercase" }}>{clean(w.w).replace(/[.!?,]$/, "")}</div>
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(110deg, transparent ${sweep - 15}%, rgba(255,30,30,.35) ${sweep}%, transparent ${sweep + 15}%)` }} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- ENDBILD ---------------- */
export const End: React.FC<BeatProps> = (p) => {
  const { fps } = useVideoConfig();
  const fSlogan = p.words[wordIndex(p.words, ["dein", "autokontor"], 1)].f;
  const fCta = p.words[wordIndex(p.words, ["herunterladen", "jetzt"], Math.floor(p.words.length * 0.6))].f;
  const a = (f: number) => spring({ frame: p.frame - f, fps, config: { damping: 16, stiffness: 140 } });
  const logo = a(0);
  const sl = a(fSlogan);
  const cta = a(fCta);
  const shine = interpolate(p.frame - fCta, [10, 34], [-40, 140], clamp);
  const u = p.vertical ? 1.12 : 0.85;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, #0F2A66 0%, ${C.navy} 55%, #020409 100%)`, justifyContent: "center", alignItems: "center", fontFamily: FONT.ui }}>
      <AbsoluteFill style={{ background: C.white, opacity: interpolate(p.frame, [0, 3], [0.8, 0], clamp) }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div
          style={{
            width: 220 * u,
            height: 220 * u,
            borderRadius: 52 * u,
            background: `linear-gradient(145deg, #4B8DFF, ${C.blue} 50%, #1B4FD1)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 104 * u,
            letterSpacing: "-0.04em",
            boxShadow: `0 0 ${120 * logo}px ${C.blue}AA, inset 0 2px 0 rgba(255,255,255,.35)`,
            transform: `scale(${interpolate(logo, [0, 1], [0.3, 1])}) rotate(${interpolate(logo, [0, 1], [-25, 0])}deg)`,
            opacity: logo,
          }}
        >
          {BRAND.logoText}
        </div>
        <div style={{ marginTop: 60 * u, fontWeight: 700, fontSize: 150 * u, color: "#fff", letterSpacing: "-0.04em", opacity: logo, transform: `translateY(${(1 - logo) * 60}px)` }}>
          {BRAND.name}
        </div>
        <div style={{ marginTop: 20 * u, fontSize: 58 * u, color: "#B9C6E4", opacity: sl, transform: `translateY(${(1 - sl) * 40}px)`, filter: `blur(${(1 - sl) * 8}px)` }}>
          {BRAND.slogan}
        </div>
        <div
          style={{
            marginTop: 90 * u,
            padding: `${34 * u}px ${(p.vertical ? 54 : 70) * u}px`,
            borderRadius: 999,
            background: C.blue,
            color: "#fff",
            fontWeight: 700,
            fontSize: (p.vertical ? 44 : 52) * u,
            position: "relative",
            overflow: "hidden",
            boxShadow: `0 20px 70px ${C.blue}88`,
            opacity: cta,
            transform: `scale(${interpolate(cta, [0, 1], [0.7, 1])})`,
          }}
        >
          {BRAND.cta}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(110deg, transparent ${shine - 12}%, rgba(255,255,255,.55) ${shine}%, transparent ${shine + 12}%)` }} />
        </div>
        <div style={{ marginTop: 44 * u, fontSize: 40 * u, color: "#fff", fontWeight: 700, opacity: cta }}>
          {BRAND.pricePrefix} {BRAND.price} {BRAND.priceUnit}
          <span style={{ marginLeft: 14 * u, fontSize: 26 * u, fontWeight: 400, color: "#9FB0D6" }}>{BRAND.priceNote}</span>
        </div>
        <div style={{ marginTop: 26 * u, fontSize: 30 * u, color: "#7F8CAD", letterSpacing: "0.12em", opacity: cta }}>{BRAND.platforms}</div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- DOKUMENTE (Kaufvertrag, Rechnung, PDF) ---------------- */
const Paper: React.FC<{ title: string; w: number; frame: number; at: number; rot: number; x: number; pdfAt: number }> = ({ title, w, frame, at, rot, x, pdfAt }) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 15, stiffness: 150 } });
  const stamp = spring({ frame: frame - pdfAt, fps, config: { damping: 10, stiffness: 260 } });
  const h = w * 1.36;
  const line = (width: string, k: number, dark = false) => (
    <div key={k} style={{ height: w * 0.022, width, borderRadius: 4, background: dark ? "#2A2F3D" : "#D9DCE4", marginBottom: w * 0.035 }} />
  );
  return (
    <div
      style={{
        position: "absolute",
        width: w,
        height: h,
        left: -w / 2 + x,
        top: -h / 2,
        background: "#FAFAFC",
        borderRadius: w * 0.03,
        padding: w * 0.08,
        boxShadow: "0 40px 90px rgba(0,0,0,.7)",
        fontFamily: FONT.ui,
        opacity: frame < at ? 0 : 1,
        transform: `translate(${(1 - s) * 900}px, ${(1 - s) * 120}px) rotate(${rot * s + (1 - s) * 25}deg)`,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: w * 0.08 }}>
        <div style={{ background: C.blue, color: "#fff", fontWeight: 700, fontSize: w * 0.045, borderRadius: 5, padding: `${w * 0.012}px ${w * 0.02}px` }}>{BRAND.logoText}</div>
        <div style={{ fontSize: w * 0.03, color: "#8A90A0" }}>Nr. 2026-0147</div>
      </div>
      <div style={{ fontWeight: 700, fontSize: w * 0.085, color: "#11131A", letterSpacing: "0.02em", marginBottom: w * 0.06 }}>{title.toUpperCase()}</div>
      {line("70%", 0, true)}
      {line("55%", 1)}
      {line("62%", 2)}
      <div style={{ height: w * 0.05 }} />
      {[0, 1, 2].map((k) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: w * 0.03 }}>
          <div style={{ height: w * 0.022, width: "48%", borderRadius: 4, background: "#D9DCE4" }} />
          <div style={{ height: w * 0.022, width: "18%", borderRadius: 4, background: "#BFC4D0" }} />
        </div>
      ))}
      <div style={{ borderTop: "2px solid #11131A", marginTop: w * 0.05, paddingTop: w * 0.03, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: w * 0.05, color: "#11131A" }}>
        <span>Gesamt</span>
        <span>24.990 €</span>
      </div>
      <div
        style={{
          position: "absolute",
          right: w * 0.07,
          bottom: w * 0.08,
          background: C.red,
          color: "#fff",
          fontWeight: 700,
          fontSize: w * 0.075,
          borderRadius: w * 0.025,
          padding: `${w * 0.015}px ${w * 0.04}px`,
          opacity: frame < pdfAt ? 0 : 1,
          transform: `scale(${interpolate(stamp, [0, 1], [2.6, 1])}) rotate(-8deg)`,
          boxShadow: `0 10px 30px ${C.red}88`,
        }}
      >
        PDF
      </div>
    </div>
  );
};

export const Doc: React.FC<BeatProps> = (p) => {
  const { fps } = useVideoConfig();
  const fVertrag = p.words[wordIndex(p.words, ["kaufverträge", "kaufvertrag", "verträge"], 0)].f;
  const fRechnung = p.words[wordIndex(p.words, ["rechnungen", "rechnung"], 1)].f;
  const fPdf = p.words[wordIndex(p.words, ["pdf"], p.words.length - 1)].f;
  const pw = p.vertical ? 400 : 360;
  const docs = (
    <div style={{ position: "relative", width: pw * 2, height: pw * 1.5 }}>
      <div style={{ position: "absolute", left: "50%", top: "50%" }}>
        <Paper title="Kaufvertrag" w={pw} frame={p.frame} at={fVertrag} rot={-7} x={-pw * 0.32} pdfAt={fPdf} />
        <Paper title="Rechnung" w={pw} frame={p.frame} at={fRechnung} rot={6} x={pw * 0.32} pdfAt={fPdf} />
      </div>
    </div>
  );
  const text = (
    <BigWords
      words={p.words}
      frame={p.frame}
      width={p.vertical ? p.width - 190 : p.width * 0.44}
      maxSize={p.vertical ? 150 : 150}
      maxChars={p.vertical ? 13 : 13}
      align={p.vertical ? "center" : "left"}
      color={(w) => (norm(w.w) === "pdf" ? C.red : C.white)}
      styleFor={(_, l) => ({ transform: `scale(${pop(l, fps, 1.8)})` })}
    />
  );
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 70% 50%, #24050a 0%, ${C.black} 60%)`, justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: p.vertical ? "column" : "row", alignItems: "center", gap: p.vertical ? 90 : 60 }}>
        {text}
        {docs}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- PREIS (mit MwSt.-Hinweis) ---------------- */
export const Preis: React.FC<BeatProps> = (p) => {
  const { fps } = useVideoConfig();
  const iNum = wordIndex(p.words, [norm(BRAND.price.split(" ")[0])], 1);
  const fPrefix = p.words[0].f;
  const fNum = p.words[iNum].f;
  const fUnit = p.words[Math.min(p.words.length - 1, iNum + 2)].f;
  const a = (f: number, stiff = 220) => spring({ frame: p.frame - f, fps, config: { damping: 12, stiffness: stiff } });
  const num = a(fNum, 300);
  const unit = a(fUnit);
  const pre = a(fPrefix);
  const u = p.vertical ? 1 : 1.1;
  const ring = interpolate(p.frame - fNum, [0, 18], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, #3a0008 0%, ${C.black} 62%)`, justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          width: 760 * u,
          height: 760 * u,
          borderRadius: "50%",
          border: `6px solid ${C.red}`,
          opacity: (1 - ring) * 0.8 * (p.frame >= fNum ? 1 : 0),
          transform: `scale(${0.5 + ring * 0.9})`,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontSize: 110 * u, color: C.white, textTransform: "uppercase", opacity: p.frame < fPrefix ? 0 : 1, transform: `translateY(${(1 - pre) * -60}px)` }}>
          {BRAND.pricePrefix}
        </div>
        <div
          style={{
            fontFamily: FONT.display,
            fontSize: 380 * u,
            lineHeight: 0.95,
            color: C.white,
            opacity: p.frame < fNum ? 0 : 1,
            transform: `scale(${interpolate(num, [0, 1], [2.2, 1])})`,
            filter: `blur(${interpolate(p.frame - fNum, [0, 3], [8, 0], clamp)}px)`,
            textShadow: `0 0 80px ${C.red}AA`,
            whiteSpace: "nowrap",
          }}
        >
          {BRAND.price}
        </div>
        <div style={{ fontFamily: FONT.display, fontSize: 120 * u, color: C.red, textTransform: "uppercase", opacity: p.frame < fUnit ? 0 : 1, transform: `translateY(${(1 - unit) * 50}px)` }}>
          {p.words.slice(iNum + 2).map((w) => clean(w.w).replace(/[.,!?]$/, "")).join(" ")}
        </div>
        <div style={{ marginTop: 26 * u, fontFamily: FONT.ui, fontSize: 36 * u, color: "rgba(255,255,255,.75)", letterSpacing: "0.04em", opacity: p.frame < fNum ? 0 : 1 }}>
          {BRAND.priceNote}
        </div>
      </div>
    </AbsoluteFill>
  );
};
