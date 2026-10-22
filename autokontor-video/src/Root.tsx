import React from "react";
import { Composition } from "remotion";
import { Spot } from "./Spot";
import { LaptopMockup } from "./Mockup";
import { FPS } from "./theme";
import { Timeline } from "./lib";
import timelineJson from "./data/timeline.json";
import timeline30Json from "./data/timeline-tiktok30.json";
import timelineP30Json from "./data/timeline-premium30.json";
import timelineN30Json from "./data/timeline-nacht30.json";
import timelineS30MJson from "./data/timeline-studio30m.json";
import timelineSp30Json from "./data/timeline-sport30.json";
import timelineSp30MJson from "./data/timeline-sport30m.json";
import timelineSp30WJson from "./data/timeline-sport30w.json";
import timelineMoJson from "./data/timeline-motion.json";
import { Studio } from "./studio/Studio";
import "./fonts";

// Fassungen: timeline.json = Erklärvideo (skript.txt), timeline-tiktok30.json = 30-s-TikTok (skript-tiktok30.txt),
// timeline-premium30.json = 30 s im Premium-Stil (skript-premium30.txt)
const timeline = timelineJson as Timeline;
const timeline30 = timeline30Json as Timeline;
const timelineP30 = timelineP30Json as Timeline;
const timelineN30 = timelineN30Json as Timeline;
const timelineS30M = timelineS30MJson as Timeline;
const timelineSp30 = timelineSp30Json as Timeline;
const timelineSp30M = timelineSp30MJson as Timeline;
const timelineSp30W = timelineSp30WJson as Timeline;
const timelineMo = timelineMoJson as Timeline;
const frames = (t: Timeline) => Math.ceil(t.duration * FPS);

export const Root: React.FC = () => (
  <>
    {/* TikTok / Reels / Shorts */}
    <Composition id="AutoKontorTikTok" component={Spot} durationInFrames={frames(timeline)} fps={FPS} width={1080} height={1920} defaultProps={{ timeline }} />
    {/* YouTube / Website */}
    <Composition id="AutoKontorYouTube" component={Spot} durationInFrames={frames(timeline)} fps={FPS} width={1920} height={1080} defaultProps={{ timeline }} />
    {/* Kurzfassung 30 s für TikTok / Reels */}
    <Composition id="AutoKontorTikTok30" component={Spot} durationInFrames={frames(timeline30)} fps={FPS} width={1080} height={1920} defaultProps={{ timeline: timeline30 }} />
    {/* Kurzfassung 30 s im Premium-Stil (hell, Kugeln, kursive Akzente) */}
    <Composition id="AutoKontorPremium30" component={Spot} durationInFrames={frames(timelineP30)} fps={FPS} width={1080} height={1920} defaultProps={{ timeline: timelineP30 }} />
    {/* dieselbe Premium-Fassung im Querformat (z. B. für den Laptop-Bildschirm im Mockup) */}
    <Composition id="AutoKontorPremium30Wide" component={Spot} durationInFrames={frames(timelineP30)} fps={FPS} width={1920} height={1080} defaultProps={{ timeline: timelineP30 }} />
    {/* „AutoKontor bei Nacht“ – Automobil-Look (skript-nacht30.txt) */}
    <Composition id="AutoKontorNacht30" component={Spot} durationInFrames={frames(timelineN30)} fps={FPS} width={1080} height={1920} defaultProps={{ timeline: timelineN30 }} />
    <Composition id="AutoKontorNacht30Wide" component={Spot} durationInFrames={frames(timelineN30)} fps={FPS} width={1920} height={1080} defaultProps={{ timeline: timelineN30 }} />
    {/* „AutoKontor Sport“ – Motorsport-/Sportwerbungs-Look (skript-sport30.txt) */}
    <Composition id="AutoKontorSport30" component={Spot} durationInFrames={frames(timelineSp30)} fps={FPS} width={1080} height={1920} defaultProps={{ timeline: timelineSp30 }} />
    <Composition id="AutoKontorSport30Wide" component={Spot} durationInFrames={frames(timelineSp30)} fps={FPS} width={1920} height={1080} defaultProps={{ timeline: timelineSp30 }} />
    {/* Sport mit anderer Stimme: M = Thorsten „gut gelaunt“, W = Frauenstimme */}
    <Composition id="AutoKontorSport30M" component={Spot} durationInFrames={frames(timelineSp30M)} fps={FPS} width={1080} height={1920} defaultProps={{ timeline: timelineSp30M }} />
    <Composition id="AutoKontorSport30MWide" component={Spot} durationInFrames={frames(timelineSp30M)} fps={FPS} width={1920} height={1080} defaultProps={{ timeline: timelineSp30M }} />
    <Composition id="AutoKontorSport30W" component={Spot} durationInFrames={frames(timelineSp30W)} fps={FPS} width={1080} height={1920} defaultProps={{ timeline: timelineSp30W }} />
    <Composition id="AutoKontorSport30WWide" component={Spot} durationInFrames={frames(timelineSp30W)} fps={FPS} width={1920} height={1080} defaultProps={{ timeline: timelineSp30W }} />
    {/* Motion-Stil nach Vorlage des Nutzers (skript-motion.txt): 1:1 wie die Vorlage, dazu 9:16 */}
    <Composition id="AutoKontorMotion" component={Spot} durationInFrames={frames(timelineMo)} fps={FPS} width={1080} height={1080} defaultProps={{ timeline: timelineMo }} />
    <Composition id="AutoKontorMotionTikTok" component={Spot} durationInFrames={frames(timelineMo)} fps={FPS} width={1080} height={1920} defaultProps={{ timeline: timelineMo }} />
    {/* „Studio“-Hochformat: Rahmen mit Schlagzeile, Karte mit dem Premium-Spot, Chips, Button (src/studio/Studio.tsx) */}
    <Composition id="AutoKontorStudio" component={Studio} durationInFrames={frames(timelineP30)} fps={FPS} width={1080} height={1920} defaultProps={{ timeline: timelineP30 }} />
    <Composition id="AutoKontorStudioM" component={Studio} durationInFrames={frames(timelineS30M)} fps={FPS} width={1080} height={1920} defaultProps={{ timeline: timelineS30M }} />
    {/* Laptop-Mockup wie im Referenzvideo (braucht public/mockup/premium30-wide.mp4) */}
    <Composition
      id="AutoKontorLaptop30"
      component={LaptopMockup}
      durationInFrames={frames(timelineP30)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ timeline: timelineP30, video: "mockup/premium30-wide.mp4", caption: "So einfach geht Autohandel." }}
    />
  </>
);
