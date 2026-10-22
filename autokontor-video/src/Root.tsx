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
import "./fonts";

// Fassungen: timeline.json = Erklärvideo (skript.txt), timeline-tiktok30.json = 30-s-TikTok (skript-tiktok30.txt),
// timeline-premium30.json = 30 s im Premium-Stil (skript-premium30.txt)
const timeline = timelineJson as Timeline;
const timeline30 = timeline30Json as Timeline;
const timelineP30 = timelineP30Json as Timeline;
const timelineN30 = timelineN30Json as Timeline;
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
