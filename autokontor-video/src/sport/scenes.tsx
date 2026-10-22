// Sport-Szenen („AutoKontor Sport“): eine Komponente pro Effekt-Name in skript-sport*.txt.
import React from "react";
import { AbsoluteFill, interpolate, random, spring } from "remotion";
import { BeatProps, EASE, clamp, clean, isEmph } from "../lib";
import { BRAND, FPS, S, SFONT } from "../theme";
import { at } from "../premium/kit";
import { Excel, Ordner, Zettel } from "../premium/scenes";
import { Badge, SCheck, SlamWord, SportStage, SportTitle, Tag, ease, measure, xblur } from "./kit";

/** Maßeinheit: im Hochformat 1 = 1/1080 der Breite, im Querformat 1/1080 der Höhe. */
const unit = (p: BeatProps) => (p.vertical ? p.width / 1080 : p.height / 1080);
/** nutzbare Breite für Schrift */
const textW = (p: BeatProps) => (p.vertical ? p.width * 0.86 : Math.min(p.width * 0.62, 1240));
const sp = (frame: number, at: number, stiffness = 200, damping = 14) => spring({ frame: frame - at, fps: FPS, config: { stiffness, damping } });
const shake = (frame: number, at: number, amp: number) => {
  const l = frame - at;
  if (l < 0 || l > 12) return 0;
  return Math.sin(l * 2.7) * amp * Math.exp(-l / 4);
};

const Center: React.FC<{ children: React.ReactNode; gap?: number; style?: React.CSSProperties }> = ({ children, gap = 0, style }) => (
  <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap, ...style }}>{children}</AbsoluteFill>
);

/* ---------- 1. FEHLSTART: Zettel, Excel, Ordner fliegen durchs Bild, Wörter knallen rein ---------- */
export const Fehlstart: React.FC<BeatProps> = (p) => {
  const { frame, width: W, height: H } = p;
  const u = unit(p);
  const fu = at(p.words, "überall", 20);
  const debris = [Zettel, Excel, Ordner];
  const times = [at(p.words, "zettel", 0), at(p.words, "excel", 6), at(p.words, "ordner", 12)];
  const sx = shake(frame, fu, 14 * u);
  return (
    <SportStage tone="dark" frame={frame} width={W} height={H} seed="fs" bgWord="CHAOS">
      {/* Papierkram fliegt quer durchs Bild */}
      {Array.from({ length: 9 }).map((_, k) => {
        const kind = k % 3;
        const f0 = times[kind] + Math.floor(k / 3) * 7 - 4;
        const t = (frame - f0) / 26;
        if (t < 0 || t > 1.2) return null;
        const El = debris[kind];
        const y = H * (0.12 + random(`fy${k}`) * 0.76);
        const x = W * 1.15 - t * W * 1.5;
        const r = (random(`fr${k}`) - 0.5) * 70 + t * 90 * (k % 2 ? 1 : -1);
        return (
          <div key={k} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${r}deg) scale(${0.75 * u})`, filter: xblur(0.55), opacity: 0.85 }}>
            <El s={1} k={k} />
          </div>
        );
      })}
      <Center gap={26 * u} style={{ transform: `translateX(${sx}px)` }}>
        <div style={{ opacity: ease(frame, 0, 6) }}>
          <Tag size={34 * u} bg={S.red} color="#fff">
            FEHLSTART
          </Tag>
        </div>
        <SportTitle words={p.words} frame={frame} maxW={textW(p)} maxSize={(p.vertical ? 260 : 210) * u} maxChars={8} tone="dark" emphStyle="outline" />
      </Center>
    </SportStage>
  );
};

/* ---------- 2. AMPEL: fünf rote Startlampen – „Schluss.“ = Lichter aus, Start! ---------- */
export const Ampel: React.FC<BeatProps> = (p) => {
  const { frame, width: W, height: H, words } = p;
  const u = unit(p);
  const last = words[words.length - 1];
  const fOut = last.f;
  const w = words.map((x) => x.f);
  const onAt = [w[0] ?? 0, w[1] ?? 4, w[2] ?? 8, Math.round(((w[2] ?? 8) + fOut) / 2), fOut - 5];
  const out = frame >= fOut;
  const flash = frame < fOut ? 0 : interpolate(frame, [fOut, fOut + 8], [0.75, 0], clamp);
  const pod = (p.vertical ? 150 : 128) * u;
  const sx = shake(frame, fOut, 18 * u);
  return (
    <SportStage tone="dark" frame={frame} width={W} height={H} seed="am" streaks={out ? 16 : 4} speed={out ? 2.2 : 0.4}>
      <Center gap={50 * u} style={{ transform: `translateX(${sx}px)` }}>
        <SportTitle words={words.slice(0, -1)} frame={frame} maxW={textW(p) * 0.8} maxSize={110 * u} maxChars={18} tone="dark" />
        {/* Ampel-Brücke */}
        <div style={{ display: "flex", gap: pod * 0.16, padding: pod * 0.18, background: "linear-gradient(180deg,#22252B,#0E0F12)", borderRadius: pod * 0.18, boxShadow: "0 30px 70px rgba(0,0,0,.6), inset 0 2px 0 rgba(255,255,255,.06)" }}>
          {onAt.map((f, k) => {
            const on = frame >= f && !out;
            const glow = on ? interpolate(frame - f, [0, 3], [0.4, 1], clamp) : 0;
            return (
              <div key={k} style={{ width: pod, padding: pod * 0.1, borderRadius: pod * 0.14, background: "#050506", display: "flex", flexDirection: "column", gap: pod * 0.1 }}>
                {[0, 1].map((r) => (
                  <div
                    key={r}
                    style={{
                      width: pod * 0.8,
                      height: pod * 0.8,
                      borderRadius: "50%",
                      background: on ? `radial-gradient(circle at 40% 35%, #FFB3B8 0%, ${S.red} 45%, #8A0010 100%)` : "radial-gradient(circle at 40% 35%, #2A2C31 0%, #121316 80%)",
                      boxShadow: on ? `0 0 ${pod * 0.5 * glow}px ${pod * 0.12}px rgba(255,43,58,${0.55 * glow})` : "inset 0 4px 10px rgba(0,0,0,.6)",
                    }}
                  />
                ))}
              </div>
            );
          })}
        </div>
        <div style={{ height: (p.vertical ? 230 : 190) * u, display: "flex", alignItems: "center" }}>
          {out && <SlamWord text={clean(last.w).toUpperCase()} at={fOut} frame={frame} size={(p.vertical ? 230 : 190) * u} color={S.volt} />}
        </div>
      </Center>
      <AbsoluteFill style={{ background: S.volt, opacity: flash, mixBlendMode: "screen" }} />
    </SportStage>
  );
};

