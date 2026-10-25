import {Easing, interpolate, spring} from 'remotion';
import {FPS} from '../theme';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// 0 → 1 zwischen zwei Frames, weich.
export const ramp = (frame: number, from: number, to: number) =>
	interpolate(frame, [from, to], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});

export const pop = (frame: number, delay = 0, damping = 12) =>
	spring({frame: frame - delay, fps: FPS, config: {damping, stiffness: 140, mass: 0.7}});

// Ein- und Ausblenden innerhalb einer Szene.
export const fadeInOut = (frame: number, duration: number, inF = 8, outF = 8) =>
	interpolate(frame, [0, inF, duration - outF, duration], [0, 1, 1, 0], clamp);
