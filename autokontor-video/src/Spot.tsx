import React from "react";
import { AbsoluteFill, Audio, Easing, Sequence, Solid, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { lightLeak } from "@remotion/effects/light-leak";
import { Beat, BeatProps, EASE, Timeline, cardWords, clamp, toFrames } from "./lib";
import { Flash, Glitch, Morph, Slam, Stretch, Type } from "./effects/text";
import { Doc, End, Laptop, Lock, OS, Preis } from "./effects/scenes";
import { BRAND, C, FONT, FPS, N, P, S, SFONT } from "./theme";
import { PREMIUM_EFFECTS } from "./premium/scenes";
import { NACHT_EFFECTS } from "./nacht/scenes";
import { SPORT_EFFECTS } from "./sport/scenes";
import { Badge, xblur } from "./sport/kit";

const EFFECTS: Record<string, React.FC<any>> = { slam: Slam, glitch: Glitch, stretch: Stretch, flash: Flash, morph: Morph, type: Type, laptop: Laptop, lock: Lock, os: OS, doc: Doc, preis: Preis, end: End };

/** Ein Bild: Wisch-Übergang + Kamera-Punch beim Schnitt, Kamera-Kick auf jedem Wort, Drift. */
const BeatView: React.FC<{ beat: Beat; index: number; occ: number; dur: number; screenshot: string | null; stil: string }> = ({ beat, index, occ, dur, screenshot, stil }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const premium = stil === "premium" || stil === "nacht";
  const map = stil === "sport" ? SPORT_EFFECTS : stil === "nacht" ? NACHT_EFFECTS : stil === "premium" ? PREMIUM_EFFECTS : EFFECTS;
  const Comp = map[beat.effect] ?? Slam;
  const isEnd = beat.effect === "end" || beat.effect === "finale" || beat.effect === "zielflagge";
  const words = toFrames(beat);
  const dir = index % 2 ? 1 : -1;
  const punch = isEnd ? 1 : interpolate(frame, [0, 6], [1.18, 1], { ...clamp, easing: EASE });
  const whip = isEnd ? 0 : interpolate(frame, [0, 5], [1, 0], { ...clamp, easing: EASE });
  let kick = 0;
  if (!isEnd) {
    for (const w of words) {
      const l = frame - w.f;
      if (l >= 0 && l < 14) kick += 0.045 * Math.exp(-l / 3.5);
    }
  }
  const drift = 1 + (frame / Math.max(1, dur)) * (isEnd ? 0.03 : 0.06);
  const rot = isEnd ? 0 : Math.sin((frame + index * 17) / 40) * 0.35 + dir * whip * 3;
  const props: BeatProps & { occ: number } = {
    beat,
    index,
    occ,
    words,
    frame,
    dur,
    width,
    height,
    vertical: height > width,
    screenshot,
  };
  if (stil === "sport") {
    // Sport: schießt von rechts herein (Schräglage, Bewegungsunschärfe), raus nach links, Kamera-Kick auf jedem Wort
    const t = interpolate(frame, [0, 7], [0, 1], { ...clamp, easing: EASE });
    const out = isEnd ? 0 : interpolate(frame, [dur - 4, dur], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
    return (
      <AbsoluteFill
        style={{
          transform: `translateX(${(1 - t) * width * 0.16 - out * width * 0.22}px) skewX(${(1 - t) * -8 + out * 8}deg) scale(${(1 + (1 - t) * 0.08) * (1 + kick * 0.5)})`,
          filter: xblur(Math.max(1 - t, out)),
        }}
      >
        <Comp {...props} />
      </AbsoluteFill>
    );
  }
  if (premium) {
    // Premium: weiches Einblenden, Zoom-Ausgang, langsamer Kamera-Push und leichte 3D-Kamerabewegung
    const t = interpolate(frame, [0, 8], [0, 1], { ...clamp, easing: EASE });
    const out = isEnd ? 0 : interpolate(frame, [dur - 6, dur], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
    const rx = Math.sin((frame + index * 30) / 45) * 2.2;
    const ry = Math.cos((frame + index * 30) / 52) * 2.8;
    const blur = (1 - t) * 12 + out * 10;
    // Nacht: Scheinwerfer-Aufblitzen beim Schnitt
    const flash = stil === "nacht" ? 1 + (1 - t) * 0.9 + out * 0.8 : 1;
    const filter = [blur > 0.05 ? `blur(${blur}px)` : "", flash > 1.01 ? `brightness(${flash})` : ""].filter(Boolean).join(" ");
    return (
      <AbsoluteFill style={{ perspective: 2200 }}>
        <AbsoluteFill
          style={{
            transform: `scale(${(1.06 - 0.06 * t) * (1 + (frame / Math.max(1, dur)) * 0.03) * (1 + out * 0.12)}) rotateX(${rx}deg) rotateY(${ry}deg)`,
            filter: filter || undefined,
          }}
        >
          <Comp {...props} />
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill
      style={{
        transform: `translateX(${dir * whip * width * 0.14}px) scale(${punch * drift * (1 + kick)}) rotate(${rot}deg)`,
        filter: whip > 0.05 ? `blur(${whip * 16}px)` : undefined,
      }}
    >
      <Comp {...props} />
      {!isEnd && <AbsoluteFill style={{ background: C.white, opacity: interpolate(frame, [0, 3], [0.3, 0], clamp), pointerEvents: "none" }} />}
    </AbsoluteFill>
  );
};

/** Premium: orange Kugel füllt das Bild und gibt die nächste Szene frei (vor wichtigen Szenen). */
const WIPE_INTO = ["schluss", "logo", "preis", "end"];
const OrbWipes: React.FC<{ beats: Beat[] }> = ({ beats }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const R = Math.hypot(width, height) * 0.56;
  for (const b of beats.slice(1)) {
    if (!WIPE_INTO.includes(b.effect)) continue;
    const B = Math.round(b.start * FPS);
    if (frame < B - 7 || frame >= B + 9) continue;
    const r = frame < B ? interpolate(frame, [B - 7, B], [0, R], { ...clamp, easing: Easing.in(Easing.cubic) }) : interpolate(frame, [B, B + 9], [R, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            left: width / 2 - r,
            top: height / 2 - r,
            width: r * 2,
            height: r * 2,
            borderRadius: "50%",
            background: `radial-gradient(circle at 34% 28%, #FFD3B0 0%, #FF9A55 14%, ${P.orange} 36%, #E2500C 70%, #B83C04 100%)`,
            boxShadow: "0 40px 120px rgba(201,68,10,.45)",
          }}
        />
      </AbsoluteFill>
    );
  }
  return null;
};

/** Premium: warmer Licht-Effekt (Light Leak, @remotion/effects) über wichtigen Schnitten – wie bei Kinowerbung. */
const LEAK_AT: Record<string, string[]> = { premium: ["logo", "kugel", "preis", "end"], nacht: ["zuendung", "silhouetten", "preisschild", "finale"] };
const LeakOverlay: React.FC<{ seed: number; nacht: boolean }> = ({ seed, nacht }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ mixBlendMode: nacht ? "screen" : "soft-light", opacity: nacht ? 0.5 : 1, pointerEvents: "none" }}>
      <Solid width={width} height={height} effects={[lightLeak({ seed, hueShift: nacht ? 195 : 0, progress: interpolate(frame, [0, durationInFrames - 1], [0, 1], clamp) })]} />
    </AbsoluteFill>
  );
};
const LightLeaks: React.FC<{ beats: Beat[]; stil: string }> = ({ beats, stil }) => (
  <>
    {beats.map((b, i) =>
      (LEAK_AT[stil] ?? []).includes(b.effect) && i > 0 ? (
        <Sequence key={i} from={Math.max(0, Math.round(b.start * FPS) - 10)} durationInFrames={26} layout="none">
          <LeakOverlay seed={i * 3} nacht={stil === "nacht"} />
        </Sequence>
      ) : null,
    )}
  </>
);

