import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {Abs, Coffee, Desk, Fill, Laptop, PaperPile, Sheet, Window} from '../components/Props';
import {Mehmet} from '../components/Mehmet';
import {Keyword} from '../components/Captions';
import {CarIcon, MailboxIcon} from '../components/Icons';
import {clamp, pop, ramp} from '../components/anim';
import {CUES} from '../cues';
import {C, font, sec} from '../theme';

const NIGHT = `linear-gradient(180deg, ${C.nightDeep} 0%, ${C.night} 55%, ${C.violetDark} 140%)`;

const Moon: React.FC = () => (
	<div style={{position: 'absolute', left: 70, top: 70, width: 90, height: 90, borderRadius: 99, background: '#f4f1d0', boxShadow: '0 0 60px rgba(244,241,208,0.6)'}} />
);

const DeskLamp: React.FC = () => (
	<div style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, background: 'radial-gradient(circle at 50% 62%, rgba(255,214,140,0.22) 0%, rgba(0,0,0,0) 45%)'}} />
);

// Szene 1: Mehmet nachts zwischen wachsenden Zettelbergen, Angst vor dem Briefkasten.
export const S1Hook: React.FC<{d: number}> = ({d}) => {
	const f = useCurrentFrame();
	const grow = interpolate(f, [0, d * 0.7], [4, 26], clamp);
	const tMail = sec(CUES.mailbox());
	const mail = pop(f, tMail);
	const flap = interpolate(f, [tMail + 4, tMail + 8, tMail + 12], [0, 1, 0], clamp);
	return (
		<Fill bg={NIGHT}>
			<Abs x={70} y={140}>
				<Window w={300} h={420}>
					<Moon />
				</Window>
			</Abs>
			<DeskLamp />
			<Abs x={290} y={470}>
				<Mehmet pose="rub" />
			</Abs>
			<Desk y={1050} />
			<PaperPile count={grow} x={60} bottom={1040} />
			<PaperPile count={grow * 0.8} x={790} bottom={1040} />
			<PaperPile count={grow * 0.5} x={600} bottom={1040} w={160} />
			<Abs x={650} y={170} style={{transform: `scale(${mail})`, transformOrigin: 'center'}}>
				<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
					<MailboxIcon open={flap} size={260} />
					{f > tMail + 4 && <Keyword text="Angst" color={C.warn} size={100} delay={tMail + 4} />}
				</div>
			</Abs>
		</Fill>
	);
};

const Envelope: React.FC = () => (
	<div style={{width: 420, height: 260, background: '#fffaf0', borderRadius: 12, position: 'relative', boxShadow: '0 16px 40px rgba(0,0,0,0.4)', fontFamily: font}}>
		<svg width={420} height={130} viewBox="0 0 420 130" style={{position: 'absolute', top: 0}}>
			<path d="M0 0 L210 120 L420 0" fill="none" stroke="#d8cfb8" strokeWidth={4} />
		</svg>
		<div style={{position: 'absolute', bottom: 40, left: 40, fontSize: 44, fontWeight: 800, color: C.ink}}>Finanzamt</div>
		<div style={{position: 'absolute', top: 24, right: 26, width: 60, height: 70, border: '3px dashed #c9b88f', borderRadius: 6}} />
	</div>
);

const Panel: React.FC<{label: string; show: number; children: React.ReactNode}> = ({label, show, children}) => (
	<div
		style={{
			width: 300,
			height: 360,
			background: '#1d2550',
			borderRadius: 26,
			border: '3px solid #3a4785',
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'space-between',
			padding: 22,
			boxSizing: 'border-box',
			transform: `scale(${show}) rotate(${(1 - show) * -8}deg)`,
			opacity: Math.min(1, show * 2),
		}}
	>
		<div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{children}</div>
		<div style={{color: C.white, fontWeight: 800, fontSize: 32, fontFamily: font}}>{label}</div>
	</div>
);

