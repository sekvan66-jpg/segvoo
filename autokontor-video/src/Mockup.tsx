// Laptop-Mockup (wie im Referenzvideo): das fertige Querformat-Video läuft auf einem Laptop-Bildschirm,
// dunkler Raum mit lila Licht, leichte Handkamera-Bewegung. Das Bildschirm-Video wird vorher gerendert:
//   npx remotion render AutoKontorPremium30Wide public/mockup/premium30-wide.mp4
import React from "react";
import { AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Timeline, clamp } from "./lib";
import { BRAND, FONT, FPS } from "./theme";

const Keyboard: React.FC<{ w: number }> = ({ w }) => {
  const rows = [14, 14, 13, 12, 11];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: w * 0.008, padding: `${w * 0.03}px ${w * 0.05}px 0` }}>
      {rows.map((n, r) => (
        <div key={r} style={{ display: "flex", gap: w * 0.008, justifyContent: "center" }}>
          {Array.from({ length: n }).map((_, k) => (
            <div
              key={k}
              style={{
                flex: r === 4 && k === 5 ? 5 : 1,
                height: w * 0.045,
                borderRadius: w * 0.006,
                background: "linear-gradient(180deg,#1C1F2B,#11131B)",
                boxShadow: "inset 0 -1px 0 rgba(140,120,255,.35), 0 0 6px rgba(110,90,255,.25)",
              }}
            />
          ))}
        </div>
      ))}
      <div style={{ margin: `${w * 0.03}px auto 0`, width: w * 0.42, height: w * 0.2, borderRadius: w * 0.015, background: "linear-gradient(180deg,#5B5F6E,#4A4E5C)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.12)" }} />
    </div>
  );
};

export const LaptopMockup: React.FC<{ timeline: Timeline; video: string; caption: string }> = ({ timeline, video, caption }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const sw = width * 0.9; // Bildschirmbreite außen
  const inner = sw * 0.955;
  // Handkamera: leichtes Schwanken + langsamer Push-in
  const sway = {
    x: Math.sin(frame / 37) * 6 + Math.sin(frame / 13) * 1.5,
    y: Math.cos(frame / 43) * 5 + Math.sin(frame / 17) * 1.2,
    r: Math.sin(frame / 51) * 0.6,
    s: interpolate(frame, [0, durationInFrames], [1, 1.05]),
  };
  const preis = timeline.beats.find((b) => b.effect === "preis");
  const showPrice = preis ? frame >= Math.round(preis.start * FPS) : false;
  const priceIn = preis ? interpolate(frame - Math.round(preis.start * FPS), [0, 8], [0, 1], clamp) : 0;
  const capIn = interpolate(frame, [0, 10], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "#07060C", overflow: "hidden" }}>
      {/* Raum: lila Licht + Vorhang-Falten */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 22%, rgba(122,62,220,.75) 0%, rgba(70,30,140,.45) 30%, rgba(10,8,20,0) 65%)" }} />
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,.28) 0px, rgba(255,255,255,.03) 38px, rgba(0,0,0,.28) 76px)", opacity: 0.8, maskImage: "linear-gradient(180deg, #000 0%, #000 45%, transparent 70%)" }} />
      <AbsoluteFill style={{ transform: `translate(${sway.x}px, ${sway.y}px) rotate(${sway.r}deg) scale(${sway.s})` }}>
        {/* Bildunterschrift oben (TikTok-Stil) */}
        <div style={{ position: "absolute", top: height * 0.17, width: "100%", textAlign: "center", fontFamily: FONT.ui, fontWeight: 700, fontSize: 62, color: "#fff", textShadow: "0 4px 18px rgba(0,0,0,.6)", opacity: capIn }}>
          {caption}
        </div>
        <div style={{ position: "absolute", left: (width - sw) / 2, top: height * 0.3, perspective: 2400 }}>
          {/* Deckel mit Bildschirm */}
          <div style={{ transform: "rotateX(6deg)", transformOrigin: "50% 100%" }}>
            <div
              style={{
                width: sw,
                padding: (sw - inner) / 2,
                paddingBottom: (sw - inner) * 0.9,
                borderRadius: sw * 0.03,
                background: "linear-gradient(180deg,#2A2C33,#16171C)",
                boxShadow: "0 0 0 2px #3A3D46, 0 0 160px rgba(200,210,255,.22), 0 40px 80px rgba(0,0,0,.6)",
                position: "relative",
              }}
            >
              <div style={{ width: inner, height: (inner * 9) / 16, borderRadius: sw * 0.008, overflow: "hidden", position: "relative", background: "#000" }}>
                <OffthreadVideo src={staticFile(video)} style={{ width: "100%", height: "100%" }} />
                {/* Spiegelung auf dem Display */}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,0) 70%, rgba(255,255,255,.05) 100%)" }} />
              </div>
            </div>
          </div>
          {/* Unterteil mit beleuchteter Tastatur, perspektivisch gekippt */}
          <div style={{ transform: "rotateX(62deg)", transformOrigin: "50% 0%", marginTop: -2 }}>
            <div
              style={{
                width: sw * 1.08,
                marginLeft: -sw * 0.04,
                height: sw * 0.62,
                borderRadius: `${sw * 0.01}px ${sw * 0.01}px ${sw * 0.04}px ${sw * 0.04}px`,
                background: "radial-gradient(ellipse at 50% 0%, #4A4D5A 0%, #2E3039 55%, #22242B 100%)",
                boxShadow: "0 60px 90px rgba(0,0,0,.7)",
              }}
            >
              <Keyboard w={sw * 1.08} />
            </div>
          </div>
        </div>
      </AbsoluteFill>
      {/* Preis-Hinweis gut lesbar unten, sobald der Preis genannt wird */}
      {showPrice && (
        <div style={{ position: "absolute", bottom: height * 0.14, width: "100%", display: "flex", justifyContent: "center", opacity: priceIn, transform: `translateY(${(1 - priceIn) * 30}px)` }}>
          <div style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: 44, color: "#fff", background: "rgba(255,106,26,.92)", borderRadius: 999, padding: "16px 34px", boxShadow: "0 12px 40px rgba(255,106,26,.35)" }}>
            {BRAND.pricePrefix} {BRAND.price} {BRAND.priceUnit} <span style={{ fontWeight: 400, fontSize: 30, opacity: 0.9 }}>{BRAND.priceNote}</span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