/* ---------- 3. TEAMLOGO: Neongelb, Abzeichen knallt rein, Name mit Bewegungs-Spur ---------- */
export const Teamlogo: React.FC<BeatProps> = (p) => {
  const { frame, width: W, height: H } = p;
  const u = unit(p);
  const fa = at(p.words, "autokontor", 6);
  const b = sp(frame, fa - 3, 260, 13);
  const t = ease(frame, fa, 7);
  const size = Math.min((p.vertical ? 210 : 230) * u, (textW(p) * 0.94 * 100) / measure("AUTOKONTOR", 100));
  return (
    <SportStage tone="volt" frame={frame} width={W} height={H} seed="tl" streaks={16} speed={1.8}>
      <Center gap={30 * u}>
        <div style={{ opacity: ease(frame, 0, 5), transform: `translateX(${(1 - ease(frame, 0, 7)) * 200}px)` }}>
          <Tag size={44 * u} bg={S.black} color={S.volt}>
            DAS IST
          </Tag>
        </div>
        <div style={{ transform: `scale(${0.3 + 0.7 * b}) rotate(${(1 - b) * -40}deg)`, opacity: frame >= fa - 3 ? 1 : 0 }}>
          <Badge s={250 * u} />
        </div>
        <div style={{ position: "relative", height: size * 0.95 }}>
          {[4, 3, 2, 1, 0].map((k) => (
            <div
              key={k}
              style={{
                position: k ? "absolute" : "relative",
                left: 0,
                top: 0,
                fontFamily: SFONT.head,
                fontStyle: "italic",
                fontWeight: 900,
                fontSize: size,
                lineHeight: 0.95,
                whiteSpace: "nowrap",
                color: S.black,
                opacity: frame < fa ? 0 : k ? (0.22 - k * 0.04) * (1 - t * 0.6) : 1,
                transform: `translateX(${(1 - t) * W * 0.7 - k * size * 0.35 * (1 - t * 0.7)}px) skewX(${(1 - t) * -18}deg)`,
                filter: k ? xblur(0.5) : xblur(1 - t),
              }}
            >
              AUTOKONTOR
            </div>
          ))}
        </div>
      </Center>
    </SportStage>
  );
};

/** Auto in Seitenansicht mit drehenden Rädern. */
const Car: React.FC<{ w: number; kind: "suv" | "kompakt"; color: string; frame: number }> = ({ w, kind, color, frame }) => {
  const body =
    kind === "suv"
      ? "M8 64 L10 44 Q12 37 22 35 L50 31 L72 13 Q77 9 86 9 L142 9 Q150 9 154 15 L168 33 L184 37 Q193 39 193 48 L193 66 Z"
      : "M14 66 L16 48 Q18 41 28 39 L56 35 L82 18 Q87 14 95 14 L132 14 Q140 14 145 21 L160 39 Q176 42 180 49 L181 66 Z";
  const win = kind === "suv" ? "M80 15 L140 15 L152 31 L64 31 Z" : "M88 20 L131 20 L144 36 L68 36 Z";
  const wheels = kind === "suv" ? [52, 156] : [52, 148];
  return (
    <svg viewBox="0 0 200 90" width={w} height={w * 0.45} style={{ overflow: "visible" }}>
      <path d={body} fill={color} />
      <path d={win} fill="rgba(0,0,0,.35)" />
      <path d={kind === "suv" ? "M20 50 H186" : "M26 54 H176"} stroke="rgba(0,0,0,.18)" strokeWidth={2.5} />
      {wheels.map((cx) => (
        <g key={cx} transform={`translate(${cx} 68)`}>
          <circle r={15} fill="#0B0C0E" />
          <circle r={8} fill="#C9CDD4" />
          <g transform={`rotate(${frame * 38})`}>
            {[0, 72, 144, 216, 288].map((a) => (
              <rect key={a} x={-1.4} y={-8} width={2.8} height={8} fill="#5E636C" transform={`rotate(${a})`} />
            ))}
          </g>
        </g>
      ))}
    </svg>
  );
};

