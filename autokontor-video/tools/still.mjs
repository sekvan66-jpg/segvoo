// Rendert einzelne Standbilder bestimmter Frames nach out/still/ (zum gezielten Prüfen).
// Aufruf:  node tools/still.mjs <Komposition> <frame> [frame …]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill } from "@remotion/renderer";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [id, ...frames] = process.argv.slice(2);
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const outDir = path.join(root, "out", "still");
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts") });
const chromiumOptions = { gl: "angle" };
const composition = await selectComposition({ serveUrl, id, browserExecutable, chromiumOptions });
for (const f of frames.map(Number)) {
  const file = path.join(outDir, `${id}-${String(f).padStart(4, "0")}.jpg`);
  await renderStill({ serveUrl, composition, frame: f, output: file, imageFormat: "jpeg", jpegQuality: 85, browserExecutable, chromiumOptions });
  console.log("✓", path.relative(root, file));
}
