import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/800.css';

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const font = 'Inter, sans-serif';

// Farben nach dem Look von DB-Automobile (Briefing): Nachtblau bis Violett, helle App mit Blau-Lavendel-Verlauf.
export const C = {
	night: '#0d1333',
	nightDeep: '#070a1f',
	violetDark: '#3a2380',
	blue: '#2f6bff',
	violet: '#7b4dff',
	lavender: '#ece8ff',
	appBg: 'linear-gradient(160deg, #eef3ff 0%, #f2edff 100%)',
	brandGradient: 'linear-gradient(90deg, #2f6bff 0%, #7b4dff 100%)',
	white: '#ffffff',
	ink: '#1b1f3b',
	muted: '#6b7194',
	paper: '#f7f3e8',
	paperLine: '#c9c2ad',
	green: '#22b573',
	warn: '#ff8a3d',
	skin: '#c98d62',
	hair: '#2a1d16',
	shirtNight: '#4a5a8c',
	shirtDay: '#2f6bff',
	desk: '#6b4a34',
	deskDay: '#c99a6b',
};

export const sec = (s: number) => Math.round(s * FPS);
