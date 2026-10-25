import React from 'react';
import {interpolate, spring, useCurrentFrame} from 'remotion';
import {CAPTIONS, SCENES} from '../timing';
import {C, FPS, font} from '../theme';
import {clamp} from './anim';
import {RevealText} from './fx';

// Untertitel ohne Kasten: Wort für Wort, das gerade gesprochene Wort leuchtet.
// Die Wortzeiten innerhalb eines Häppchens werden nach Zeichenlänge verteilt.
export const Captions: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const cap = CAPTIONS.find((c) => t >= c.from && t < c.to);
	// Mehmets Sätze und Szene 3 stehen schon als große Typo im Bild.
	if (!cap || cap.speaker === 'M' || (t >= SCENES.s3[0] && t < SCENES.s3[1])) return null;
	const words = cap.text.split(' ');
	const total = words.reduce((n, w) => n + w.length + 1, 0);
	// Sprechdauer ohne den Nachlauf am Ende des Häppchens.
	const speak = Math.max(0.3, (cap.to - cap.from) * 0.85);
	let acc = 0;
	const starts = words.map((w) => {
		const s = cap.from + (speak * acc) / total;
		acc += w.length + 1;
		return s;
	});
	const local = (t - cap.from) * FPS;
	const boxIn = spring({frame: local, fps: FPS, config: {damping: 18, stiffness: 220, mass: 0.6}});
	const accent = '#a9c1ff';
	return (
		<div style={{position: 'absolute', left: 50, right: 50, top: 1390, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - boxIn) * 30}px) scale(${0.94 + boxIn * 0.06})`}}>
			<div
				style={{
					fontFamily: font,
					fontSize: 62,
					fontWeight: 700,
					lineHeight: 1.2,
					letterSpacing: -1,
					textAlign: 'center',
				}}
			>
				{words.map((w, i) => {
					const wf = (t - starts[i]) * FPS;
					const next = i + 1 < words.length ? starts[i + 1] : cap.to;
					const active = t >= starts[i] && t < next;
					const s = spring({frame: wf, fps: FPS, config: {damping: 12, stiffness: 260, mass: 0.5}});
					const seen = wf >= 0;
					return (
						<React.Fragment key={i}>
							{i > 0 && ' '}
							<span
								style={{
									display: 'inline-block',
									margin: '0 0.07em',
									color: active ? accent : C.white,
									opacity: seen ? interpolate(wf, [0, 3], [0.45, 1], clamp) : 0.45,
									transform: `translateY(${seen ? (1 - s) * 14 : 0}px)`,
									textShadow: active ? `0 0 30px ${accent}aa, 0 4px 18px rgba(0,0,0,0.8)` : '0 4px 18px rgba(0,0,0,0.8)',
								}}
							>
								{w}
							</span>
						</React.Fragment>
					);
				})}
			</div>
		</div>
	);
};

// Kinetisches Stichwort: Wörter gleiten aus einer Maske, danach leichtes Atmen.
export const Keyword: React.FC<{text: string; color?: string; size?: number; delay?: number; gradient?: string; align?: 'left' | 'center'}> = ({
	text,
	color = C.white,
	size = 90,
	delay = 0,
	gradient,
	align = 'center',
}) => {
	const f = useCurrentFrame() - delay;
	const breathe = 1 + Math.sin(f / 14) * 0.008;
	const glow = color !== C.ink && !gradient ? `drop-shadow(0 0 ${size * 0.35}px ${color}66)` : undefined;
	return (
		<div style={{transform: `scale(${breathe})`, transformOrigin: align === 'left' ? 'left center' : 'center', filter: glow}}>
			<RevealText text={text} delay={delay} size={size} color={color} gradient={gradient} align={align} />
		</div>
	);
};
