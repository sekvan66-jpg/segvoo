import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, font} from '../theme';
import {GlowBlobs, Particles} from './fx';

// Dunkle Bühne für alle Szenen: tiefes Nachtblau, Licht in der Stimmung der Szene, feines Raster in Perspektive.
export type Tone = 'cold' | 'warn' | 'violet' | 'black' | 'brand' | 'warm';

const TONES: Record<Tone, {bg: string; glow: string[]; glowOpacity: number; dust: string}> = {
	cold: {bg: '#05070f', glow: ['#1d3a8a', '#24306b', '#14204f'], glowOpacity: 0.55, dust: 'rgba(170,190,255,1)'},
	warn: {bg: '#07060c', glow: ['#7a1f2a', '#2a1f5c', '#5a1a24'], glowOpacity: 0.5, dust: 'rgba(255,170,160,1)'},
	violet: {bg: '#06050f', glow: ['#3a1f8a', '#1d1a55', '#4b2399'], glowOpacity: 0.55, dust: 'rgba(200,180,255,1)'},
	black: {bg: '#020205', glow: [], glowOpacity: 0, dust: 'rgba(150,160,220,1)'},
	brand: {bg: '#060818', glow: ['#2f6bff', '#7b4dff', '#3b2fb0'], glowOpacity: 0.45, dust: 'rgba(200,210,255,1)'},
	warm: {bg: '#0a0810', glow: ['#2f6bff', '#c9852f', '#7b4dff'], glowOpacity: 0.4, dust: 'rgba(255,220,170,1)'},
};

const Grid: React.FC<{opacity?: number}> = ({opacity = 0.16}) => {
	const f = useCurrentFrame();
	const off = (f * 0.8) % 80;
	return (
		<div style={{position: 'absolute', left: -600, right: -600, bottom: -200, height: 1100, perspective: 900, opacity, pointerEvents: 'none'}}>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					transform: 'rotateX(72deg)',
					transformOrigin: 'bottom',
					backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.5) 2px, transparent 2px)',
					backgroundSize: '80px 80px',
					backgroundPosition: `0 ${off}px`,
					WebkitMaskImage: 'linear-gradient(to top, #000 0%, rgba(0,0,0,0) 85%)',
				}}
			/>
		</div>
	);
};

export const Stage: React.FC<{tone: Tone; children?: React.ReactNode; grid?: boolean; dust?: number}> = ({tone, children, grid = true, dust = 22}) => {
	const t = TONES[tone];
	return (
		<div style={{position: 'absolute', inset: 0, background: t.bg, overflow: 'hidden', fontFamily: font}}>
			{t.glow.length > 0 && <GlowBlobs colors={t.glow} opacity={t.glowOpacity} />}
			{grid && <Grid />}
			{dust > 0 && <Particles seed={tone} count={dust} color={t.dust} size={[2, 6]} speed={0.35} opacity={0.45} />}
			{children}
		</div>
	);
};

// Glas-Karte: halbtransparent, feiner heller Rand.
export const Glass: React.FC<{children: React.ReactNode; style?: React.CSSProperties; glow?: string}> = ({children, style, glow}) => (
	<div
		style={{
			background: 'linear-gradient(160deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.04) 100%)',
			border: '1.5px solid rgba(255,255,255,0.16)',
			borderRadius: 32,
			backdropFilter: 'blur(24px)',
			boxShadow: `0 40px 100px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)${glow ? `, 0 0 80px ${glow}` : ''}`,
			color: C.white,
			fontFamily: font,
			...style,
		}}
	>
		{children}
	</div>
);

// Kleines Etikett, z. B. „Autohändler“.
export const Tag: React.FC<{children: React.ReactNode; color?: string; style?: React.CSSProperties}> = ({children, color = 'rgba(255,255,255,0.85)', style}) => (
	<div
		style={{
			display: 'inline-flex',
			alignItems: 'center',
			gap: 14,
			padding: '12px 26px',
			borderRadius: 999,
			border: `2px solid ${color}55`,
			background: `${color}14`,
			color,
			fontFamily: font,
			fontWeight: 600,
			fontSize: 34,
			letterSpacing: 2,
			textTransform: 'uppercase',
			...style,
		}}
	>
		<div style={{width: 12, height: 12, borderRadius: 99, background: color, boxShadow: `0 0 16px ${color}`}} />
		{children}
	</div>
);

// Sauberes Dokument (Vertrag, Rechnung, Bericht) statt Comic-Papier.
export const DocCard: React.FC<{title: string; w?: number; badge?: string; badgeColor?: string; sub?: string; style?: React.CSSProperties}> = ({
	title,
	w = 300,
	badge,
	badgeColor = '#e5484d',
	sub,
	style,
}) => (
	<div
		style={{
			width: w,
			height: w * 1.32,
			background: 'linear-gradient(180deg, #ffffff 0%, #f3f5fc 100%)',
			borderRadius: w * 0.06,
			padding: w * 0.09,
			boxSizing: 'border-box',
			boxShadow: '0 30px 70px rgba(0,0,0,0.45)',
			fontFamily: font,
			position: 'relative',
			overflow: 'hidden',
			...style,
		}}
	>
		<div style={{fontSize: w * 0.1, fontWeight: 800, color: C.ink, letterSpacing: -w * 0.002}}>{title}</div>
		{sub && <div style={{fontSize: w * 0.055, color: C.muted, marginTop: w * 0.02}}>{sub}</div>}
		<div style={{marginTop: w * 0.08}}>
			{[92, 78, 85, 60, 88, 70].map((p, i) => (
				<div key={i} style={{height: w * 0.028, width: `${p}%`, background: '#dfe3f1', borderRadius: 99, marginBottom: w * 0.055}} />
			))}
		</div>
		{badge && (
			<div style={{position: 'absolute', left: w * 0.09, bottom: w * 0.09, background: badgeColor, color: '#fff', fontWeight: 800, fontSize: w * 0.075, padding: `${w * 0.025}px ${w * 0.06}px`, borderRadius: w * 0.03}}>
				{badge}
			</div>
		)}
	</div>
);

