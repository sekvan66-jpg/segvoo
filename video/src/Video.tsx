import React from 'react';
import {AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {AudioLayer} from './AudioLayer';
import {Captions} from './components/Captions';
import {Grain, Vignette} from './components/fx';
import {clamp} from './components/anim';
import {S1Hook, S2aProblem, S2bProblem, S2cMehmet, S3Tiefpunkt} from './scenes/Problem';
import {S4aWende, S4bFunktionen, S4cSicherheit, S5HappyEnd, S6Ehrlich, SEnd} from './scenes/Solution';
import {SCENES, SceneId} from './timing';
import {sec} from './theme';

type Cam = {enter: boolean; exit: boolean; push: number; vignette: number};

const ORDER: [SceneId, React.FC<{d: number}>, Cam][] = [
	// [Szene, Komponente, Kamera: Zoom-Blur rein/raus, langsamer Push-in, Vignette]
	['s1', S1Hook, {enter: false, exit: true, push: 0.07, vignette: 0.6}],
	['s2a', S2aProblem, {enter: true, exit: true, push: 0.05, vignette: 0.6}],
	['s2b', S2bProblem, {enter: true, exit: true, push: 0.05, vignette: 0.6}],
	['s2c', S2cMehmet, {enter: true, exit: false, push: 0.1, vignette: 0.7}],
	['s3', S3Tiefpunkt, {enter: false, exit: false, push: 0.12, vignette: 0.85}],
	['s4a', S4aWende, {enter: false, exit: true, push: 0.03, vignette: 0.2}],
	['s4b', S4bFunktionen, {enter: true, exit: true, push: 0.03, vignette: 0.2}],
	['s4c', S4cSicherheit, {enter: true, exit: true, push: 0.03, vignette: 0.2}],
	['s5', S5HappyEnd, {enter: true, exit: true, push: 0.04, vignette: 0.25}],
	['s6', S6Ehrlich, {enter: true, exit: true, push: 0.03, vignette: 0.2}],
	['end', SEnd, {enter: true, exit: false, push: 0.04, vignette: 0.45}],
];

const IN = 10;
const OUT = 7;

// Kamera je Szene: langsamer Push-in mit leichtem Schweben, Szenenwechsel als Zoom-Blur statt hartem Schnitt.
const Camera: React.FC<{children: React.ReactNode; d: number; cam: Cam}> = ({children, d, cam}) => {
	const f = useCurrentFrame();
	const ease = Easing.out(Easing.exp);
	const enter = cam.enter ? interpolate(f, [0, IN], [1, 0], {...clamp, easing: ease}) : 0;
	const exit = cam.exit ? interpolate(f, [d - OUT, d], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)}) : 0;
	const push = 1 + cam.push * interpolate(f, [0, d], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)});
	const scale = push * (1 + enter * 0.16) * (1 + exit * 0.1);
	const blur = enter * 22 + exit * 16;
	const dx = Math.sin(f / 47) * 6;
	const dy = Math.cos(f / 39) * 5;
	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<AbsoluteFill
				style={{
					transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
					filter: blur > 0.3 ? `blur(${blur}px) brightness(${1 + exit * 0.25})` : undefined,
					opacity: cam.enter ? interpolate(f, [0, 4], [0, 1], clamp) : 1,
				}}
			>
				{children}
			</AbsoluteFill>
			<Vignette strength={cam.vignette} />
		</AbsoluteFill>
	);
};

export const Video: React.FC = () => (
	<AbsoluteFill style={{background: '#000'}}>
		{ORDER.map(([id, Scene, cam]) => {
			const [a, b] = SCENES[id];
			const from = sec(a);
			const d = sec(b) - from;
			return (
				<Sequence key={id} from={from} durationInFrames={d} name={id}>
					<Camera d={d} cam={cam}>
						<Scene d={d} />
					</Camera>
				</Sequence>
			);
		})}
		<Captions />
		<Grain />
		<AudioLayer />
	</AbsoluteFill>
);
