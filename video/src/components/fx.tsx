import React from 'react';
import {Easing, interpolate, random, spring, useCurrentFrame} from 'remotion';
import {C, FPS, HEIGHT, WIDTH, font} from '../theme';
import {clamp} from './anim';

// Bildeffekte für den „Premium“-Look: Kamera, Licht, Korn, Partikel, kinetische Schrift.

// Filmkorn: feines Rauschen, das jedes Frame springt (selbst erzeugt per SVG-Filter).
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.07}) => {
	const f = useCurrentFrame();
	const x = Math.floor(random(`gx${f}`) * 200) - 100;
	const y = Math.floor(random(`gy${f}`) * 200) - 100;
	return (
		<div style={{position: 'absolute', inset: -120, opacity, mixBlendMode: 'overlay', pointerEvents: 'none', transform: `translate(${x}px, ${y}px)`}}>
			<svg width={WIDTH + 240} height={HEIGHT + 240}>
				<filter id="grain">
					<feTurbulence type="fractalNoise" baseFrequency={0.85} numOctaves={2} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter="url(#grain)" />
			</svg>
		</div>
	);
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.55}) => (
	<div style={{position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse 85% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,${strength}) 100%)`}} />
);

// Weiche Farbflecken, die langsam wandern (Mesh-Gradient-Look).
export const GlowBlobs: React.FC<{colors?: string[]; opacity?: number}> = ({colors = ['#7b4dff', '#2f6bff', '#4ab0ff'], opacity = 0.35}) => {
	const f = useCurrentFrame();
	return (
		<div style={{position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none'}}>
			{colors.map((c, i) => {
				const x = 540 + Math.sin(f / (70 + i * 23) + i * 2.1) * 380 - 600;
				const y = 300 + i * 600 + Math.cos(f / (90 + i * 17) + i) * 220 - 600;
				return (
					<div
						key={i}
						style={{position: 'absolute', left: x, top: y, width: 1200, height: 1200, borderRadius: '50%', opacity, background: `radial-gradient(circle, ${c} 0%, ${c}00 65%)`}}
					/>
				);
			})}
		</div>
	);
};

// Schwebender Staub bzw. Bokeh-Lichter.
export const Particles: React.FC<{count?: number; color?: string; seed?: string; size?: [number, number]; speed?: number; opacity?: number}> = ({
	count = 28,
	color = 'rgba(255,220,160,1)',
	seed = 'p',
	size = [3, 9],
	speed = 0.6,
	opacity = 0.5,
}) => {
	const f = useCurrentFrame();
	return (
		<div style={{position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden'}}>
			{Array.from({length: count}).map((_, i) => {
				const r = (k: string) => random(`${seed}${k}${i}`);
				const s = size[0] + r('s') * (size[1] - size[0]);
				const y = (((r('y') * HEIGHT - f * speed * (0.5 + r('v'))) % HEIGHT) + HEIGHT) % HEIGHT;
				const x = r('x') * WIDTH + Math.sin(f / (40 + r('w') * 40) + i) * 30;
				const tw = 0.5 + 0.5 * Math.sin(f / (12 + r('t') * 20) + i);
				return (
					<div
						key={i}
						style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: color, opacity: opacity * (0.3 + 0.7 * tw), boxShadow: `0 0 ${s * 3}px ${color}`}}
					/>
				);
			})}
		</div>
	);
};

// Lichtkegel, z. B. einer Schreibtischlampe.
export const LightCone: React.FC<{x?: number; top?: number; color?: string; opacity?: number}> = ({x = 540, top = 0, color = '255,214,140', opacity = 0.18}) => {
	const f = useCurrentFrame();
	const o = opacity * (0.92 + Math.sin(f / 7) * 0.04 + Math.sin(f / 3.1) * 0.02);
	return (
		<div
			style={{
				position: 'absolute',
				left: x - 700,
				top,
				width: 1400,
				height: 1500,
				pointerEvents: 'none',
				background: `radial-gradient(ellipse 50% 70% at 50% 0%, rgba(${color},${o}) 0%, rgba(${color},0) 70%)`,
				clipPath: 'polygon(42% 0, 58% 0, 100% 100%, 0 100%)',
			}}
		/>
	);
};

// Ring, der sich vom Klickpunkt ausbreitet.
export const Ripple: React.FC<{at: number; x: number; y: number; color?: string; size?: number}> = ({at, x, y, color = C.blue, size = 220}) => {
	const f = useCurrentFrame() - at;
	if (f < 0 || f > 24) return null;
	const p = interpolate(f, [0, 24], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	return (
		<>
			{[0, 6].map((d) => {
				const q = interpolate(f - d, [0, 18], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
				return (
					<div
						key={d}
						style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: '50%', border: `6px solid ${color}`, transform: `scale(${0.2 + q * 1.4})`, opacity: (1 - q) * (1 - p * 0.3), pointerEvents: 'none'}}
					/>
				);
			})}
		</>
	);
};

// Lichtstreifen, der einmal über ein Element läuft (Element braucht overflow hidden und position relative).
export const Shine: React.FC<{at: number; dur?: number; radius?: number | string}> = ({at, dur = 22, radius = 0}) => {
	const f = useCurrentFrame() - at;
	if (f < 0 || f > dur) return null;
	const p = interpolate(f, [0, dur], [-60, 160], {...clamp, easing: Easing.inOut(Easing.cubic)});
	return (
		<div style={{position: 'absolute', inset: 0, borderRadius: radius, overflow: 'hidden', pointerEvents: 'none'}}>
			<div style={{position: 'absolute', top: '-50%', bottom: '-50%', left: `${p}%`, width: '35%', transform: 'rotate(20deg)', background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0) 100%)'}} />
		</div>
	);
};

// Wortweise Masken-Einblendung: jedes Wort gleitet aus einer unsichtbaren Kante nach oben.
export const RevealText: React.FC<{
	text: string;
	delay?: number;
	size?: number;
	color?: string;
	gradient?: string;
	weight?: number;
	align?: 'left' | 'center';
	stagger?: number;
	style?: React.CSSProperties;
}> = ({text, delay = 0, size = 90, color = C.ink, gradient, weight = 800, align = 'center', stagger = 3, style}) => {
	const f = useCurrentFrame() - delay;
	const words = text.split(' ');
	return (
		<div style={{fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.08, letterSpacing: -size * 0.025, textAlign: align, ...style}}>
			{words.map((w, i) => {
				const s = spring({frame: f - i * stagger, fps: FPS, config: {damping: 16, stiffness: 160, mass: 0.6}});
				return (
					<React.Fragment key={i}>
						{i > 0 && ' '}
						<span style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', padding: `0 ${size * 0.04}px ${size * 0.12}px`, margin: `0 0 ${-size * 0.12}px`}}>
							<span
								style={{
									display: 'inline-block',
									transform: `translateY(${(1 - s) * 115}%) rotate(${(1 - s) * 6}deg)`,
									...(gradient ? {background: gradient, WebkitBackgroundClip: 'text', color: 'transparent'} : {color}),
								}}
							>
								{w}
							</span>
						</span>
					</React.Fragment>
				);
			})}
		</div>
	);
};

// 3D-Einflug für Karten und Geräte: kippt aus der Tiefe nach vorn und schwebt danach leicht.
export const Tilt3D: React.FC<{children: React.ReactNode; delay?: number; from?: 'bottom' | 'right' | 'left'; float?: boolean; style?: React.CSSProperties}> = ({
	children,
	delay = 0,
	from = 'bottom',
	float = true,
	style,
}) => {
	const f = useCurrentFrame() - delay;
	const s = spring({frame: f, fps: FPS, config: {damping: 15, stiffness: 110, mass: 0.8}});
	const k = 1 - s;
	const rx = from === 'bottom' ? 38 * k : 0;
	const ry = from === 'right' ? -45 * k : from === 'left' ? 45 * k : 0;
	const tx = from === 'right' ? 500 * k : from === 'left' ? -500 * k : 0;
	const ty = from === 'bottom' ? 420 * k : 0;
	const fx = float ? Math.sin(f / 28) * 2.2 : 0;
	const fy = float ? Math.cos(f / 34) * 2.2 : 0;
	return (
		<div style={{perspective: 1800, ...style}}>
			<div
				style={{
					transform: `translate3d(${tx}px, ${ty + Math.sin(f / 30) * (float ? 6 : 0)}px, ${-300 * k}px) rotateX(${rx + fy}deg) rotateY(${ry + fx}deg)`,
					opacity: Math.min(1, s * 1.6),
					transformStyle: 'preserve-3d',
				}}
			>
				{children}
			</div>
		</div>
	);
};

// Kurzer Lichtblitz (z. B. beim Wendepunkt).
export const Flash: React.FC<{at: number; color?: string; dur?: number}> = ({at, color = '#ffffff', dur = 14}) => {
	const f = useCurrentFrame() - at;
	if (f < 0 || f > dur) return null;
	return <div style={{position: 'absolute', inset: 0, background: color, opacity: interpolate(f, [0, 2, dur], [0, 0.85, 0], clamp), pointerEvents: 'none'}} />;
};