// Szene 2a: Brief vom Finanzamt, wirbelnde Blätter, dann Schublade, Handschuhfach, Kopf.
export const S2aProblem: React.FC<{d: number}> = () => {
	const f = useCurrentFrame();
	const drop = interpolate(f, [sec(CUES.letterDrop()), sec(CUES.letterDrop()) + 12], [-500, 0], clamp);
	const tPanels = sec(CUES.panels());
	const swirl = (i: number) => {
		const t = Math.max(0, f - 14 - i * 2);
		return {
			x: 540 + Math.cos(i * 1.7 + t / 14) * (120 + t * 6) - 90,
			y: 900 - t * 9 + Math.sin(i * 2.3) * 80,
			rot: t * (i % 2 ? 6 : -5),
			o: interpolate(t, [0, 5, 60, 80], [0, 1, 1, 0], clamp),
		};
	};
	const pull = interpolate(f, [tPanels - 8, tPanels], [0, -640], clamp);
	return (
		<Fill bg={NIGHT}>
			<DeskLamp />
			<div style={{position: 'absolute', inset: 0, transform: `translateY(${pull}px)`}}>
				<Abs x={330} y={560}>
					<Mehmet pose="sit" size={420} />
				</Abs>
				<Desk y={1050} />
				<Abs x={330} y={830 + drop} style={{transform: `rotate(${-4 + drop / 60}deg)`}}>
					<Envelope />
				</Abs>
				{Array.from({length: 9}).map((_, i) => {
					const s = swirl(i);
					return (
						<Abs key={i} x={s.x} y={s.y} style={{opacity: s.o}}>
							<Sheet w={140} rot={s.rot} />
						</Abs>
					);
				})}
			</div>
			{f >= tPanels - 4 && (
				<div style={{position: 'absolute', left: 0, right: 0, top: 640, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 30, padding: '0 40px'}}>
					<Panel label="Schublade" show={pop(f, tPanels)}>
						<svg width={220} height={180} viewBox="0 0 220 180">
							<rect x={10} y={60} width={200} height={110} rx={10} fill="#8a6446" />
							<rect x={80} y={100} width={60} height={14} rx={7} fill="#5a3f2b" />
							{[0, 1, 2].map((i) => (
								<rect key={i} x={30 + i * 50} y={20 - i * 8} width={70} height={60} rx={4} fill={C.paper} transform={`rotate(${i * 8 - 8} ${65 + i * 50} 50)`} />
							))}
						</svg>
					</Panel>
					<Panel label="Handschuhfach" show={pop(f, sec(CUES.glovebox()))}>
						<svg width={220} height={180} viewBox="0 0 220 180">
							<path d="M10 40 Q110 0 210 40 V90 H10 Z" fill="#30364f" />
							<rect x={40} y={90} width={140} height={70} rx={8} fill="#3d4463" />
							<rect x={60} y={60} width={100} height={50} rx={4} fill={C.paper} transform="rotate(-6 110 85)" />
							<rect x={70} y={70} width={60} height={6} rx={3} fill={C.paperLine} transform="rotate(-6 110 85)" />
						</svg>
					</Panel>
					<Panel label="im Kopf" show={pop(f, sec(CUES.head()))}>
						<svg width={220} height={200} viewBox="0 0 220 200">
							<circle cx={40} cy={185} r={8} fill="#c9d1f0" />
							<circle cx={62} cy={160} r={13} fill="#c9d1f0" />
							<ellipse cx={130} cy={80} rx={88} ry={66} fill="#c9d1f0" />
							{[0, 1, 2, 3].map((i) => (
								<rect key={i} x={80 + (i % 2) * 50} y={45 + Math.floor(i / 2) * 40} width={40} height={30} rx={3} fill={C.paper} transform={`rotate(${i * 13 - 15} ${100 + (i % 2) * 50} ${60 + Math.floor(i / 2) * 40})`} />
							))}
						</svg>
					</Panel>
				</div>
			)}
		</Fill>
	);
};

const Person: React.FC<{color: string; size?: number}> = ({color, size = 260}) => (
	<svg width={size * 0.6} height={size} viewBox="0 0 120 200">
		<circle cx={60} cy={40} r={28} fill="#e0b08a" />
		<path d="M32 32 Q60 0 88 32 Q78 18 60 18 Q42 18 32 32 Z" fill="#5a4030" />
		<path d="M20 200 Q20 80 60 78 Q100 80 100 200 Z" fill={color} />
	</svg>
);

