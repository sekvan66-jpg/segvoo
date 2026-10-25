import {CAPTIONS, SCENES, SceneId} from './timing';

// Startzeit (s) des Untertitels, der mit text beginnt; sonst Anteil p der Szene.
export const capFrom = (scene: SceneId, text: string, p: number) => {
	const [a, b] = SCENES[scene];
	const c = CAPTIONS.find((x) => x.from >= a - 0.01 && x.from < b && x.text.startsWith(text));
	return c ? c.from : a + (b - a) * p;
};

// Zeitpunkte relativ zum Szenenbeginn (s). Bild und Ton nutzen dieselben Werte.
export const rel = (scene: SceneId, text: string, p: number) => capFrom(scene, text, p) - SCENES[scene][0];

export const CUES = {
	mailbox: () => rel('s1', 'Angst vor dem Briefkasten', 0.6),
	letterDrop: () => 0.4,
	panels: () => rel('s2a', 'Rechnungen in der Schublade', 0.45),
	glovebox: () => rel('s2a', 'Verträge im Handschuhfach', 0.65),
	head: () => rel('s2a', 'der Rest im Kopf', 0.85),
	carOff: () => rel('s2b', 'Der andere Händler', 0.35),
	blurry: () => rel('s2b', 'Und was genau', 0.65),
	loginClick: () => rel('s4a', 'Alles auf Deutsch', 0.45),
	b4Vehicle: () => 0,
	b4Contract: () => rel('s4b', 'Kaufvertrag als PDF', 0.25),
	b4Invoice: () => rel('s4b', 'Rechnungen,', 0.45),
	b4Mobile: () => rel('s4b', 'Ein Auto von mobile.de', 0.6),
	b4Vin: () => rel('s4b', 'Fahrgestellnummer', 0.75),
	c4Backup: () => rel('s4c', 'Sicherungen laufen', 0.33),
	c4Phone: () => rel('s4c', 'Und per Google-Konto', 0.6),
	s5Letter: () => rel('s5', 'Und als der nächste Brief', 0.45),
	s5Pdf: () => rel('s5', 'hat er die Unterlagen', 0.6),
	s5Smile: () => rel('s5', 'Zum ersten Mal', 0.82),
	s6Limits: () => [
		rel('s6', 'DB-Automobile ersetzt', 0.08),
		rel('s6', 'Der Fahrzeug-Check', 0.3),
		rel('s6', 'Rückrufdaten', 0.5),
		rel('s6', 'Ein voller Verlaufsbericht', 0.62),
	],
	s6Checks: () => rel('s6', 'Dafür:', 0.82),
};
