import React from 'react';
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {AudioLayer} from './AudioLayer';
import {Captions} from './components/Captions';
import {S1Hook, S2aProblem, S2bProblem, S2cMehmet, S3Tiefpunkt} from './scenes/Problem';
import {S4aWende, S4bFunktionen, S4cSicherheit, S5HappyEnd, S6Ehrlich, SEnd} from './scenes/Solution';
import {SCENES, SceneId} from './timing';
import {sec} from './theme';

const ORDER: [SceneId, React.FC<{d: number}>, boolean][] = [
	// [Szene, Komponente, weich einblenden]
	['s1', S1Hook, false],
	['s2a', S2aProblem, true],
	['s2b', S2bProblem, true],
	['s2c', S2cMehmet, true],
	['s3', S3Tiefpunkt, false],
	['s4a', S4aWende, false],
	['s4b', S4bFunktionen, false],
	['s4c', S4cSicherheit, true],
	['s5', S5HappyEnd, true],
	['s6', S6Ehrlich, true],
	['end', SEnd, true],
];

const FadeIn: React.FC<{children: React.ReactNode; on: boolean}> = ({children, on}) => {
	const f = useCurrentFrame();
	return <AbsoluteFill style={{opacity: on ? interpolate(f, [0, 8], [0, 1], {extrapolateRight: 'clamp'}) : 1}}>{children}</AbsoluteFill>;
};

export const Video: React.FC = () => (
	<AbsoluteFill style={{background: '#000'}}>
		{ORDER.map(([id, Scene, fade]) => {
			const [a, b] = SCENES[id];
			const from = sec(a);
			const d = sec(b) - from;
			return (
				<Sequence key={id} from={from} durationInFrames={d} name={id}>
					<FadeIn on={fade}>
						<Scene d={d} />
					</FadeIn>
				</Sequence>
			);
		})}
		<Captions />
		<AudioLayer />
	</AbsoluteFill>
);
