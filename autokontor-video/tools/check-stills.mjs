// Rendert pro Bild (Beat) ein Standbild zur Qualitätskontrolle nach out/check/.
// Aufruf:  node tools/check-stills.mjs [AutoKontorTikTok|AutoKontorYouTube]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill } from "@remotion/renderer";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const id = process.argv[2] ?? "AutoKontorTikTok";
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const timeline = JSON.parse(fs.readFileSync(path.join(root, "src/data/timeline.json"), "utf8"));
const outDir = path.join(root, "out", "check");
fs.mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts") });
const composition = await selectComposition({ serveUrl, id, browserExecutable });
for (const [i, b] of timeline.beats.entries()) {
  const lastWord = b.words.at(-1);
  const t = Math.min(b.end - 0.05, Math.max(lastWord.end, b.start + 0.35) + 0.05);
  const frame = Math.min(composition.durationInFrames - 1, Math.round(t * 30));
  const file = path.join(outDir, `${id}-${String(i + 1).padStart(2, "0")}-${b.effect}.jpg`);
  await renderStill({ serveUrl, composition, frame, output: file, imageFormat: "jpeg", jpegQuality: 85, browserExecutable });
  console.log("✓", path.relative(root, file), `(Frame ${frame})`);
}
console.log("Fertig. Bilder in out/check/ ansehen und prüfen.");