/** Nacht: Vignette + feines Filmkorn. */
const NachtOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,.55) 100%)", pointerEvents: "none" }} />
      <AbsoluteFill style={{ opacity: 0.06, mixBlendMode: "overlay", pointerEvents: "none" }}>
        <svg width="100%" height="100%">
          <filter id="ngrain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 10} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#ngrain)" />
        </svg>
      </AbsoluteFill>
    </>
  );
};

/** Filmkorn, Vignette, Scanlines – macht den Look „teuer“. */
const Overlays: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.65) 100%)", pointerEvents: "none" }} />
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 4px)", pointerEvents: "none" }} />
      <AbsoluteFill style={{ opacity: 0.09, mixBlendMode: "overlay", pointerEvents: "none" }}>
        <svg width="100%" height="100%">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 12} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
    </>
  );
};

/** Kleine Marke oben links + oben rechts (nicht im Endbild). */
const Corner: React.FC<{ endFrom: number }> = ({ endFrom }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const v = height > width;
  const o = interpolate(frame, [endFrom - 4, endFrom], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ padding: v ? "110px 60px" : "50px 70px", opacity: o, pointerEvents: "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: FONT.ui }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ background: C.blue, color: "#fff", fontWeight: 700, fontSize: 24, borderRadius: 9, padding: "6px 9px", letterSpacing: "-0.03em" }}>{BRAND.logoText}</div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 28 }}>{BRAND.name}</div>
        </div>
        {!v && <div style={{ color: "rgba(255,255,255,.6)", fontSize: 16, letterSpacing: "0.22em" }}>{BRAND.corner}</div>}
      </div>
    </AbsoluteFill>
  );
};

