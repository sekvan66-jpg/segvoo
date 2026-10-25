import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C} from '../theme';

export type Pose = 'sit' | 'rub' | 'headInHands' | 'write' | 'happy' | 'tap';

// Mehmet als flache 2D-Figur (Oberkörper hinter dem Schreibtisch). Erfundene Figur.
export const Mehmet: React.FC<{pose: Pose; day?: boolean; size?: number}> = ({pose, day = false, size = 520}) => {
	const f = useCurrentFrame();
	const breathe = Math.sin(f / 18) * 3;
	const shirt = day ? C.shirtDay : C.shirtNight;
	const sad = pose === 'rub' || pose === 'headInHands' || pose === 'sit' || pose === 'write';
	const headY = pose === 'headInHands' ? 175 : 140;
	const tilt = pose === 'headInHands' ? 8 : pose === 'happy' ? -3 + Math.sin(f / 10) * 2 : 0;

	const eyes =
		pose === 'happy' ? (
			<g stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round">
				<path d="M168 138 q10 -10 20 0" />
				<path d="M212 138 q10 -10 20 0" />
			</g>
		) : pose === 'headInHands' ? (
			<g stroke={C.ink} strokeWidth={5} strokeLinecap="round">
				<line x1={166} y1={142} x2={188} y2={144} />
				<line x1={212} y1={144} x2={234} y2={142} />
			</g>
		) : (
			<g fill={C.ink}>
				<ellipse cx={178} cy={140} rx={7} ry={sad ? 5 : 8} />
				<ellipse cx={222} cy={140} rx={7} ry={sad ? 5 : 8} />
			</g>
		);

	const brows = sad ? (
		<g stroke={C.hair} strokeWidth={7} strokeLinecap="round">
			<line x1={164} y1={118} x2={190} y2={124} />
			<line x1={236} y1={118} x2={210} y2={124} />
		</g>
	) : (
		<g stroke={C.hair} strokeWidth={7} strokeLinecap="round">
			<line x1={164} y1={118} x2={190} y2={114} />
			<line x1={236} y1={118} x2={210} y2={114} />
		</g>
	);

	const mouth =
		pose === 'happy' || pose === 'tap' ? (
			<path d="M178 180 q22 22 44 0" stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" />
		) : (
			<path d="M182 186 q18 -10 36 0" stroke={C.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
		);

	// Arme je nach Haltung.
	const writeX = Math.sin(f / 3) * 14;
	const arms = (() => {
		const sleeve = {stroke: shirt, strokeWidth: 44, strokeLinecap: 'round' as const, fill: 'none'};
		const hand = (x: number, y: number) => <circle cx={x} cy={y} r={24} fill={C.skin} />;
		switch (pose) {
			case 'rub':
				return (
					<>
						<path d="M120 300 Q110 230 170 165" {...sleeve} />
						{hand(178, 150 + Math.sin(f / 4) * 6)}
						<path d="M280 300 Q300 370 250 420" {...sleeve} />
						{hand(245, 425)}
					</>
				);
			case 'headInHands':
				return (
					<>
						<path d="M120 330 Q120 260 150 220" {...sleeve} />
						<path d="M280 330 Q280 260 250 220" {...sleeve} />
						{hand(150, 205)}
						{hand(250, 205)}
					</>
				);
			case 'write':
				return (
					<>
						<path d="M120 300 Q110 380 160 425" {...sleeve} />
						{hand(165, 428)}
						<path d={`M280 300 Q300 380 ${250 + writeX} 425`} {...sleeve} />
						{hand(250 + writeX, 428)}
						<line x1={250 + writeX} y1={428} x2={270 + writeX} y2={395} stroke={C.ink} strokeWidth={6} />
					</>
				);
			case 'tap':
				return (
					<>
						<path d="M120 300 Q110 380 160 425" {...sleeve} />
						{hand(165, 428)}
						<path d={`M280 300 Q320 360 300 ${410 - Math.abs(Math.sin(f / 5)) * 18}`} {...sleeve} />
						{hand(300, 412 - Math.abs(Math.sin(f / 5)) * 18)}
					</>
				);
			default:
				return (
					<>
						<path d="M120 300 Q110 380 160 425" {...sleeve} />
						<path d="M280 300 Q290 380 240 425" {...sleeve} />
						{hand(165, 428)}
						{hand(240, 428)}
					</>
				);
		}
	})();

	return (
		<svg width={size} height={size * 1.15} viewBox="0 0 400 460" style={{overflow: 'visible'}}>
			<g transform={`translate(0 ${breathe})`}>
				{/* Oberkörper */}
				<path d="M90 460 Q90 270 200 255 Q310 270 310 460 Z" fill={shirt} />
				<path d="M175 258 L200 300 L225 258 Z" fill={day ? '#ffffff' : '#cfd6ea'} />
				{/* Hals und Kopf */}
				<rect x={182} y={headY + 50} width={36} height={50} fill={C.skin} />
				<g transform={`rotate(${tilt} 200 ${headY})`}>
					<g transform={`translate(0 ${headY - 140})`}>
						<ellipse cx={200} cy={145} rx={68} ry={76} fill={C.skin} />
						<ellipse cx={132} cy={150} rx={12} ry={18} fill={C.skin} />
						<ellipse cx={268} cy={150} rx={12} ry={18} fill={C.skin} />
						{/* Haare */}
						<path d="M132 130 Q130 60 200 62 Q272 60 268 130 Q256 96 200 98 Q150 96 132 130 Z" fill={C.hair} />
						{/* Bartschatten */}
						<path d="M148 168 Q200 238 252 168 Q248 214 200 222 Q152 214 148 168 Z" fill={C.hair} opacity={0.35} />
						{brows}
						{eyes}
						{sad && pose !== 'headInHands' && (
							<g stroke="#7a4f36" strokeWidth={3} fill="none" opacity={0.6}>
								<path d="M168 152 q10 6 20 0" />
								<path d="M212 152 q10 6 20 0" />
							</g>
						)}
						<path d="M198 148 q-6 18 4 22" stroke="#9c6a48" strokeWidth={4} fill="none" strokeLinecap="round" />
						{mouth}
					</g>
				</g>
				{arms}
			</g>
		</svg>
	);
};
