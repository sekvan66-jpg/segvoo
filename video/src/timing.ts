import timingOverride from './timing-whisper.json';

// Die mobile.de-Zeile (Szene 4b) kommt nur ins Video, wenn der Knopf „In DB übernehmen“
// mit dem echten Händlerbereich getestet ist (Briefing). Bis dahin: false.
export const SHOW_MOBILEDE = false;

export type SceneId = 's1' | 's2a' | 's2b' | 's2c' | 's3' | 's4a' | 's4b' | 's4c' | 's5' | 's6' | 'end';

// Zeiten in Sekunden aus obsidian/Skript.md (Schätzung nach Textlänge).
// Schritt 5 (Whisper) schreibt die gemessenen Zeiten nach timing-whisper.json; die haben Vorrang.
const ESTIMATE: Record<SceneId, [number, number]> = {
	s1: [0, 6],
	s2a: [6, 14],
	s2b: [14, 24],
	s2c: [24, 29],
	s3: [29, 32],
	s4a: [32, 37],
	s4b: [37, 50],
	s4c: [50, 57],
	s5: [57, 68],
	s6: [68, 81],
	end: [81, 85],
};

type Override = {scenes?: Partial<Record<SceneId, [number, number]>>; captions?: Caption[]};
// Die JSON kennt nur number[], keine Tupel; Aufbau siehe tools/schritt5_whisper.py.
const override = timingOverride as unknown as Override;

export const SCENES: Record<SceneId, [number, number]> = {...ESTIMATE, ...(override.scenes ?? {})};
export const TOTAL_SECONDS = SCENES.end[1];

export type Caption = {text: string; from: number; to: number; speaker: 'E' | 'M'};

// Sprechertext je Szene, in Untertitel-Häppchen geteilt.
const LINES: {scene: SceneId; speaker: 'E' | 'M'; chunks: string[]; optional?: boolean}[] = [
	{scene: 's1', speaker: 'E', chunks: ['Mehmet verkauft gute Autos.', 'Und trotzdem hat er jede Nacht', 'Angst vor dem Briefkasten.']},
	{scene: 's2a', speaker: 'E', chunks: ['Das Finanzamt will Belege sehen.', 'Mehmet findet sie nicht.', 'Rechnungen in der Schublade,', 'Verträge im Handschuhfach,', 'der Rest im Kopf.']},
	{scene: 's2b', speaker: 'E', chunks: ['Beim Einkauf ist er zu langsam.', 'Der andere Händler', 'schnappt sich das Auto.', 'Und was genau er im Bestand hat,', 'weiß er nur ungefähr.']},
	{scene: 's2c', speaker: 'M', chunks: ['Ich arbeite mehr als alle', 'und habe trotzdem nichts im Griff.']},
	{scene: 's3', speaker: 'E', chunks: ['So kann es nicht weitergehen.']},
	{scene: 's4a', speaker: 'E', chunks: ['Dann findet er DB-Automobile.', 'Alles auf Deutsch,', 'alles an einem Ort.']},
	{scene: 's4b', speaker: 'E', chunks: ['Fahrzeug anlegen, Fotos dazu.', 'Kaufvertrag als PDF,', 'mit einem Klick.', 'Rechnungen,', 'auch als E-Rechnung.']},
	{scene: 's4b', speaker: 'E', optional: true, chunks: ['Ein Auto von mobile.de?', 'Ein Klick, und es ist', 'mit Fotos im Bestand.']},
	{scene: 's4b', speaker: 'E', chunks: ['Fahrgestellnummer eingeben,', 'Fahrzeug-Check als PDF.']},
	{scene: 's4c', speaker: 'E', chunks: ['Rechnungen werden gesperrt', 'und protokolliert,', 'Sicherungen laufen', 'jeden Tag automatisch.', 'Und per Google-Konto', 'hat er alles auch auf dem Handy.']},
	{scene: 's5', speaker: 'E', chunks: ['Mehmet kauft schneller ein,', 'weil er seinen Bestand sieht.', 'Und als der nächste Brief kommt,', 'hat er die Unterlagen in Sekunden.']},
	{scene: 's5', speaker: 'M', chunks: ['Zum ersten Mal schlafe ich gut.']},
	{scene: 's6', speaker: 'E', chunks: ['Fair gesagt:', 'DB-Automobile ersetzt', 'keinen Steuerberater.', 'Der Fahrzeug-Check zeigt bei EU-Autos', 'oft nur Hersteller und Basisdaten,', 'Rückrufdaten kommen nur aus den USA.', 'Ein voller Verlaufsbericht,', 'etwa bei carVertical, kostet Geld.', 'Dafür: einfach, deutsch,', 'für kleine Händler.']},
];

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

// Verteilt die Häppchen einer Szene nach Wortzahl auf deren Dauer (mit kurzem Vor- und Nachlauf).
function estimateCaptions(): Caption[] {
	const out: Caption[] = [];
	const byScene = new Map<SceneId, typeof LINES>();
	for (const l of LINES) {
		if (l.optional && !SHOW_MOBILEDE) continue;
		byScene.set(l.scene, [...(byScene.get(l.scene) ?? []), l]);
	}
	for (const [scene, lines] of byScene) {
		const [a, b] = SCENES[scene];
		const start = a + 0.3;
		const end = b - 0.3;
		const all = lines.flatMap((l) => l.chunks.map((text) => ({text, speaker: l.speaker})));
		const total = all.reduce((n, c) => n + words(c.text), 0);
		let t = start;
		for (const c of all) {
			const d = ((end - start) * words(c.text)) / total;
			out.push({text: c.text, from: t, to: t + d, speaker: c.speaker});
			t += d;
		}
	}
	return out.sort((x, y) => x.from - y.from);
}

export const CAPTIONS: Caption[] = override.captions ?? estimateCaptions();
