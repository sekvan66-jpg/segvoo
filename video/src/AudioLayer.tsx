import React from 'react';
import {Audio, interpolate, Sequence, staticFile} from 'remotion';
import files from './audio-files.json';
import {CUES} from './cues';
import {SCENES, SHOW_MOBILEDE, SceneId, TOTAL_SECONDS} from './timing';
import {sec} from './theme';

// Welche Audiodateien vorhanden sind, schreibt scripts/sync-audio.mjs (Dateiname → Länge in s).
const AVAILABLE = files as Record<string, number>;
const has = (f: string) => f in AVAILABLE;

// Sprachdateien aus Schritt 4 je Szene, in Sprechreihenfolge.
const VOICE: [SceneId, string][] = [
	['s1', 'sprache/01_hook.mp3'],
	['s2a', 'sprache/02a_problem.mp3'],
	['s2b', 'sprache/02b_problem.mp3'],
	['s2c', 'sprache/02c_mehmet.mp3'],
	['s3', 'sprache/03_tiefpunkt.mp3'],
	['s4a', 'sprache/04a_wende.mp3'],
	['s4b', 'sprache/04b1_funktionen.mp3'],
	['s4b', 'sprache/04b2_mobilede_OPTIONAL.mp3'],
	['s4b', 'sprache/04b3_fahrzeugcheck.mp3'],
	['s4c', 'sprache/04c_sicherheit.mp3'],
	['s5', 'sprache/05a_happyend.mp3'],
	['s5', 'sprache/05b_mehmet.mp3'],
	['s6', 'sprache/06_ehrlich.mp3'],
];

const at = (scene: SceneId, rel: number) => SCENES[scene][0] + rel;

const SFX: [string, number, number][] = [
	['sfx/briefkastenklappe.mp3', at('s1', CUES.mailbox()) + 0.15, 0.8],
	['sfx/papierrascheln.mp3', at('s2a', 0.8), 0.6],
	['sfx/kugelschreiber.mp3', at('s2b', 0.3), 0.5],
	['sfx/motor.mp3', at('s2b', CUES.carOff() + 0.3), 0.6],
	['sfx/klick.mp3', at('s4a', CUES.loginClick()), 0.8],
	['sfx/swoosh.mp3', at('s4a', CUES.loginClick() + 0.15), 0.7],
	['sfx/klick.mp3', at('s4b', 0.25), 0.7],
	['sfx/klick.mp3', at('s4b', CUES.b4Contract() + 0.1), 0.7],
	['sfx/klick.mp3', at('s4b', CUES.b4Invoice() + 0.1), 0.7],
	...(SHOW_MOBILEDE ? ([['sfx/klick.mp3', at('s4b', CUES.b4Mobile() + 0.35), 0.7]] as [string, number, number][]) : []),
	['sfx/klick.mp3', at('s4b', CUES.b4Vin() + 1.3), 0.7],
	['sfx/erfolgston.mp3', at('s5', CUES.s5Pdf()), 0.7],
];

export const AudioLayer: React.FC = () => {
	// Sprache: Zeilen einer Szene laufen nacheinander, mit kurzer Pause.
	const voice: {file: string; from: number}[] = [];
	const cursor: Partial<Record<SceneId, number>> = {};
	for (const [scene, file] of VOICE) {
		if (!has(file)) continue;
		if (file.includes('_OPTIONAL') && !SHOW_MOBILEDE) continue;
		const from = cursor[scene] ?? SCENES[scene][0] + 0.3;
		voice.push({file, from});
		cursor[scene] = from + AVAILABLE[file] + 0.25;
	}
	const total = sec(TOTAL_SECONDS);
	return (
		<>
			{has('musik/musik_85s.mp3') && (
				<Audio
					src={staticFile('audio/musik/musik_85s.mp3')}
					// Musik leise unter der Sprache, am Ende ausblenden.
					volume={(f) => interpolate(f, [0, 10, total - 45, total], [0, 0.22, 0.22, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
				/>
			)}
			{voice.map(({file, from}) => (
				<Sequence key={file} from={sec(from)} layout="none">
					<Audio src={staticFile(`audio/${file}`)} />
				</Sequence>
			))}
			{SFX.filter(([file]) => has(file)).map(([file, t, vol], i) => (
				<Sequence key={`${file}-${i}`} from={sec(t)} layout="none">
					<Audio src={staticFile(`audio/${file}`)} volume={vol} />
				</Sequence>
			))}
		</>
	);
};
