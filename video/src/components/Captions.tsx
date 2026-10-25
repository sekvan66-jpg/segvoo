import React from 'react';
import {interpolate, spring, useCurrentFrame} from 'remotion';
import {CAPTIONS} from '../timing';
import {C, FPS, font} from '../theme';
import {clamp} from './anim';
import {RevealText} from './fx';

// Untertitel im TikTok-Stil: Wort für Wort, das gerade gesprochene Wort leuchtet.
// Die Wortzeiten innerhalb eines Häppchens werden nach Zeichenlänge verteilt.
export const Captions: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const cap = CAPTIONS.find((c) => t >= c.from && t < c.to);
	if (!cap) return null;
	const isMehmet = cap.speaker === 'M';
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
	const accent = isMehmet ? '#c9b6ff' : '#ffd84d';
	return (
		<div style={{position: 'absolute', left: 50, right: 50, top: 1390, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - boxIn) * 30}px) scale(${0.94 + boxIn * 0.06})`}}>
			<div
				style={{
					fontFamily: font,
					fontSize: 66,
					fontWeight: 800,
					lineHeight: 1.18,
					letterSpacing: -1,
					textAlign: 'center',
					fontStyle: isMehmet ? 'italic' : 'normal',
					padding: '18px 30px',
					borderRadius: 28,
					background: isMehmet ? 'rgba(80,45,190,0.78)' : 'rgba(8,10,30,0.7)',
					backdropFilter: 'blur(14px)',
					boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
					border: '1.5px solid rgba(255,255,255,0.14)',
				}}
			>
				{isMehmet && <span style={{color: accent}}>„</span>}
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
									opacity: seen ? interpolate(wf, [0, 3], [0.55, 1], clamp) : 0.55,
									transform: `translateY(${seen ? (1 - s) * 14 : 0}px) scale(${active ? 1 + 0.06 * s : 1})`,
									textShadow: active ? `0 0 28px ${accent}88, 0 4px 14px rgba(0,0,0,0.5)` : '0 4px 14px rgba(0,0,0,0.5)',
								}}
							>
								{w}
							</span>
						</React.Fragment>
					);
				})}
				{isMehmet && <span style={{color: accent}}>“</span>}
			</div>
		</div>
	);
};

// Kinetisches Stichwort: Wörter gleiten aus einer Maske, danach leichtes Atmen.
export const Keyword: React.FC<{text: string; color?: string; size?: number; delay?: number; gradient?: string}> = ({text, color = C.white, size = 90, delay = 0, gradient}) => {
	const f = useCurrentFrame() - delay;
	const breathe = 1 + Math.sin(f / 14) * 0.008;
	const glow = color !== C.ink && !gradient ? `drop-shadow(0 0 ${size * 0.35}px ${color}66)` : undefined;
	return (
		<div style={{transform: `scale(${breathe})`, filter: glow}}>
			<RevealText text={text} delay={delay} size={size} color={color} gradient={gradient} />
		</div>
	);
};