type Sfx = { at: number; file: "impact" | "whoosh" | "glitch" | "pop" | "swish" | "click" | "ding" | "ui-pop" | "ui-click" | "ui-ding" | "ui-tick" | "ui-swish" | "ui-toggle"; vol: number };
const wordStart = (b: Beat, re: RegExp, fallback = b.start) => b.words.find((w) => re.test(w.w))?.start ?? fallback;

/** Soundeffekte passend zu den Effekten. */
const SFX_FOR: Record<string, (b: Beat) => Sfx[]> = {
  slam: (b) => [b.words[0], b.words.at(-1)!].filter((w, i, a) => i === 0 || w !== a[0]).map((w) => ({ at: w.start, file: "impact" as const, vol: 0.9 })),
  glitch: (b) => b.words.map((w) => ({ at: w.start, file: "glitch" as const, vol: 0.5 })),
  stretch: (b) => [{ at: b.start, file: "whoosh", vol: 0.8 }],
  flash: (b) => [{ at: b.start, file: "impact", vol: 0.7 }],
  morph: (b) => [{ at: b.start, file: "whoosh", vol: 0.55 }],
  type: (b) => [{ at: b.start, file: "glitch", vol: 0.3 }],
  laptop: (b) => [{ at: b.start, file: "whoosh", vol: 0.8 }],
  lock: (b) => [{ at: b.start + 0.3, file: "impact", vol: 0.9 }],
  os: (b) => cardWords(b.words).map((w) => ({ at: w.start, file: "impact" as const, vol: 0.45 })),
  doc: (b) => [{ at: b.start, file: "whoosh", vol: 0.7 }, ...b.words.filter((w) => /pdf/i.test(w.w)).map((w) => ({ at: w.start, file: "impact" as const, vol: 0.6 }))],
  preis: (b) => [{ at: b.start, file: "whoosh", vol: 0.6 }, ...b.words.filter((w) => /\d/.test(w.w)).map((w) => ({ at: w.start, file: "impact" as const, vol: 0.9 }))],
  end: (b) => [{ at: b.start, file: "whoosh", vol: 0.8 }, { at: b.start + 0.05, file: "impact", vol: 0.8 }],
};

