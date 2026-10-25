import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Video';
import {TOTAL_SECONDS} from './timing';
import {FPS, HEIGHT, WIDTH, sec} from './theme';

export const Root: React.FC = () => (
	<Composition id="Mehmet" component={Video} durationInFrames={sec(TOTAL_SECONDS)} fps={FPS} width={WIDTH} height={HEIGHT} />
);
