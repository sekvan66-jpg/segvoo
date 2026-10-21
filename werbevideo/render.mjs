// Renders video.html frame by frame and encodes it to MP4 with ffmpeg.
// Usage: node render.mjs [out.mp4] [--fps 30] [--stills 1,5,12]
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

// Use a local playwright if installed, otherwise the global one
const { chromium } = await import('playwright').catch(() => {
  const root = execSync('npm root -g').toString().trim();
  return import(pathToFileURL(path.join(root, 'playwright', 'index.mjs')).href);
});

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const out = args[0] && !args[0].startsWith('--') ? path.resolve(args[0]) : path.join(here, 'autokontor-werbevideo.mp4');
const fps = Number(opt('--fps', 30));
const stills = opt('--stills', null);
const audio = path.join(here, 'musik.wav');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(pathToFileURL(path.join(here, 'video.html')).href);
await page.evaluate(() => document.fonts.ready);
const duration = await page.evaluate(() => window.DURATION);

if (stills) {
  for (const s of stills.split(',').map(Number)) {
    await page.evaluate(t => window.render(t), s);
    await page.screenshot({ path: path.join(path.dirname(out), `still-${s}.png`) });
  }
  await browser.close();
  process.exit(0);
}

const ffArgs = ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-'];
if (fs.existsSync(audio)) ffArgs.push('-i', audio, '-c:a', 'aac', '-b:a', '192k', '-shortest');
ffArgs.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out);
const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });

const total = Math.round(duration * fps);
for (let i = 0; i < total; i++) {
  await page.evaluate(t => window.render(t), i / fps);
  const buf = await page.screenshot({ type: 'png' });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % fps === 0) process.stderr.write(`\rFrame ${i}/${total}`);
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
await browser.close();
console.log(`\nFertig: ${out}`);