/** Weiche Sounds für den Premium-Stil. */
const SFX_PREMIUM: Record<string, (b: Beat) => Sfx[]> = {
  // echte Interface-Sounds (Kenney, CC0) – leise und edel
  chaos: (b) => b.words.map((w) => ({ at: w.start, file: "ui-pop", vol: 0.45 })),
  schluss: (b) => [{ at: b.start - 0.25, file: "ui-swish", vol: 0.5 }],
  logo: (b) => [{ at: wordStart(b, /autokontor/i), file: "ui-ding", vol: 0.5 }],
  kugel: (b) => b.words.filter((w) => /große|kleine/i.test(w.w)).map((w) => ({ at: w.start + 0.12, file: "ui-pop", vol: 0.6 })),
  karten: (b) => b.words.filter((w) => /fahrzeuge|kunden|kaufvertr|rechnungen|pdf/i.test(w.w)).map((w) => ({ at: w.start, file: "ui-pop", vol: 0.5 })),
  klick: (b) => [{ at: wordStart(b, /klicks/i), file: "ui-click", vol: 0.9 }],
  badges: (b) => b.words.filter((w) => /rechnung|zugferd/i.test(w.w)).map((w) => ({ at: w.start + 0.1, file: "ui-tick", vol: 0.6 })),
  lokal: (b) => [{ at: b.start + 0.35, file: "ui-pop", vol: 0.55 }],
  wolke: (b) => [{ at: wordStart(b, /cloud/i), file: "ui-toggle", vol: 0.6 }],
  backup: (b) => {
    const durF = (b.end - b.start) * FPS;
    return Array.from({ length: 7 }, (_, i) => ({ at: b.start + (6 + i * Math.max(2, (durF - 14) / 7)) / FPS, file: "ui-tick" as const, vol: 0.4 }));
  },
  plattform: (b) => b.words.filter((w) => /windows|mac|linux|büro|laptop/i.test(w.w)).map((w) => ({ at: w.start, file: "ui-pop", vol: 0.5 })),
  preis: (b) => [{ at: b.start - 0.25, file: "ui-swish", vol: 0.45 }, { at: wordStart(b, /\d/), file: "ui-ding", vol: 0.55 }],
  kuendbar: (b) => [{ at: wordStart(b, /kündbar/i), file: "ui-toggle", vol: 0.7 }],
  end: (b) => [{ at: b.start - 0.25, file: "ui-swish", vol: 0.45 }, { at: wordStart(b, /\d/), file: "ui-ding", vol: 0.5 }],
};

/** Nacht: dezente Sounds passend zu den Auto-Motiven. */
const SFX_NACHT: Record<string, (b: Beat) => Sfx[]> = {
  strasse: (b) => b.words.slice(0, 3).map((w) => ({ at: w.start, file: "swish", vol: 0.35 })),
  stopp: (b) => [{ at: b.words.at(-1)!.start, file: "ui-click", vol: 0.9 }],
  zuendung: (b) => [{ at: wordStart(b, /autokontor/i) - 0.2, file: "ui-click", vol: 0.9 }, { at: wordStart(b, /autokontor/i), file: "ui-ding", vol: 0.45 }],
  silhouetten: (b) => b.words.filter((w) => /große|kleine/i.test(w.w)).map((w) => ({ at: w.start, file: "ui-swish", vol: 0.4 })),
  cockpit: (b) => b.words.filter((w) => /fahrzeuge|kunden|kaufvertr|rechnungen/i.test(w.w)).map((w) => ({ at: w.start, file: "ui-tick", vol: 0.55 })),
  schluessel: (b) => [{ at: wordStart(b, /klicks/i), file: "ui-click", vol: 0.9 }, { at: wordStart(b, /klicks/i) + 0.12, file: "ui-tick", vol: 0.6 }, { at: wordStart(b, /klicks/i) + 0.33, file: "ui-tick", vol: 0.6 }],
  leuchten: (b) => b.words.filter((w) => /rechnung|zugferd/i.test(w.w)).map((w) => ({ at: w.start, file: "ui-toggle", vol: 0.5 })),
  rechner: (b) => [{ at: b.start + 0.2, file: "ui-swish", vol: 0.35 }],
  wolke: (b) => [{ at: wordStart(b, /cloud/i), file: "ui-pop", vol: 0.7 }],
  tacho: (b) => [{ at: b.end - 0.3, file: "ui-ding", vol: 0.4 }],
  kennzeichen: (b) => b.words.filter((w) => /windows|mac|linux/i.test(w.w)).map((w) => ({ at: w.start, file: "ui-pop", vol: 0.55 })),
  preisschild: (b) => [{ at: wordStart(b, /\d/) - 0.2, file: "ui-swish", vol: 0.4 }, { at: wordStart(b, /\d/), file: "ui-ding", vol: 0.55 }],
  kuendbar: (b) => [{ at: wordStart(b, /kündbar/i), file: "ui-toggle", vol: 0.7 }],
  finale: (b) => [{ at: b.start, file: "ui-swish", vol: 0.4 }, { at: wordStart(b, /\d/), file: "ui-ding", vol: 0.5 }],
};

