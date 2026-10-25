// Kopiert die Audiodateien aus ../audio (Schritt 4) nach public/audio
// und schreibt src/audio-files.json (Dateiname → Länge in Sekunden).
import {execFileSync} from 'node:child_process';
import {cpSync, existsSync, readdirSync, writeFileSync} from 'node:fs';
import {join, relative} from 'node:path';

const src = new URL('../../audio', import.meta.url).pathname;
const dst = new URL('../public/audio', import.meta.url).pathname;
const out = new URL('../src/audio-files.json', import.meta.url).pathname;

const list = {};
if (existsSync(src)) {
	cpSync(src, dst, {recursive: true});
	const walk = (dir) => {
		for (const e of readdirSync(dir, {withFileTypes: true})) {
			const p = join(dir, e.name);
			if (e.isDirectory()) walk(p);
			else if (p.endsWith('.mp3')) {
				const s = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', p]).toString().trim();
				list[relative(dst, p)] = Number(s);
			}
		}
	};
	walk(dst);
}
writeFileSync(out, JSON.stringify(list, null, 2) + '\n');
console.log(`${Object.keys(list).length} Audiodateien eingebunden`);
