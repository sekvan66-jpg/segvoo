import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
// In Umgebungen ohne Download-Zugang einen vorhandenen Headless-Browser nutzen.
if (process.env.REMOTION_BROWSER) {
	Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