/** Sport: schräger Wisch bei jedem Schnitt; vor wichtigen Szenen deckt ein Balken das ganze Bild ab. */
const SLASH_FULL = ["ampel", "teamlogo", "startnummer", "zielflagge"];
const SPORT_VOLT = ["teamlogo", "boxenstopp"];
const SPORT_LIGHT = ["serie", "startnummer"];
const SportCuts: React.FC<{ beats: Beat[] }> = ({ beats }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  for (const [i, b] of beats.entries()) {
    if (i === 0) continue;
    const B = Math.round(b.start * FPS);
    if (frame < B - 5 || frame > B + 6) continue;
    const full = SLASH_FULL.includes(b.effect);
    const bar = (x: number, w: number, color: string) => <div style={{ position: "absolute", left: x, top: -height * 0.2, width: w, height: height * 1.4, background: color, transform: "skewX(-16deg)" }} />;
    if (full) {
      const x = frame < B ? interpolate(frame, [B - 5, B], [width * 1.25, -width * 0.7], { ...clamp, easing: Easing.in(Easing.cubic) }) : interpolate(frame, [B, B + 6], [-width * 0.7, -width * 3.3], { ...clamp, easing: Easing.out(Easing.cubic) });
      const color = b.effect === "teamlogo" || b.effect === "startnummer" ? S.black : S.volt;
      return (
        <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
          {bar(x - width * 0.18, width * 0.12, color === S.volt ? S.black : S.volt)}
          {bar(x, width * 2.4, color)}
        </AbsoluteFill>
      );
    }
    const pr = interpolate(frame, [B - 5, B + 6], [0, 1], clamp);
    const x = interpolate(pr, [0, 1], [width * 1.2, -width * 0.6]);
    // Kontrastfarbe: auf Neongelb schwarz, auf Weiß neongelb, sonst abwechselnd
    const near = [beats[i - 1].effect, b.effect];
    const main = near.some((e) => SPORT_VOLT.includes(e)) ? S.black : near.some((e) => SPORT_LIGHT.includes(e)) ? S.volt : i % 2 ? S.volt : S.white;
    const accent = main === S.black ? S.white : main === S.volt && near.some((e) => SPORT_LIGHT.includes(e)) ? S.black : S.volt;
    return (
      <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
        {bar(x, width * 0.16, main)}
        {bar(x + width * 0.22, width * 0.04, accent)}
      </AbsoluteFill>
    );
  }
  return null;
};

/** Sport: Einblendungen wie bei einer Übertragung – Marke oben links, LIVE + Bildzähler oben rechts. */
const SportHud: React.FC<{ beats: Beat[] }> = ({ beats }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const v = height > width;
  const u = v ? width / 1080 : height / 1080;
  const endB = beats.find((b) => b.effect === "zielflagge");
  const endF = endB ? Math.round(endB.start * FPS) : Infinity;
  const o = Math.min(interpolate(frame, [4, 12], [0, 1], clamp), endF === Infinity ? 1 : interpolate(frame, [endF - 4, endF], [1, 0], clamp));
  if (o <= 0) return null;
  let idx = 0;
  beats.forEach((b, i) => {
    if (frame >= Math.round(b.start * FPS)) idx = i;
  });
  const top = v ? 96 * u : 46 * u;
  const pad = v ? 54 * u : 64 * u;
  const pill: React.CSSProperties = { display: "flex", alignItems: "center", gap: 14 * u, background: "rgba(10,11,13,.82)", padding: `${10 * u}px ${18 * u}px`, transform: "skewX(-12deg)", boxShadow: "0 8px 20px rgba(0,0,0,.25)" };
  const txt: React.CSSProperties = { transform: "skewX(12deg)", fontFamily: SFONT.head, fontStyle: "italic", fontWeight: 800, fontSize: 30 * u, letterSpacing: "0.08em", color: S.white, whiteSpace: "nowrap" };
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: o }}>
      <div style={{ position: "absolute", left: pad, top, ...pill }}>
        <div style={{ transform: "skewX(12deg)" }}>
          <Badge s={40 * u} dark={false} />
        </div>
        <div style={txt}>{BRAND.name.toUpperCase()}</div>
      </div>
      <div style={{ position: "absolute", right: pad, top, ...pill }}>
        <div style={{ transform: "skewX(12deg)", width: 14 * u, height: 14 * u, borderRadius: "50%", background: S.red, opacity: frame % 30 < 18 ? 1 : 0.25 }} />
        <div style={txt}>LIVE</div>
        <div style={{ ...txt, color: S.volt }}>{String(idx + 1).padStart(2, "0")}/{String(beats.length).padStart(2, "0")}</div>
      </div>
    </AbsoluteFill>
  );
};

