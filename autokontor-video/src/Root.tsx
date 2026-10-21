import React from "react";
import { Composition } from "remotion";
import { Spot } from "./Spot";
import { FPS } from "./theme";
import timeline from "./data/timeline.json";
import "./fonts";

const frames = Math.ceil(timeline.duration * FPS);

export const Root: React.FC = () => (
  <>
    {/* TikTok / Reels / Shorts */}
    <Composition id="AutoKontorTikTok" component={Spot} durationInFrames={frames} fps={FPS} width={1080} height={1920} />
    {/* YouTube / Website */}
    <Composition id="AutoKontorYouTube" component={Spot} durationInFrames={frames} fps={FPS} width={1920} height={1080} />
  </>
);
