import React from "react";
import { AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Beat, BeatProps, EASE, Timeline, cardWords, clamp, toFrames } from "./lib";
import { Flash, Glitch, Morph, Slam, Stretch, Type } from "./effects/text";
import { Doc, End, Laptop, Lock, OS, Preis } from "./effects/scenes";
import { BRAND, C, FONT, FPS, P } from "./theme";
import { PREMIUM_EFFECTS } from "./premium/scenes";

const EFFECTS: Record<string, React.FC<any>> = { slam: Slam, glitch: Glitch, stretch: Stretch, flash: Flash, morph: Morph, type: Type, laptop: Laptop, lock: Lock, os: OS, doc: Doc, preis: Preis, end: End };

/** Ein Bild: Wisch-Übergang + Kamera-Punch beim Schnitt, Kamera-Kick auf jedem Wort, Drift. */
const BeatView: React.FC<{ beat: Beat; index: number; occ: number; dur: number; screenshot: string | null; premium: boolean }> = ({ beat, index, occ, dur, screenshot, premium }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const Comp = (premium ? PREMIUM_EFFECTS[beat.effect] : EFFECTS[beat.effect]) ?? Slam;
  const isEnd = beat.effect === "end";
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
  if (premium) {
    // Premium: weiches Einblenden, Zoom-Ausgang, langsamer Kamera-Push und leichte 3D-Kamerabewegung
    const t = interpolate(frame, [0, 8], [0, 1], { ...clamp, easing: EASE });
    const out = isEnd ? 0 : interpolate(frame, [dur - 6, dur], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
    const rx = Math.sin((frame + index * 30) / 45) * 2.2;
    const ry = Math.cos((frame + index * 30) / 52) * 2.8;
    const blur = (1 - t) * 12 + out * 10;
    return (
      <AbsoluteFill style={{ perspective: 2200 }}>
        <AbsoluteFill
          style={{
            transform: `scale(${(1.06 - 0.06 * t) * (1 + (frame / Math.max(1, dur)) * 0.03) * (1 + out * 0.12)}) rotateX(${rx}deg) rotateY(${ry}deg)`,
            filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
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

type Sfx = { at: number; file: "impact" | "whoosh" | "glitch" | "pop" | "swish" | "click" | "ding"; vol: number };
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
  chaos: (b) => b.words.map((w) => ({ at: w.start, file: "pop", vol: 0.5 })),
  schluss: (b) => [{ at: b.start - 0.2, file: "swish", vol: 0.6 }],
  logo: (b) => [{ at: b.start, file: "swish", vol: 0.6 }, { at: wordStart(b, /autokontor/i), file: "ding", vol: 0.45 }],
  kugel: (b) => [{ at: b.start + 0.3, file: "pop", vol: 0.7 }],
  karten: (b) => b.words.filter((w) => /fahrzeuge|kunden|kaufvertr|rechnungen|pdf/i.test(w.w)).map((w) => ({ at: w.start, file: "pop", vol: 0.55 })),
  klick: (b) => [{ at: wordStart(b, /klicks/i), file: "click", vol: 0.9 }, { at: wordStart(b, /klicks/i) + 0.15, file: "swish", vol: 0.4 }],
  badges: (b) => b.words.filter((w) => /rechnung|zugferd/i.test(w.w)).map((w) => ({ at: w.start, file: "pop", vol: 0.55 })),
  lokal: (b) => [{ at: b.start, file: "swish", vol: 0.5 }, { at: b.start + 0.35, file: "pop", vol: 0.6 }],
  wolke: (b) => [{ at: wordStart(b, /cloud/i), file: "pop", vol: 0.7 }],
  backup: (b) => {
    const durF = (b.end - b.start) * FPS;
    return Array.from({ length: 7 }, (_, i) => ({ at: b.start + (6 + i * Math.max(2, (durF - 14) / 7)) / FPS, file: "click" as const, vol: 0.35 }));
  },
  plattform: (b) => b.words.filter((w) => /windows|mac|linux|büro|laptop/i.test(w.w)).map((w) => ({ at: w.start, file: "pop", vol: 0.6 })),
  preis: (b) => [{ at: wordStart(b, /\d/), file: "ding", vol: 0.6 }],
  kuendbar: (b) => [{ at: wordStart(b, /kündbar/i), file: "click", vol: 0.7 }],
  end: (b) => [{ at: b.start, file: "swish", vol: 0.5 }, { at: wordStart(b, /\d/), file: "ding", vol: 0.5 }],
};

const Sound: React.FC<{ total: number; timeline: Timeline }> = ({ total, timeline }) => {
  const a = timeline.audio;
  const premium = timeline.stil === "premium";
  const sfxMap = premium ? SFX_PREMIUM : SFX_FOR;
  // Premium: Musik ist schon unter der Stimme abgesenkt (tools/musik.py --stil sanft) und bleibt dezent im Hintergrund
  const musicVol = a.voice ? (premium ? 0.3 : 0.14) : 0.6;
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
  const premium = timeline.stil === "premium";
  const count: Record<string, number> = {};
  const endBeat = beats.find((b) => b.effect === "end");
  return (
    <AbsoluteFill style={{ background: premium ? P.bg : C.black }}>
      {beats.map((b, i) => {
        const occ = count[b.effect] ?? 0;
        count[b.effect] = occ + 1;
        const from = Math.round(b.start * FPS);
        const to = i === beats.length - 1 ? durationInFrames : Math.round(b.end * FPS);
        const dur = Math.max(1, to - from);
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <BeatView beat={b} index={i} occ={occ} dur={dur} screenshot={timeline.screenshot} premium={premium} />
          </Sequence>
        );
      })}
      {!premium && <Corner endFrom={endBeat ? Math.round(endBeat.start * FPS) : durationInFrames} />}
      {!premium && <Overlays />}
      {premium && <OrbWipes beats={beats} />}
      <Sound total={durationInFrames} timeline={timeline} />
    </AbsoluteFill>
  );
};