/** Sport: feines Korn + leichte Vignette. */
const SportOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 58%, rgba(0,0,0,.35) 100%)", pointerEvents: "none" }} />
      <AbsoluteFill style={{ opacity: 0.05, mixBlendMode: "overlay", pointerEvents: "none" }}>
        <svg width="100%" height="100%">
          <filter id="sgrain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 10} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#sgrain)" />
        </svg>
      </AbsoluteFill>
    </>
  );
};

/** Sport: knackige Sounds passend zu den Motiven. */
const SFX_SPORT: Record<string, (b: Beat) => Sfx[]> = {
  fehlstart: (b) => [...b.words.slice(0, 3).map((w) => ({ at: w.start, file: "swish" as const, vol: 0.45 })), { at: wordStart(b, /überall/i), file: "impact", vol: 0.6 }],
  ampel: (b) => {
    const w = b.words.map((x) => x.start);
    const out = w[w.length - 1];
    return [...[w[0], w[1], w[2], (w[2] + out) / 2, out - 5 / FPS].map((t) => ({ at: t, file: "ui-tick" as const, vol: 0.7 })), { at: out, file: "impact", vol: 0.9 }, { at: out, file: "whoosh", vol: 0.5 }];
  },
  teamlogo: (b) => [{ at: b.start - 0.15, file: "whoosh", vol: 0.6 }, { at: wordStart(b, /autokontor/i), file: "impact", vol: 0.8 }],
  duell: (b) => [{ at: b.start, file: "whoosh", vol: 0.55 }, ...b.words.filter((w) => /große|kleine/i.test(w.w)).map((w) => ({ at: w.start, file: "ui-pop" as const, vol: 0.6 })), { at: wordStart(b, /autohändler/i), file: "impact", vol: 0.5 }],
  tabelle: (b) => [...b.words.filter((w) => /fahrzeuge|kunden|kaufvertr|rechnungen/i.test(w.w)).map((w) => ({ at: w.start, file: "ui-tick" as const, vol: 0.6 })), { at: wordStart(b, /pdf/i), file: "ui-ding", vol: 0.55 }],
  boxenstopp: (b) => {
    const k = wordStart(b, /klicks/i);
    return [{ at: k, file: "ui-click", vol: 0.9 }, { at: k + 7 / FPS, file: "ui-click", vol: 0.9 }, { at: k + 14 / FPS, file: "ui-ding", vol: 0.6 }];
  },
  sektoren: (b) => b.words.filter((w) => /rechnung|zugferd/i.test(w.w)).map((w) => ({ at: w.start, file: "ui-toggle", vol: 0.55 })),
  heimspiel: (b) => [{ at: b.start, file: "swish", vol: 0.4 }, { at: wordStart(b, /deinem/i), file: "ui-pop", vol: 0.6 }],
  rotekarte: (b) => [{ at: wordStart(b, /cloud/i) - 0.07, file: "whoosh", vol: 0.5 }, { at: wordStart(b, /cloud/i), file: "impact", vol: 0.85 }],
  serie: (b) => {
    const durF = (b.end - b.start) * FPS;
    return [...Array.from({ length: 7 }, (_, i) => ({ at: b.start + (6 + i * Math.max(2, (durF - 22) / 7)) / FPS, file: "ui-tick" as const, vol: 0.45 })), { at: b.end - 10 / FPS, file: "ui-ding", vol: 0.5 }];
  },
  trikots: (b) => b.words.filter((w) => /windows|mac|linux/i.test(w.w)).map((w) => ({ at: w.start - 0.05, file: "swish" as const, vol: 0.55 })),
  startnummer: (b) => [{ at: wordStart(b, /19/), file: "impact", vol: 0.85 }, { at: wordStart(b, /monat/i), file: "ui-pop", vol: 0.5 }],
  flex: (b) => [{ at: wordStart(b, /kündbar/i), file: "ui-toggle", vol: 0.8 }],
  zielflagge: (b) => [{ at: b.start, file: "impact", vol: 0.7 }, { at: b.start + 0.3, file: "ui-ding", vol: 0.5 }],
};