/* ---------- 4. DUELL: großes und kleines Auto im Rennen, Spuren auf der Strecke ---------- */
export const Duell: React.FC<BeatProps> = (p) => {
  const { frame, width: W, height: H, words } = p;
  const u = unit(p);
  const fg = at(words, "große", 8);
  const fk = at(words, "kleine", 14);
  const fa = at(words, "autohändler", 20);
  const lane = (p.vertical ? 250 : 210) * u;
  const cy = H * (p.vertical ? 0.5 : 0.53);
  const enter = ease(frame, 0, 10);
  const head = words.filter((w) => w.f < fg && !isEmph(w.w));
  const lane_ = (y: number, kind: "suv" | "kompakt", label: string, f: number, color: string, bob: number) => {
    const cw = (kind === "suv" ? 560 : 400) * u * (p.vertical ? 1 : 0.95);
    const x = W * 0.5 - cw * 0.5 + (1 - enter) * -W * 0.8 + Math.sin((frame + bob) / 9) * 8 * u;
    const lt = sp(frame, f, 240, 14);
    return (
      <React.Fragment key={label}>
        {/* Tempo-Spur hinter dem Auto */}
        <div style={{ position: "absolute", left: x - W * 0.6, top: y - cw * 0.12, width: W * 0.62, height: cw * 0.2, background: `linear-gradient(90deg, transparent, ${color}55)`, filter: "blur(6px)" }} />
        <div style={{ position: "absolute", left: x, top: y - cw * 0.45 + Math.sin((frame + bob) / 3) * 1.5 * u, filter: xblur(1 - enter) }}>
          <Car w={cw} kind={kind} color={color} frame={frame} />
        </div>
        <div style={{ position: "absolute", left: x + cw * 0.5, top: y - cw * 0.45 - 70 * u, transform: `translateX(-50%) scale(${lt})`, opacity: frame >= f ? 1 : 0 }}>
          <Tag size={40 * u} bg={color === S.volt ? S.volt : S.white} color={S.black}>
            {label}
          </Tag>
        </div>
      </React.Fragment>
    );
  };
  return (
    <SportStage tone="dark" frame={frame} width={W} height={H} seed="du" streaks={14} speed={2}>
      {/* Strecke */}
      <div style={{ position: "absolute", left: 0, right: 0, top: cy - lane * 1.15, height: lane * 2.3, background: "linear-gradient(180deg, #1B1D22, #121317)", borderTop: `4px solid ${S.white}22`, borderBottom: `4px solid ${S.white}22` }} />
      {Array.from({ length: 12 }).map((_, k) => {
        const span = W + 400;
        const x = (((k * span) / 12 - frame * 42) % span + span) % span - 200;
        return <div key={k} style={{ position: "absolute", left: x, top: cy - 5 * u, width: 140 * u, height: 10 * u, background: S.white, opacity: 0.55, transform: "skewX(-20deg)" }} />;
      })}
      {lane_(cy - lane * 0.18, "suv", "GROSS", fg, S.white, 0)}
      {lane_(cy + lane * 1.02, "kompakt", "KLEIN", fk, S.volt, 20)}
      <div style={{ position: "absolute", left: 0, right: 0, top: H * (p.vertical ? 0.13 : 0.08), display: "flex", justifyContent: "center" }}>
        <SportTitle words={head} frame={frame} maxW={textW(p) * 0.8} maxSize={96 * u} maxChars={20} tone="dark" />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: H * (p.vertical ? 0.12 : 0.06), display: "flex", justifyContent: "center" }}>
        <SlamWord text="AUTOHÄNDLER." at={fa} frame={frame} size={Math.min((p.vertical ? 190 : 160) * u, (textW(p) * 100) / measure("AUTOHÄNDLER.", 100))} color={S.volt} />
      </div>
    </SportStage>
  );
};