type L = {size?: number; color?: string; stroke?: number};
const Svg: React.FC<L & {children: React.ReactNode}> = ({size = 120, color = '#fff', stroke = 5, children}) => (
	<svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
		{children}
	</svg>
);

// Linien-Icons im einheitlichen Strich.
export const Line = {
	Mail: (p: L) => (
		<Svg {...p}>
			<rect x={12} y={24} width={76} height={54} rx={8} />
			<path d="M14 28 L50 54 L86 28" />
		</Svg>
	),
	Search: (p: L) => (
		<Svg {...p}>
			<circle cx={44} cy={44} r={24} />
			<path d="M62 62 L84 84" />
		</Svg>
	),
	Drawer: (p: L) => (
		<Svg {...p}>
			<rect x={14} y={20} width={72} height={62} rx={6} />
			<path d="M14 50 H86" />
			<path d="M42 35 H58 M42 66 H58" />
		</Svg>
	),
	Car: (p: L) => (
		<Svg {...p}>
			<path d="M10 62 V52 L22 48 L34 34 H66 L78 48 L90 52 V62 H10 Z" />
			<circle cx={28} cy={64} r={8} />
			<circle cx={72} cy={64} r={8} />
			<path d="M38 38 L32 48 H68 L62 38" />
		</Svg>
	),
	Brain: (p: L) => (
		<Svg {...p}>
			<path d="M50 20 C36 14 22 24 26 38 C14 42 16 60 28 62 C28 76 44 82 50 72 C56 82 72 76 72 62 C84 60 86 42 74 38 C78 24 64 14 50 20 Z" />
			<path d="M50 22 V72" />
			<path d="M36 40 Q42 44 50 42 M64 54 Q58 50 50 52" />
		</Svg>
	),
	Pen: (p: L) => (
		<Svg {...p}>
			<path d="M70 14 L86 30 L38 78 L18 82 L22 62 Z" />
			<path d="M62 22 L78 38" />
		</Svg>
	),
	Clock: (p: L) => (
		<Svg {...p}>
			<circle cx={50} cy={52} r={34} />
			<path d="M50 32 V52 L64 60" />
		</Svg>
	),
	Lock: (p: L) => (
		<Svg {...p}>
			<rect x={22} y={44} width={56} height={42} rx={8} />
			<path d="M34 44 V32 a16 16 0 0 1 32 0 V44" />
			<path d="M50 60 V70" />
		</Svg>
	),
	Shield: (p: L) => (
		<Svg {...p}>
			<path d="M50 12 L82 24 V48 C82 68 68 82 50 88 C32 82 18 68 18 48 V24 Z" />
			<path d="M36 50 L46 60 L66 40" />
		</Svg>
	),
	Cloud: (p: L) => (
		<Svg {...p}>
			<path d="M28 74 H72 A16 16 0 0 0 72 42 A22 22 0 0 0 30 40 A17 17 0 0 0 28 74 Z" />
		</Svg>
	),
	Phone: (p: L) => (
		<Svg {...p}>
			<rect x={30} y={10} width={40} height={80} rx={8} />
			<path d="M45 80 H55" />
		</Svg>
	),
	Info: (p: L) => (
		<Svg {...p}>
			<circle cx={50} cy={50} r={38} />
			<path d="M50 46 V70" />
			<path d="M50 32 V33" />
		</Svg>
	),
	Check: (p: L) => (
		<Svg {...p}>
			<path d="M24 52 L42 70 L78 32" />
		</Svg>
	),
	X: (p: L) => (
		<Svg {...p}>
			<path d="M28 28 L72 72 M72 28 L28 72" />
		</Svg>
	),
	Doc: (p: L) => (
		<Svg {...p}>
			<path d="M24 10 H60 L78 28 V90 H24 Z" />
			<path d="M60 10 V28 H78" />
			<path d="M36 46 H66 M36 58 H66 M36 70 H54" />
		</Svg>
	),
	Moon: (p: L) => (
		<Svg {...p}>
			<path d="M66 18 A34 34 0 1 0 82 64 A28 28 0 1 1 66 18 Z" />
		</Svg>
	),
};

// Icon im leuchtenden Kreis.
export const IconRing: React.FC<{children: React.ReactNode; color?: string; size?: number}> = ({children, color = C.blue, size = 200}) => (
	<div
		style={{
			width: size,
			height: size,
			borderRadius: '50%',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			background: `radial-gradient(circle at 50% 35%, ${color}55 0%, ${color}18 70%)`,
			border: `2px solid ${color}88`,
			boxShadow: `0 0 60px ${color}66, inset 0 0 30px ${color}33`,
		}}
	>
		{children}
	</div>
);