// Szene 2b: Vertrag von Hand, der andere Händler fährt mit dem Auto davon, Bestand verschwommen.
export const S2bProblem: React.FC<{d: number}> = ({d}) => {
	const f = useCurrentFrame();
	const tOff = sec(CUES.carOff());
	const tBlur = sec(CUES.blurry());
	const carX = interpolate(f, [tOff + 10, tOff + 40], [560, 1300], clamp);
	const rival = interpolate(f, [tOff - 6, tOff + 8], [-400, 360], clamp);
	const blurIn = ramp(f, tBlur - 6, tBlur + 6);
	const ink = interpolate(f, [0, tOff], [0, 1], clamp);
	return (
		<Fill bg={NIGHT}>
			<div style={{opacity: 1 - blurIn}}>
				{/* Hof mit Auto, Kunde wartet */}
				<div style={{position: 'absolute', left: 0, right: 0, top: 120, height: 560, background: 'linear-gradient(180deg, #1a2350, #26306a)'}} />
				<div style={{position: 'absolute', left: 0, right: 0, top: 600, height: 80, background: '#2c3256'}} />
				<Abs x={carX} y={420}>
					<CarIcon size={420} color="#5b8cff" />
				</Abs>
				<Abs x={rival} y={360} style={{opacity: f > tOff - 6 && carX < 1200 ? 1 : 0}}>
					<Person color={C.violet} size={240} />
				</Abs>
				<Abs x={90} y={340} style={{opacity: interpolate(f, [tOff + 10, tOff + 20], [1, 0.4], clamp)}}>
					<Person color="#3f7a5a" size={300} />
				</Abs>
				{/* Mehmet schreibt von Hand */}
				<Abs x={80} y={760}>
					<Mehmet pose="write" size={380} />
				</Abs>
				<Desk y={1150} />
				<Abs x={560} y={830} style={{transform: 'rotate(-3deg)'}}>
					<div style={{width: 400, height: 300, background: C.paper, borderRadius: 10, padding: 24, boxSizing: 'border-box', fontFamily: font, boxShadow: '0 10px 30px rgba(0,0,0,0.35)'}}>
						<div style={{fontSize: 34, fontWeight: 800, color: C.ink, marginBottom: 14}}>Kaufvertrag</div>
						<svg width={350} height={180} viewBox="0 0 350 180">
							{[0, 1, 2, 3].map((i) => (
								<path
									key={i}
									d={`M0 ${20 + i * 40} q20 -14 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0`}
									stroke="#33417a"
									strokeWidth={4}
									fill="none"
									strokeDasharray={360}
									strokeDashoffset={360 - Math.max(0, Math.min(1, ink * 4 - i)) * 360}
								/>
							))}
						</svg>
					</div>
				</Abs>
			</div>
			{blurIn > 0 && (
				<div style={{position: 'absolute', inset: 0, opacity: blurIn}}>
					<div style={{position: 'absolute', top: 260, width: '100%', textAlign: 'center', color: C.white, fontFamily: font, fontWeight: 800, fontSize: 70}}>Bestand?</div>
					{Array.from({length: 6}).map((_, i) => (
						<Abs key={i} x={90 + (i % 2) * 470} y={420 + Math.floor(i / 2) * 300}>
							<div style={{filter: 'blur(9px)', opacity: 0.8}}>
								<CarIcon size={400} color={['#5b8cff', '#8a6bff', '#4ab0c9'][i % 3]} />
							</div>
							<div style={{position: 'absolute', left: 150, top: 10, fontSize: 130, fontWeight: 800, color: C.warn, fontFamily: font, transform: `rotate(${Math.sin(f / 8 + i) * 10}deg)`}}>?</div>
						</Abs>
					))}
				</div>
			)}
		</Fill>
	);
};

// Szene 2c: Nahaufnahme, Kopf in den Händen, Zettel fallen langsam.
export const S2cMehmet: React.FC<{d: number}> = () => {
	const f = useCurrentFrame();
	const zoom = interpolate(f, [0, 150], [1, 1.08], clamp);
	return (
		<Fill bg={`radial-gradient(circle at 50% 45%, #232c63 0%, ${C.nightDeep} 75%)`}>
			<div style={{position: 'absolute', inset: 0, transform: `scale(${zoom})`}}>
				<Abs x={140} y={330}>
					<Mehmet pose="headInHands" size={800} />
				</Abs>
				<Desk y={1230} />
			</div>
			{Array.from({length: 7}).map((_, i) => {
				const y = -300 + ((f * 3 + i * 230) % 1700);
				const x = 60 + ((i * 157) % 900) + Math.sin((f + i * 30) / 20) * 40;
				return (
					<Abs key={i} x={x} y={y} style={{opacity: 0.85}}>
						<Sheet w={120} rot={Math.sin((f + i * 20) / 15) * 30} />
					</Abs>
				);
			})}
		</Fill>
	);
};

// Szene 3: Dunkel, nur der Laptop leuchtet, Kaffee dampft nicht mehr.
export const S3Tiefpunkt: React.FC<{d: number}> = () => {
	const f = useCurrentFrame();
	const flicker = 0.25 + Math.sin(f / 4) * 0.03;
	return (
		<Fill bg="#04050d">
			<div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 62%, rgba(90,110,200,0.25) 0%, rgba(0,0,0,0) 40%)'}} />
			<Desk y={1150} />
			<div style={{position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)'}} />
			<Abs x={280} y={850}>
				<Laptop glow={flicker} />
			</Abs>
			<Abs x={830} y={980} style={{opacity: 0.6}}>
				<Coffee steam={false} frame={f} />
			</Abs>
		</Fill>
	);
};
