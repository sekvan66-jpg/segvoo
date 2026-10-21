import React from "react";
import { Composition } from "remotion";
import { Spot } from "./Spot";
import { FPS } from "./theme";
import { Timeline } from "./lib";
import timelineJson from "./data/timeline.json";
import timeline30Json from "./data/timeline-tiktok30.json";
import timelineP30Json from "./data/timeline-premium30.json";
import "./fonts";

// Fassungen: timeline.json = Erklärvideo (skript.txt), timeline-tiktok30.json = 30-s-TikTok (skript-tiktok30.txt),
// timeline-premium30.json = 30 s im Premium-Stil (skript-premium30.txt)
const timeline = timelineJson as Timeline;
const timeline30 = timeline30Json as Timeline;
const timelineP30 = timelineP30Json as Timeline;
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
  </>
);