const Sound: React.FC<{ total: number; timeline: Timeline }> = ({ total, timeline }) => {
  const a = timeline.audio;
  const premium = timeline.stil === "premium" || timeline.stil === "nacht";
  const sport = timeline.stil === "sport";
  const sfxMap = sport ? SFX_SPORT : timeline.stil === "nacht" ? SFX_NACHT : premium ? SFX_PREMIUM : SFX_FOR;
  // Premium: Musik ist schon unter der Stimme abgesenkt (tools/musik.py --stil sanft) und bleibt dezent im Hintergrund
  const musicVol = a.voice ? (premium ? 0.3 : sport ? 0.26 : 0.14) : 0.6;
  const sfxVol = a.voice ? 0.55 : 1;
  return (
    <>
      {a.voice && <Audio src={staticFile(a.voice)} />}
      {a.music && (
        <Audio
          src={staticFile(a.music)}
          volume={(f) => interpolate(f, [0, 6, total - 60, total], [0, musicVol, musicVol, 0], clamp)}
        />
      )}
      {timeline.beats.flatMap((b, i) =>
        (sfxMap[b.effect]?.(b) ?? []).map((s, k) => {
          const file = a.sfx[s.file];
          if (!file) return null;
          return (
            <Sequence key={`${i}-${k}`} from={Math.max(0, Math.round(s.at * FPS))} durationInFrames={30} layout="none">
              <Audio src={staticFile(file)} volume={s.vol * sfxVol} />
            </Sequence>
          );
        }),
      )}
    </>
  );
};

/** Der ganze Spot. Welche Fassung (60 s, 30 s …) gerendert wird, bestimmt die übergebene timeline. */
export const Spot: React.FC<{ timeline: Timeline }> = ({ timeline }) => {
  const { durationInFrames } = useVideoConfig();
  const beats = timeline.beats;
  const stil = timeline.stil ?? "tiktok";
  const premium = stil === "premium";
  const nacht = stil === "nacht";
  const sport = stil === "sport";
  const count: Record<string, number> = {};
  const endBeat = beats.find((b) => b.effect === "end");
  return (
    <AbsoluteFill style={{ background: sport ? S.black : nacht ? N.bg : premium ? P.bg : C.black }}>
      {beats.map((b, i) => {
        const occ = count[b.effect] ?? 0;
        count[b.effect] = occ + 1;
        const from = Math.round(b.start * FPS);
        const to = i === beats.length - 1 ? durationInFrames : Math.round(b.end * FPS);
        const dur = Math.max(1, to - from);
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <BeatView beat={b} index={i} occ={occ} dur={dur} screenshot={timeline.screenshot} stil={stil} />
          </Sequence>
        );
      })}
      {!premium && !nacht && !sport && <Corner endFrom={endBeat ? Math.round(endBeat.start * FPS) : durationInFrames} />}
      {!premium && !nacht && !sport && <Overlays />}
      {sport && <SportCuts beats={beats} />}
      {sport && <SportHud beats={beats} />}
      {sport && <SportOverlay />}
      {premium && <OrbWipes beats={beats} />}
      {(premium || nacht) && <LightLeaks beats={beats} stil={stil} />}
      {nacht && <NachtOverlay />}
      <Sound total={durationInFrames} timeline={timeline} />
    </AbsoluteFill>
  );
};
