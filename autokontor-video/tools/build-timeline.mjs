// Baut src/data/timeline.json aus skript.txt (+ optional Stimme und Wort-Timing).
//
// Quellen für das Timing, in dieser Reihenfolge:
//   1. public/voice-words.json   – Wort-Zeiten von Whisper (tools/timing.py)
//   2. public/voice-segments.json – Zeilen-Zeiten aus tools/voice.py (Wörter werden darin verteilt)
//   3. Schätzung (kein Audio)     – nur für die Vorschau
//
// Aufruf:  node tools/build-timeline.mjs            (Erklärvideo: skript.txt → src/data/timeline.json)
//          node tools/build-timeline.mjs tiktok30   (Fassung: skript-tiktok30.txt + public/tiktok30/ → src/data/timeline-tiktok30.json)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = (...x) => path.join(root, ...x);
const fassung = process.argv[2] ?? "";
const skriptFile = fassung ? `skript-${fassung}.txt` : "skript.txt";
// Einstellungen im Skript-Kopf, z. B.:  # stil: premium   # musik: musik-hell.mp3   # stimme: tiktok30
const settings = Object.fromEntries(
  fs
    .readFileSync(path.join(root, skriptFile), "utf8")
    .split(/\r?\n/)
    .map((l) => l.match(/^#\s*(stil|musik|stimme|laenge)\s*:\s*(\S+)/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);
const stimme = settings.stimme ?? fassung;
const audioDir = stimme ? `${stimme}/` : "";
const EFFECTS = ["slam", "glitch", "stretch", "flash", "morph", "type", "laptop", "lock", "os", "doc", "preis", "end",
  // Premium-Stil (src/premium/scenes.tsx)
  "chaos", "schluss", "logo", "kugel", "karten", "klick", "badges", "lokal", "wolke", "backup", "plattform", "kuendbar",
  // Nacht-Stil (src/nacht/scenes.tsx)
  "strasse", "stopp", "zuendung", "silhouetten", "cockpit", "schluessel", "leuchten", "rechner", "tacho", "kennzeichen", "preisschild", "finale",
  // Sport-Stil (src/sport/scenes.tsx)
  "fehlstart", "ampel", "teamlogo", "duell", "tabelle", "boxenstopp", "sektoren", "heimspiel", "rotekarte", "serie", "trikots", "startnummer", "flex", "zielflagge",
  // Motion-Stil (src/motion/scenes.tsx)
  "icons", "bigicon", "infokarte", "suchfeld", "bildkarten", "zaehler", "chart", "logoglow", "abschluss", "problem", "erechnung", "gobd", "geraete"];

// ---------- Skript lesen ----------
const beats = fs
  .readFileSync(p(skriptFile), "utf8")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"))
  .map((l, i) => {
    const m = l.match(/^(\w+)\s*\|\s*(.+)$/);
    if (!m) throw new Error(`${skriptFile} Zeile "${l}" hat nicht das Format "effekt | Text"`);
    const effect = m[1].toLowerCase();
    if (!EFFECTS.includes(effect)) throw new Error(`Unbekannter Effekt "${effect}". Erlaubt: ${EFFECTS.join(", ")}`);
    return { index: i, effect, text: m[2].trim(), words: m[2].trim().split(/\s+/).filter((w) => w !== "–" && w !== "-") };
  });

const norm = (w) => w.toLowerCase().normalize("NFKD").replace(/[^a-z0-9ß]/g, "");

// Wörter innerhalb eines Zeitfensters nach Länge verteilen
function spread(words, start, end) {
  const weights = words.map((w) => Math.max(2, norm(w).length) + 2);
  const total = weights.reduce((a, b) => a + b, 0);
  let t = start;
  return words.map((w, i) => {
    const d = ((end - start) * weights[i]) / total;
    const o = { w, start: t, end: t + d };
    t += d;
    return o;
  });
}

let source = "schaetzung";
let timed; // pro Beat: [{w,start,end}]

const wordsFile = p("public", audioDir, "voice-words.json");
const segFile = p("public", audioDir, "voice-segments.json");

if (fs.existsSync(wordsFile)) {
  // ---------- Whisper-Wörter an Skript-Wörter anpassen ----------
  source = "whisper";
  const heard = JSON.parse(fs.readFileSync(wordsFile, "utf8")).map((x) => ({ ...x, n: norm(x.word) }));
  let hi = 0;
  const flat = [];
  for (const b of beats) for (const w of b.words) flat.push({ beat: b.index, w, n: norm(w) });
  for (const f of flat) {
    let found = -1;
    for (let k = hi; k < Math.min(heard.length, hi + 4); k++) {
      const h = heard[k].n;
      if (h && f.n && (h === f.n || h.startsWith(f.n) || f.n.startsWith(h))) { found = k; break; }
    }
    if (found >= 0) { f.start = heard[found].start; f.end = heard[found].end; hi = found + 1; }
  }
  // Lücken interpolieren
  for (let i = 0; i < flat.length; i++) {
    if (flat[i].start != null) continue;
    let a = i - 1; while (a >= 0 && flat[a].start == null) a--;
    let b = i + 1; while (b < flat.length && flat[b].start == null) b++;
    const t0 = a >= 0 ? flat[a].end : 0;
    const t1 = b < flat.length ? flat[b].start : (heard.at(-1)?.end ?? t0 + 1);
    const n = b - a - 1;
    for (let k = a + 1; k < b; k++) {
      const j = k - a - 1;
      flat[k].start = t0 + ((t1 - t0) * j) / n;
      flat[k].end = t0 + ((t1 - t0) * (j + 1)) / n;
    }
    i = b - 1;
  }
  timed = beats.map((b) => flat.filter((f) => f.beat === b.index).map(({ w, start, end }) => ({ w, start, end })));
} else if (fs.existsSync(segFile)) {
  source = "zeilen";
  const segs = JSON.parse(fs.readFileSync(segFile, "utf8"));
  timed = beats.map((b, i) => spread(b.words, segs[i]?.start ?? 0, segs[i]?.end ?? 0));
} else {
  // ---------- Schätzung: energischer Sprecher ~ 2,9 Wörter/s ----------
  let t = 0.25;
  timed = beats.map((b) => {
    const out = b.words.map((w) => {
      const d = 0.16 + norm(w).length * 0.055;
      const o = { w, start: t, end: t + d };
      t += d + (/[.?!]$/.test(w) ? 0.22 : /[,;:]$/.test(w) ? 0.1 : 0.02);
      return o;
    });
    t += 0.08;
    return out;
  });
}

// ---------- Beats mit Start/Ende (Bild bleibt bis zum nächsten Beat) ----------
const timeline = beats.map((b, i) => ({
  effect: b.effect,
  text: b.text,
  words: timed[i],
  start: i === 0 ? 0 : Math.max(0, timed[i][0].start - 0.06),
}));
for (let i = 0; i < timeline.length; i++) {
  // letztes Bild: 2,8 s Nachlauf – oder bis zur festen Gesamtlänge (# laenge: 40), mindestens 1,2 s
  const lastEnd = timeline[i].words.at(-1).end;
  timeline[i].end = i < timeline.length - 1 ? timeline[i + 1].start : settings.laenge ? Math.max(lastEnd + 1.2, Number(settings.laenge)) : lastEnd + 2.8;
}

const has = (f) => fs.existsSync(p("public", f));
const sfx = Object.fromEntries(["impact", "whoosh", "glitch", "pop", "swish", "click", "ding", "ui-pop", "ui-click", "ui-ding", "ui-tick", "ui-swish", "ui-toggle"].map((n) => [n, has(`sfx/${n}.wav`) ? `sfx/${n}.wav` : null]));
const voice = has(`${audioDir}voice.wav`) ? `${audioDir}voice.wav` : has(`${audioDir}sprecher.mp3`) ? `${audioDir}sprecher.mp3` : null;
const music = settings.musik ? (has(settings.musik) ? settings.musik : null) : has("musik.mp3") ? "musik.mp3" : null;

const out = {
  stil: settings.stil ?? "tiktok",
  source,
  duration: timeline.at(-1).end,
  audio: { voice, music, sfx },
  screenshot: has("screenshot.png") ? "screenshot.png" : null,
  beats: timeline,
};
fs.mkdirSync(p("src", "data"), { recursive: true });
const outFile = fassung ? `timeline-${fassung}.json` : "timeline.json";
fs.writeFileSync(p("src", "data", outFile), JSON.stringify(out, null, 2));
console.log(`${outFile} gebaut: ${timeline.length} Bilder, ${out.duration.toFixed(1)} s, Timing: ${source}, Stimme: ${voice ?? "keine"}, Musik: ${music ?? "keine"}`);
