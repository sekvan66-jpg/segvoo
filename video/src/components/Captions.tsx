import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {CAPTIONS} from '../timing';
import {C, FPS, font} from '../theme';
import {clamp} from './anim';

// Untertitel im unteren Drittel, für Ansehen ohne Ton (TikTok, Reels).
export const Captions: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const cap = CAPTIONS.find((c) => t >= c.from && t < c.to);
	if (!cap) return null;
	const local = (t - cap.from) * FPS;
	const opacity = interpolate(local, [0, 4], [0, 1], clamp);
	const y = interpolate(local, [0, 6], [20, 0], clamp);
	const isMehmet = cap.speaker === 'M';
	return (
		<div style={{position: 'absolute', left: 60, right: 60, top: 1420, display: 'flex', justifyContent: 'center', opacity, transform: `translateY(${y}px)`}}>
			<div
				style={{
					fontFamily: font,
					fontSize: 58,
					fontWeight: 800,
					lineHeight: 1.2,
					textAlign: 'center',
					color: C.white,
					background: isMehmet ? 'rgba(123,77,255,0.88)' : 'rgba(10,14,40,0.78)',
					padding: '18px 30px',
					borderRadius: 22,
					fontStyle: isMehmet ? 'italic' : 'normal',
				}}
			>
				{isMehmet ? `„${cap.text}“` : cap.text}
			</div>
		</div>
	);
};

// Kinetisches Stichwort, das aufspringt.
export const Keyword: React.FC<{text: string; color?: string; size?: number; delay?: number}> = ({text, color = C.white, size = 90, delay = 0}) => {
	const f = useCurrentFrame() - delay;
	const s = interpolate(f, [0, 6, 10], [0.6, 1.08, 1], clamp);
	const o = interpolate(f, [0, 4], [0, 1], clamp);
	return (
		<div style={{fontFamily: font, fontWeight: 800, fontSize: size, color, transform: `scale(${s})`, opacity: o, textAlign: 'center', letterSpacing: -1, lineHeight: 1.05}}>
			{text}
		</div>
	);
};
