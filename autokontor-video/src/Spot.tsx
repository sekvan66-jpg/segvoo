import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import timeline from "./data/timeline.json";
import { Beat, BeatProps, EASE, clamp, toFrames } from "./lib";
import { Flash, Glitch, Morph, Slam, Stretch, Type } from "./effects/text";
import { End, Laptop, Lock, OS } from "./effects/scenes";
import { BRAND, C, FONT, FPS } from "./theme";

const beats = timeline.beats as Beat[];

const EFFECTS: Record<string, React.FC<any>> = { slam: Slam, glitch: Glitch, stretch: Stretch, flash: Flash, morph: Morph, type: Type, laptop: Laptop, lock: Lock, os: OS, end: End };

/** Ein Bild: Kamera-Punch beim Schnitt + langsamer Drift. */
const BeatView: React.FC<{ beat: Beat; index: number; occ: number; dur: number }> = ({ beat, index, occ, dur }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const Comp = EFFECTS[beat.effect] ?? Slam;
  const isEnd = beat.effect === "end";
  const punch = isEnd ? 1 : interpolate(frame, [0, 7], [1.08, 1], { ...clamp, easing: EASE });
  const drift = 1 + (frame / Math.max(1, dur)) * (isEnd ? 0.03 : 0.035);
  const rot = isEnd ? 0 : Math.sin((frame + index * 17) / 40) * 0.35;
  const props: BeatProps & { occ: number } = {
    beat,
    index,
    occ,
    words: toFrames(beat),
    frame,
    dur,
    width,
    height,
    vertical: height > width,
    screenshot: timeline.screenshot,
  };
  return (
    <AbsoluteFill style={{ transform: `scale(${punch * drift}) rotate(${rot}deg)` }}>
      <Comp {...props} />
    </AbsoluteFill>
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

/** Soundeffekte passend zu den Effekten. */
const SFX_FOR: Record<string, (b: Beat) => { at: number; file: "impact" | "whoosh" | "glitch"; vol: number }[]> = {
  slam: (b) => [b.words[0], b.words.at(-1)!].filter((w, i, a) => i === 0 || w !== a[0]).map((w) => ({ at: w.start, file: "impact" as const, vol: 0.9 })),
  glitch: (b) => b.words.map((w) => ({ at: w.start, file: "glitch" as const, vol: 0.5 })),
  stretch: (b) => [{ at: b.start, file: "whoosh", vol: 0.8 }],
  flash: (b) => [{ at: b.start, file: "impact", vol: 0.7 }],
  morph: (b) => [{ at: b.start, file: "whoosh", vol: 0.55 }],
  type: (b) => [{ at: b.start, file: "glitch", vol: 0.3 }],
  laptop: (b) => [{ at: b.start, file: "whoosh", vol: 0.8 }],
  lock: (b) => [{ at: b.start + 0.3, file: "impact", vol: 0.9 }],
  os: (b) => b.words.slice(0, 3).map((w) => ({ at: w.start, file: "impact" as const, vol: 0.45 })),
  end: (b) => [{ at: b.start, file: "whoosh", vol: 0.8 }, { at: b.start + 0.05, file: "impact", vol: 0.8 }],
};

const Sound: React.FC<{ total: number }> = ({ total }) => {
  const a = timeline.audio;
  const sfxVol = a.voice ? 0.55 : 1;
  return (
    <>
      {a.voice && <Audio src={staticFile(a.voice)} />}
      {a.music && (
        <Audio
          src={staticFile(a.music)}
          volume={(f) => interpolate(f, [0, 20, total - 60, total], [0, a.voice ? 0.22 : 0.6, a.voice ? 0.22 : 0.6, 0], clamp)}
        />
      )}
      {beats.flatMap((b, i) =>
        (SFX_FOR[b.effect]?.(b) ?? []).map((s, k) => {
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

export const Spot: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const count: Record<string, number> = {};
  const endBeat = beats.find((b) => b.effect === "end");
  return (
    <AbsoluteFill style={{ background: C.black }}>
      {beats.map((b, i) => {
        const occ = count[b.effect] ?? 0;
        count[b.effect] = occ + 1;
        const from = Math.round(b.start * FPS);
        const to = i === beats.length - 1 ? durationInFrames : Math.round(b.end * FPS);
        const dur = Math.max(1, to - from);
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <BeatView beat={b} index={i} occ={occ} dur={dur} />
          </Sequence>
        );
      })}
      <Corner endFrom={endBeat ? Math.round(endBeat.start * FPS) : durationInFrames} />
      <Overlays />
      <Sound total={durationInFrames} />
    </AbsoluteFill>
  );
};