/* ---------- 5. TABELLE: Zeitentabelle wie im Motorsport – jede Zeile kommt beim Wort ---------- */
export const Tabelle: React.FC<BeatProps> = (p) => {
  const { frame, width: W, height: H, words } = p;
  const u = unit(p);
  const fp = at(words, "pdf", Math.max(0, p.dur - 14));
  const rows = [
    { name: "FAHRZEUGE", f: at(words, "fahrzeuge", 0), pdf: false },
    { name: "KUNDEN", f: at(words, "kunden", 6), pdf: false },
    { name: "KAUFVERTRÄGE", f: at(words, "kaufverträge", 12), pdf: true },
    { name: "RECHNUNGEN", f: at(words, "rechnungen", 18), pdf: true },
  ];
  const pw = (p.vertical ? 940 : 1000) * u;
  const rh = (p.vertical ? 142 : 120) * u;
  const pdfFlash = interpolate(frame, [fp, fp + 10], [1, 0], clamp);
  return (
    <SportStage tone="dark" frame={frame} width={W} height={H} seed="tb" bgWord="LIVE">
      <Center>
        <div style={{ width: pw, transform: `translateX(${(1 - ease(frame, 0, 8)) * -W * 0.4}px)`, filter: xblur(1 - ease(frame, 0, 8)) }}>
          {/* Kopf */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: S.black, borderLeft: `${14 * u}px solid ${S.volt}`, padding: `${18 * u}px ${28 * u}px`, transform: "skewX(-10deg)", boxShadow: "0 20px 50px rgba(0,0,0,.5)" }}>
            <div style={{ transform: "skewX(10deg)", fontFamily: SFONT.head, fontStyle: "italic", fontWeight: 900, fontSize: 54 * u, color: S.white, letterSpacing: "0.02em" }}>
              AUTOKONTOR <span style={{ color: S.volt }}>LIVE</span>
            </div>
            <div style={{ transform: "skewX(10deg)", display: "flex", alignItems: "center", gap: 12 * u, fontFamily: SFONT.head, fontWeight: 700, fontSize: 32 * u, color: S.grey, letterSpacing: "0.12em" }}>
              <div style={{ width: 18 * u, height: 18 * u, borderRadius: "50%", background: S.red, opacity: 0.5 + 0.5 * Math.round((Math.sin(frame / 5) + 1) / 2) }} />
              ALLES DRIN
            </div>
          </div>
          {rows.map((r, k) => {
            const t = ease(frame, r.f - 2, 7);
            const ch = sp(frame, r.pdf ? fp + k * 3 : r.f + 6, 260, 14);
            return (
              <div
                key={r.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: rh,
                  marginTop: 10 * u,
                  background: k % 2 ? "rgba(255,255,255,.06)" : "rgba(255,255,255,.1)",
                  transform: `translateX(${(1 - t) * -pw * 0.8}px) skewX(-10deg)`,
                  filter: xblur(1 - t),
                  opacity: frame >= r.f - 2 ? 1 : 0,
                }}
              >
                <div style={{ width: rh, height: "100%", background: S.white, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ transform: "skewX(10deg)", fontFamily: SFONT.head, fontStyle: "italic", fontWeight: 900, fontSize: rh * 0.62, color: S.black }}>{k + 1}</div>
                </div>
                <div style={{ width: 12 * u, height: "100%", background: S.volt }} />
                <div style={{ flex: 1, paddingLeft: 30 * u, transform: "skewX(10deg)", fontFamily: SFONT.head, fontStyle: "italic", fontWeight: 900, fontSize: rh * 0.52, color: S.white, whiteSpace: "nowrap" }}>{r.name}</div>
                <div style={{ paddingRight: 30 * u, transform: "skewX(10deg)" }}>
                  {r.pdf ? (
                    <div style={{ transform: `scale(${ch})`, background: S.volt, color: S.black, fontFamily: SFONT.head, fontStyle: "italic", fontWeight: 900, fontSize: rh * 0.36, padding: `${6 * u}px ${18 * u}px`, boxShadow: `0 0 ${30 * pdfFlash * u}px ${S.volt}` }}>PDF</div>
                  ) : (
                    <SCheck s={rh * 0.5} p={ch} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Center>
    </SportStage>
  );
};

/* ---------- 6. BOXENSTOPP: „mit wenigen Klicks“ – Knopf, Klick, Klick, fertig ---------- */
export const Boxenstopp: React.FC<BeatProps> = (p) => {
  const { frame, width: W, height: H, words } = p;
  const u = unit(p);
  const fk = at(words, "klicks", 8);
  const clicks = [fk, fk + 7];
  const done = fk + 14;
  const bs = (p.vertical ? 330 : 280) * u;
  const press = clicks.reduce((m, c) => Math.max(m, interpolate(frame - c, [0, 2, 6], [0, 1, 0], clamp)), 0);
  const cur = ease(frame, 0, Math.max(6, fk - 2));
  const ok = sp(frame, done, 240, 12);
  return (
    <SportStage tone="volt" frame={frame} width={W} height={H} seed="bx" streaks={12} speed={1.6}>
      <Center gap={50 * u}>
        <SportTitle words={words} frame={frame} maxW={textW(p)} maxSize={(p.vertical ? 190 : 170) * u} maxChars={11} tone="volt" />
        <div style={{ position: "relative", width: bs * 1.9, height: bs }}>
          {/* Wellen */}
          {clicks.map((c, k) => {
            const l = frame - c;
            if (l < 0 || l > 18) return null;
            const r = interpolate(l, [0, 18], [0.5, 1.6]);
            return <div key={k} style={{ position: "absolute", left: "50%", top: "50%", width: bs * 1.9 * r, height: bs * r, borderRadius: bs, border: `${6 * u}px solid ${S.black}`, opacity: 1 - l / 18, transform: "translate(-50%,-50%)" }} />;
          })}
          <div style={{ position: "absolute", inset: 0, borderRadius: bs, background: `linear-gradient(180deg, #2A2D34, ${S.black})`, boxShadow: `0 ${30 * (1 - press) * u}px ${60 * u}px rgba(0,0,0,.45)`, transform: `scale(${1 - press * 0.06})`, display: "flex", alignItems: "center", justifyContent: "center", gap: 24 * u }}>
            {frame >= done ? (
              <div style={{ display: "flex", alignItems: "center", gap: 20 * u, transform: `scale(${ok})` }}>
                <SCheck s={bs * 0.42} p={ok} bg={S.volt} />
                <div style={{ fontFamily: SFONT.head, fontStyle: "italic", fontWeight: 900, fontSize: bs * 0.34, color: S.volt }}>PDF FERTIG</div>
              </div>
            ) : (
              <div style={{ fontFamily: SFONT.head, fontStyle: "italic", fontWeight: 900, fontSize: bs * 0.3, color: S.white, letterSpacing: "0.02em" }}>PDF ERSTELLEN</div>
            )}
          </div>
          {/* Mauszeiger */}
          <svg viewBox="0 0 24 24" width={110 * u} height={110 * u} style={{ position: "absolute", left: interpolate(cur, [0, 1], [bs * 2.6, bs * 1.25]), top: interpolate(cur, [0, 1], [bs * 1.4, bs * 0.55]) + press * 6 * u, filter: "drop-shadow(0 8px 10px rgba(0,0,0,.35))" }}>
            <path d="M4 2 L4 20 L9 15 L12.5 22 L15.5 20.6 L12 14 L19 14 Z" fill={S.white} stroke={S.black} strokeWidth={1.4} strokeLinejoin="round" />
          </svg>
        </div>
      </Center>
    </SportStage>
  );
};

/* ---------- 7. SEKTOREN: drei Zeitsektoren werden grün – E-Rechnung, ZUGFeRD, XRechnung ---------- */
export const Sektoren: React.FC<BeatProps> = (p) => {
  const { frame, width: W, height: H, words } = p;
  const u = unit(p);
  const secs = [
    { label: "E-RECHNUNG", f: at(words, "e-rechnung", 6) },
    { label: "ZUGFeRD", f: at(words, "zugferd", 12) },
    { label: "XRECHNUNG", f: at(words, "xrechnung", 18) },
  ];
  const head = words.filter((w) => w.f < secs[0].f);
  const bw = (p.vertical ? 900 : 980) * u;
  const bh = (p.vertical ? 170 : 140) * u;
  const all = frame >= secs[2].f + 8;
  return (
    <SportStage tone="dark" frame={frame} width={W} height={H} seed="sk" bgWord="SEKTOR">
      <Center gap={26 * u}>
        <div style={{ marginBottom: 20 * u }}>
          <SportTitle words={head} frame={frame} maxW={textW(p) * 0.7} maxSize={130 * u} maxChars={10} tone="dark" />
        </div>
        {secs.map((s, k) => {
          const enter = ease(frame, k * 3, 8);
          const fill = ease(frame, s.f, 8);
          const c = all ? S.volt : S.green;
          return (
            <div key={s.label} style={{ position: "relative", width: bw, height: bh, transform: `translateX(${(1 - enter) * W * 0.6}px) skewX(-12deg)`, filter: xblur(1 - enter), background: "#22252C", overflow: "hidden", boxShadow: "0 16px 40px rgba(0,0,0,.4)" }}>
              <div style={{ position: "absolute", inset: 0, width: `${fill * 100}%`, background: `linear-gradient(90deg, ${c}, ${c}CC)` }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: `0 ${40 * u}px`, transform: "skewX(12deg)", gap: 30 * u }}>
                <div style={{ fontFamily: SFONT.head, fontStyle: "italic", fontWeight: 800, fontSize: bh * 0.34, color: fill > 0.5 ? S.black : S.grey, letterSpacing: "0.08em", width: bh * 0.55 }}>S{k + 1}</div>
                <div style={{ flex: 1, fontFamily: SFONT.head, fontStyle: "italic", fontWeight: 900, fontSize: bh * 0.56, color: fill > 0.5 ? S.black : S.white, whiteSpace: "nowrap" }}>{s.label}</div>
                <SCheck s={bh * 0.48} p={sp(frame, s.f + 4, 260, 13)} bg={S.black} fg={c} />
              </div>
            </div>
          );
        })}
      </Center>
    </SportStage>
  );
};

/* ---------- 8. HEIMSPIEL: Flutlicht, Rechner mit Schloss – deine Daten bleiben bei dir ---------- */
export const Heimspiel: React.FC<BeatProps> = (p) => {
  const { frame, width: W, height: H, words } = p;
  const u = unit(p);
  const fd = at(words, "deinem", 10);
  const ms = (p.vertical ? 560 : 470) * u;
  const lock = sp(frame, fd, 220, 12);
  const on = ease(frame, 0, 10);
  return (
    <SportStage tone="dark" frame={frame} width={W} height={H} seed="hs" streaks={5} speed={0.6}>
      {/* Flutlicht */}
      {[-1, 1].map((s) => (
        <div key={s} style={{ position: "absolute", left: s < 0 ? -W * 0.25 : W * 0.25, top: -H * 0.1, width: W, height: H * 0.9, background: `conic-gradient(from ${s < 0 ? 135 : 195}deg at ${s < 0 ? 20 : 80}% ${p.vertical ? 14 : 18}%, transparent 0deg, rgba(230,255,170,${0.13 * on}) 14deg, transparent 30deg)`, filter: "blur(8px)" }} />
      ))}
      {[-1, 1].map((s) => (
        <div key={`l${s}`} style={{ position: "absolute", top: H * (p.vertical ? 0.12 : 0.15), left: s < 0 ? W * 0.06 : W * 0.94 - 118 * u, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 * u, opacity: on }}>
          {Array.from({ length: 8 }).map((_, k) => (
            <div key={k} style={{ width: 22 * u, height: 22 * u, borderRadius: 4 * u, background: "#FAFFE6", boxShadow: `0 0 ${24 * u}px #F2FFB0` }} />
          ))}
        </div>
      ))}
      <Center gap={44 * u}>
        <Tag size={36 * u}>HEIMSPIEL</Tag>
        <div style={{ position: "relative", width: ms, height: ms * 0.66 }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 22 * u, border: `${10 * u}px solid ${S.white}`, background: "linear-gradient(160deg,#20232A,#111215)", boxShadow: `0 0 ${60 * lock * u}px rgba(212,255,31,.25)` }} />
          <div style={{ position: "absolute", left: "50%", bottom: -ms * 0.12, width: ms * 0.3, height: ms * 0.12, transform: "translateX(-50%)", background: S.white, clipPath: "polygon(30% 0, 70% 0, 100% 100%, 0 100%)" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 100 100" width={ms * 0.42} height={ms * 0.42} style={{ transform: `scale(${0.3 + 0.7 * lock})`, opacity: frame >= fd ? 1 : 0.15 }}>
              <path d="M50 6 L86 20 V48 Q86 76 50 94 Q14 76 14 48 V20 Z" fill={S.volt} />
              <rect x={34} y={46} width={32} height={26} rx={4} fill={S.black} />
              <path d="M40 46 V38 Q40 28 50 28 Q60 28 60 38 V46" fill="none" stroke={S.black} strokeWidth={6} />
            </svg>
          </div>
        </div>
        <SportTitle words={words} frame={frame} maxW={textW(p)} maxSize={(p.vertical ? 130 : 110) * u} maxChars={16} tone="dark" />
      </Center>
    </SportStage>
  );
};

/* ---------- 9. ROTE KARTE: die Cloud fliegt vom Platz ---------- */
export const Rotekarte: React.FC<BeatProps> = (p) => {
  const { frame, width: W, height: H, words } = p;
  const u = unit(p);
  const fc = at(words, "cloud", 8);
  const card = sp(frame, fc - 2, 230, 12);
  const off = interpolate(frame, [fc + 8, fc + 24], [0, 1], { ...clamp, easing: EASE });
  const cs = (p.vertical ? 520 : 440) * u;
  const sx = shake(frame, fc, 16 * u);
  return (
    <SportStage tone="dark" frame={frame} width={W} height={H} seed="rk">
      <Center gap={40 * u} style={{ transform: `translateX(${sx}px)` }}>
        <div style={{ opacity: ease(frame, fc, 6), transform: `scale(${0.6 + 0.4 * card})` }}>
          <Tag size={40 * u} bg={S.red} color="#fff">
            ROTE KARTE
          </Tag>
        </div>
        <div style={{ position: "relative", width: cs * 1.3, height: cs * 0.85 }}>
          {/* Cloud */}
          <svg viewBox="0 0 200 120" width={cs} height={cs * 0.6} style={{ position: "absolute", left: cs * 0.05, top: cs * 0.12, transform: `translate(${off * -W * 0.9}px, ${Math.sin(frame / 10) * 6 * u}px) rotate(${off * -25}deg)`, opacity: 1 - off * 0.6, filter: xblur(off) }}>
            <path d="M50 100 Q14 100 14 72 Q14 46 42 44 Q48 14 82 14 Q112 14 122 40 Q130 34 142 34 Q170 34 172 62 Q190 66 190 82 Q190 100 166 100 Z" fill="none" stroke={S.white} strokeWidth={8} strokeLinejoin="round" />
          </svg>
          {/* Rote Karte */}
          <div
            style={{
              position: "absolute",
              right: 0,
              top: -cs * 0.08,
              width: cs * 0.42,
              height: cs * 0.6,
              borderRadius: 14 * u,
              background: `linear-gradient(160deg, #FF5A66, ${S.red} 45%, #C80F1E)`,
              boxShadow: "0 30px 60px rgba(0,0,0,.55), inset 0 2px 0 rgba(255,255,255,.35)",
              transform: `translateY(${(1 - card) * H * 0.6}px) rotate(${-8 + (1 - card) * 30}deg)`,
              opacity: frame >= fc - 2 ? 1 : 0,
            }}
          />
        </div>
        <SportTitle words={words} frame={frame} maxW={textW(p)} maxSize={(p.vertical ? 190 : 160) * u} maxChars={12} tone="dark" emphColor={S.red} />
      </Center>
    </SportStage>
  );
};

/* ---------- 10. SERIE: Trainings-Serie – Ring schließt sich, jeder Tag abgehakt ---------- */
export const Serie: React.FC<BeatProps> = (p) => {
  const { frame, width: W, height: H, words, dur } = p;
  const u = unit(p);
  const days = ["MO", "DI", "MI", "DO", "FR", "SA", "SO"];
  const ring = interpolate(frame, [4, Math.max(10, dur - 10)], [0, 1], { ...clamp, easing: EASE });
  const rs = (p.vertical ? 420 : 340) * u;
  const R = 42;
  const done = ring > 0.995;
  const pop = done ? sp(frame, Math.max(10, dur - 10), 260, 12) : 0;
  return (
    <SportStage tone="light" frame={frame} width={W} height={H} seed="se" bgWord="JEDEN TAG">
      <Center gap={40 * u}>
        <div style={{ position: "relative", width: rs, height: rs, transform: `scale(${1 + pop * 0.06 - (done ? 0.06 : 0)})` }}>
          <svg viewBox="0 0 100 100" width={rs} height={rs} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={50} cy={50} r={R} fill="none" stroke="rgba(0,0,0,.08)" strokeWidth={11} />
            <circle cx={50} cy={50} r={R} fill="none" stroke={S.black} strokeWidth={11} strokeLinecap="round" strokeDasharray={2 * Math.PI * R} strokeDashoffset={2 * Math.PI * R * (1 - ring)} />
            <circle cx={50} cy={50} r={R} fill="none" stroke={S.volt} strokeWidth={6} strokeLinecap="round" strokeDasharray={2 * Math.PI * R} strokeDashoffset={2 * Math.PI * R * (1 - ring)} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" width={rs * 0.36} height={rs * 0.36} style={{ transform: `rotate(${ring * 360}deg)` }}>
              <path d="M20 12 A8 8 0 1 1 17.7 6.3" fill="none" stroke={S.black} strokeWidth={2.6} strokeLinecap="round" />
              <path d="M18.5 2.5 V7 H14" fill="none" stroke={S.black} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 * u }}>
          {days.map((d, k) => {
            const f = 6 + k * Math.max(2, (dur - 22) / 7);
            const t = sp(frame, f, 280, 14);
            const on = frame >= f;
            return (
              <div key={d} style={{ width: (p.vertical ? 116 : 104) * u, height: (p.vertical ? 132 : 118) * u, transform: `skewX(-10deg) scale(${0.85 + 0.15 * t})`, background: on ? S.black : "rgba(0,0,0,.07)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 * u }}>
                <div style={{ transform: "skewX(10deg)", fontFamily: SFONT.head, fontStyle: "italic", fontWeight: 800, fontSize: 34 * u, color: on ? S.white : S.grey }}>{d}</div>
                <div style={{ transform: "skewX(10deg)" }}>
                  <SCheck s={40 * u} p={on ? t : 0} bg={S.volt} />
                </div>
              </div>
            );
          })}
        </div>
        <SportTitle words={words} frame={frame} maxW={textW(p)} maxSize={(p.vertical ? 130 : 110) * u} maxChars={13} tone="light" />
      </Center>
    </SportStage>
  );
};

/** Trikot (Rückseite) mit Name und Nummer. */
const Trikot: React.FC<{ w: number; name: string; num: string; bg: string; fg: string; stroke?: string }> = ({ w, name, num, bg, fg, stroke }) => (
  <div style={{ position: "relative", width: w, height: w * 1.1 }}>
    <svg viewBox="0 0 200 220" width={w} height={w * 1.1} style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 24px 30px rgba(0,0,0,.45))" }}>
      <path d="M62 8 Q100 26 138 8 L192 40 L172 88 L150 78 L150 212 L50 212 L50 78 L28 88 L8 40 Z" fill={bg} stroke={stroke ?? "none"} strokeWidth={stroke ? 5 : 0} strokeLinejoin="round" />
      <path d="M62 8 Q100 30 138 8" fill="none" stroke={fg} strokeOpacity={0.5} strokeWidth={5} />
    </svg>
    <div style={{ position: "absolute", left: 0, right: 0, top: w * 0.2, textAlign: "center", fontFamily: SFONT.head, fontStyle: "italic", fontWeight: 900, color: fg, lineHeight: 1 }}>
      <div style={{ fontSize: w * (name.length > 6 ? 0.13 : 0.16), letterSpacing: "0.06em" }}>{name}</div>
      <div style={{ fontSize: w * 0.46, marginTop: w * 0.02 }}>{num}</div>
    </div>
  </div>
);

/* ---------- 11. TRIKOTS: ein Team – Windows, Mac und Linux ---------- */
export const Trikots: React.FC<BeatProps> = (p) => {
  const { frame, width: W, height: H, words } = p;
  const u = unit(p);
  const team = [
    { name: "WINDOWS", num: "01", f: at(words, "windows", 4), bg: S.white, fg: S.black },
    { name: "MAC", num: "02", f: at(words, "mac", 10), bg: S.volt, fg: S.black },
    { name: "LINUX", num: "03", f: at(words, "linux", 16), bg: S.black, fg: S.volt, stroke: S.volt },
  ];
  const tw = (p.vertical ? 320 : 330) * u;
  return (
    <SportStage tone="dark" frame={frame} width={W} height={H} seed="tr" bgWord="TEAM">
      <Center gap={60 * u}>
        <SportTitle words={words.filter((w) => w.f < team[0].f)} frame={frame} maxW={textW(p) * 0.5} maxSize={140 * u} maxChars={10} tone="dark" />
        <div style={{ display: "flex", gap: (p.vertical ? 4 : 40) * u, alignItems: "flex-end" }}>
          {team.map((t, k) => {
            const s = sp(frame, t.f - 2, 230, 13);
            return (
              <div key={t.name} style={{ transform: `translateY(${(1 - s) * -H * 0.7}px) rotate(${(1 - s) * (k - 1) * 20 + (k - 1) * 4}deg)`, opacity: frame >= t.f - 2 ? 1 : 0, marginTop: k === 1 ? -50 * u : 0 }}>
                <Trikot w={tw} name={t.name} num={t.num} bg={t.bg} fg={t.fg} stroke={t.stroke} />
              </div>
            );
          })}
        </div>
      </Center>
    </SportStage>
  );
};

/* ---------- 12. STARTNUMMER: Preis als Startnummer auf der Rennwagen-Tür ---------- */
export const Startnummer: React.FC<BeatProps> = (p) => {
  const { frame, width: W, height: H, words } = p;
  const u = unit(p);
  const fn = at(words, "19", 4);
  const fm = at(words, "monat", 14);
  const r = sp(frame, fn - 2, 220, 12);
  const rs = (p.vertical ? 600 : 500) * u;
  const sx = shake(frame, fn, 12 * u);
  return (
    <SportStage tone="light" frame={frame} width={W} height={H} seed="sn" streaks={8} speed={1.4}>
      {/* Renn-Lackierung: schräge Streifen */}
      {[
        { c: S.volt, w: 0.34, x: -0.05 },
        { c: S.black, w: 0.08, x: 0.33 },
      ].map((s, k) => (
        <div key={k} style={{ position: "absolute", top: -H * 0.2, left: W * s.x + (1 - ease(frame, k * 2, 10)) * W, width: W * s.w, height: H * 1.4, background: s.c, transform: "skewX(-20deg)" }} />
      ))}
      <Center gap={24 * u} style={{ transform: `translateX(${sx}px)` }}>
        <div style={{ opacity: ease(frame, 0, 5) }}>
          <Tag size={50 * u} bg={S.black} color={S.volt}>
            AB
          </Tag>
        </div>
        <div style={{ width: rs, height: rs, borderRadius: "50%", background: S.white, border: `${18 * u}px solid ${S.black}`, boxShadow: "0 40px 80px rgba(0,0,0,.3)", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${r}) rotate(${(1 - r) * -50}deg)`, opacity: frame >= fn - 2 ? 1 : 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", fontFamily: SFONT.head, fontStyle: "italic", fontWeight: 900, color: S.black, lineHeight: 0.85 }}>
            <span style={{ fontSize: rs * 0.56, letterSpacing: "-0.03em" }}>19</span>
            <span style={{ fontSize: rs * 0.24, marginTop: rs * 0.05, marginLeft: rs * 0.02 }}>€</span>
          </div>
        </div>
        <div style={{ height: 130 * u, display: "flex", alignItems: "center", gap: 22 * u }}>
          {words
            .filter((w) => w.f >= fm - 6 && isEmph(w.w))
            .map((w) => (
              <SlamWord key={w.i} text={clean(w.w).toUpperCase().replace(",", "")} at={w.f} frame={frame} size={120 * u} color={S.black} />
            ))}
        </div>
        <div style={{ fontFamily: SFONT.ui, fontWeight: 700, fontSize: 40 * u, color: "#2A2C31", background: "rgba(255,255,255,.85)", padding: `${6 * u}px ${20 * u}px`, borderRadius: 8 * u, opacity: ease(frame, fn + 4, 8) }}>{BRAND.priceNote}</div>
      </Center>
    </SportStage>
  );
};

/* ---------- 13. FLEX: Schalter auf „monatlich kündbar“ ---------- */
export const Flex: React.FC<BeatProps> = (p) => {
  const { frame, width: W, height: H, words } = p;
  const u = unit(p);
  const fk = at(words, "kündbar", 6);
  const t = sp(frame, fk, 260, 15);
  const sw = (p.vertical ? 420 : 360) * u;
  return (
    <SportStage tone="dark" frame={frame} width={W} height={H} seed="fx" bgWord="FLEX">
      <Center gap={60 * u}>
        <SportTitle words={words} frame={frame} maxW={textW(p)} maxSize={(p.vertical ? 200 : 170) * u} maxChars={10} tone="dark" />
        <div style={{ width: sw, height: sw * 0.48, borderRadius: sw, background: t > 0.5 ? S.volt : "#2A2D34", boxShadow: `inset 0 4px 12px rgba(0,0,0,.35), 0 0 ${80 * t * u}px rgba(212,255,31,.35)`, position: "relative" }}>
          <div style={{ position: "absolute", top: sw * 0.05, left: sw * 0.05 + t * sw * 0.52, width: sw * 0.38, height: sw * 0.38, borderRadius: "50%", background: S.white, boxShadow: "0 8px 18px rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <SCheck s={sw * 0.22} p={t} bg={S.black} fg={S.volt} />
          </div>
        </div>
        <div style={{ fontFamily: SFONT.ui, fontWeight: 700, fontSize: 36 * u, color: "#C9CDD4", opacity: ease(frame, fk + 6, 8) }}>
          {BRAND.pricePrefix} {BRAND.price} {BRAND.priceUnit} <span style={{ fontWeight: 400 }}>{BRAND.priceNote}</span>
        </div>
      </Center>
    </SportStage>
  );
};

/* ---------- 14. ZIELFLAGGE: wehende Zielflagge, Logo, Button ---------- */
export const Zielflagge: React.FC<BeatProps> = (p) => {
  const { frame, width: W, height: H } = p;
  const u = unit(p);
  const cols = p.vertical ? 12 : 20;
  const rows = p.vertical ? 6 : 4;
  const cell = W / cols;
  const fh = cell * rows;
  const flagIn = ease(frame, 0, 10);
  const logo = sp(frame, 3, 200, 13);
  const cta = sp(frame, 9, 180, 13);
  const pulse = 1 + Math.sin(frame / 6) * 0.02;
  const shine = ((frame * 2.2) % 220) - 60;
  return (
    <SportStage tone="dark" frame={frame} width={W} height={H} seed="zf" streaks={6} speed={0.8}>
      {/* Zielflagge */}
      <svg width={W} height={fh * 1.3} style={{ position: "absolute", left: 0, top: (p.vertical ? H * 0.04 : -fh * 0.25) + (1 - flagIn) * -fh * 1.4 }}>
        {Array.from({ length: cols * rows }).map((_, k) => {
          const c = k % cols;
          const r = Math.floor(k / cols);
          const wave = Math.sin(c * 0.7 - frame * 0.25) * cell * 0.22;
          const shade = 0.75 + 0.25 * Math.cos(c * 0.7 - frame * 0.25);
          const black = (c + r) % 2 === 0;
          return <rect key={k} x={c * cell} y={r * cell + wave + cell * 0.2} width={cell + 1} height={cell + 1} fill={black ? S.black : `rgba(${Math.round(246 * shade)},${Math.round(247 * shade)},${Math.round(242 * shade)},1)`} />;
        })}
      </svg>
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: p.vertical ? "flex-end" : "flex-start", paddingBottom: p.vertical ? H * 0.16 : 0, paddingTop: p.vertical ? 0 : fh * 0.92, gap: (p.vertical ? 26 : 18) * u }}>
        <div style={{ display: "flex", alignItems: "center", gap: 30 * u, transform: `scale(${logo})` }}>
          <Badge s={150 * u} dark={false} />
          <div style={{ fontFamily: SFONT.head, fontStyle: "italic", fontWeight: 900, fontSize: 150 * u, color: S.white, lineHeight: 0.9 }}>{BRAND.name.toUpperCase()}</div>
        </div>
        <div style={{ fontFamily: SFONT.head, fontStyle: "italic", fontWeight: 600, fontSize: 48 * u, color: "#C9CDD4", letterSpacing: "0.04em", opacity: ease(frame, 6, 8) }}>
          DEIN HANDEL. <span style={{ color: S.volt }}>IN DEINER HAND.</span>
        </div>
        <div style={{ marginTop: 20 * u, transform: `scale(${cta * pulse}) skewX(-10deg)`, background: S.volt, padding: `${30 * u}px ${54 * u}px`, boxShadow: `0 24px 60px rgba(212,255,31,.35)`, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 26 * u }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: `${shine}%`, width: "18%", background: "linear-gradient(100deg, rgba(255,255,255,0), rgba(255,255,255,.7), rgba(255,255,255,0))" }} />
          <div style={{ transform: "skewX(10deg)", fontFamily: SFONT.head, fontStyle: "italic", fontWeight: 900, fontSize: 64 * u, color: S.black, whiteSpace: "nowrap", position: "relative" }}>JETZT 7 TAGE KOSTENLOS TESTEN</div>
          <svg viewBox="0 0 24 24" width={60 * u} height={60 * u} style={{ transform: `skewX(10deg) translateX(${Math.sin(frame / 4) * 4 * u}px)`, position: "relative" }}>
            <path d="M4 12 H19 M13 5.5 L19.5 12 L13 18.5" fill="none" stroke={S.black} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ marginTop: 10 * u, fontFamily: SFONT.ui, fontWeight: 700, fontSize: 38 * u, color: S.white, opacity: ease(frame, 12, 8) }}>
          {BRAND.pricePrefix} {BRAND.price} {BRAND.priceUnit} <span style={{ fontWeight: 400, fontSize: 32 * u, color: "#C9CDD4" }}>{BRAND.priceNote}</span>
        </div>
        <div style={{ fontFamily: SFONT.head, fontStyle: "italic", fontWeight: 700, fontSize: 34 * u, color: S.grey, letterSpacing: "0.2em", opacity: ease(frame, 15, 8) }}>WINDOWS · MAC · LINUX</div>
      </AbsoluteFill>
    </SportStage>
  );
};

export const SPORT_EFFECTS: Record<string, React.FC<any>> = {
  fehlstart: Fehlstart,
  ampel: Ampel,
  teamlogo: Teamlogo,
  duell: Duell,
  tabelle: Tabelle,
  boxenstopp: Boxenstopp,
  sektoren: Sektoren,
  heimspiel: Heimspiel,
  rotekarte: Rotekarte,
  serie: Serie,
  trikots: Trikots,
  startnummer: Startnummer,
  flex: Flex,
  zielflagge: Zielflagge,
};
