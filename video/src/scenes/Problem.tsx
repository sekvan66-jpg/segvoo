import React from 'react';
import {Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {DocCard, Glass, IconRing, Line, Stage, Tag} from '../components/Stage';
import {Keyword} from '../components/Captions';
import {RevealText, Ripple} from '../components/fx';
import {clamp, pop, ramp} from '../components/anim';
import {CUES, rel} from '../cues';
import {C, font, sec} from '../theme';

const RED = '#ff4d5e';
const LAVENDER = '#b9a6ff';

// Riesiger Hintergrund-Schriftzug als Kontur, wandert langsam.
const Outline: React.FC<{text: string; y: number; size?: number; drift?: number; opacity?: number}> = ({text, y, size = 260, drift = 0.6, opacity = 0.14}) => {
	const f = useCurrentFrame();
	return (
		<div
			style={{
				position: 'absolute',
				top: y,
				left: -200 - f * drift,
				whiteSpace: 'nowrap',
				fontFamily: font,
				fontWeight: 800,
				fontSize: size,
				letterSpacing: -size * 0.03,
				color: 'transparent',
				WebkitTextStroke: `2px rgba(255,255,255,${opacity})`,
			}}
		>
			{`${text} ${text} ${text}`}
		</div>
	);
};

// Szene 1: „Mehmet“ als Typo, um ihn herum vermehren sich Belege; dann der Briefkasten: Angst.
export const S1Hook: React.FC<{d: number}> = ({d}) => {
	const f = useCurrentFrame();
	const tMail = sec(CUES.mailbox());
	const count = Math.floor(interpolate(f, [8, d * 0.75], [0, 16], clamp));
	const dim = ramp(f, tMail - 4, tMail + 6);
	return (
		<Stage tone="cold">
			<Outline text="MEHMET" y={130} />
			<div style={{position: 'absolute', inset: 0, opacity: 1 - dim * 0.65, filter: dim > 0.05 ? `blur(${dim * 6}px)` : undefined}}>
				{Array.from({length: count}).map((_, i) => {
					const r = (k: string) => random(`s1${k}${i}`);
					const s = pop(f, 8 + i * ((d * 0.75 - 8) / 16), 14);
					// Belege links und rechts vom Schriftzug, damit „Mehmet“ lesbar bleibt.
					const x = i % 2 ? 730 + r('x') * 180 : -60 + r('x') * 200;
					const y = 300 + r('y') * 1050;
					return (
						<div key={i} style={{position: 'absolute', left: x, top: y, transform: `perspective(1200px) rotateY(${(r('ry') - 0.5) * 50}deg) rotate(${(r('r') - 0.5) * 40 + Math.sin(f / 30 + i) * 3}deg) scale(${s * (0.55 + r('s') * 0.4)})`, opacity: 0.92}}>
							<DocCard title={['Rechnung', 'Kaufvertrag', 'Beleg', 'Quittung'][i % 4]} w={240} />
						</div>
					);
				})}
				<div style={{position: 'absolute', top: 560, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30}}>
					<RevealText text="Mehmet" size={190} color={C.white} delay={2} />
					<div style={{opacity: ramp(f, 12, 22), transform: `translateY(${(1 - ramp(f, 12, 22)) * 20}px)`}}>
						<Tag>Autohändler</Tag>
					</div>
				</div>
			</div>
			{f >= tMail - 4 && (
				<div style={{position: 'absolute', top: 470, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 50}}>
					<div style={{transform: `scale(${pop(f, tMail - 4, 11)}) translateX(${f > tMail && f < tMail + 14 ? Math.sin(f * 2.6) * 10 : 0}px)`}}>
						<IconRing color={RED} size={260}>
							<Line.Mail size={140} color="#fff" stroke={5} />
						</IconRing>
					</div>
					<Ripple at={tMail} x={540} y={130} color={RED} size={300} />
					{f >= tMail + 2 && <Keyword text="Angst." color={RED} size={210} delay={tMail + 2} />}
				</div>
			)}
		</Stage>
	);
};

// Szene 2a: Benachrichtigung vom Finanzamt, Suche ohne Treffer, dann drei Orte, an denen die Belege liegen.
export const S2aProblem: React.FC<{d: number}> = () => {
	const f = useCurrentFrame();
	const tDrop = sec(CUES.letterDrop());
	const tPanels = sec(CUES.panels());
	const notif = pop(f, tDrop, 15);
	const query = 'Beleg Kaufvertrag';
	const typed = Math.floor(interpolate(f, [tDrop + 24, tPanels - 26], [0, query.length], clamp));
	const none = f > tPanels - 22;
	const out = ramp(f, tPanels - 8, tPanels + 4);
	const places: [string, (p: {size?: number; color?: string; stroke?: number}) => React.ReactElement, number][] = [
		['Schublade', Line.Drawer, sec(CUES.panels())],
		['Handschuhfach', Line.Car, sec(CUES.glovebox())],
		['Im Kopf', Line.Brain, sec(CUES.head())],
	];
	return (
		<Stage tone="cold">
			<Outline text="BELEGE?" y={1500} drift={-0.7} />
			<div style={{position: 'absolute', inset: 0, opacity: 1 - out, transform: `translateY(${-out * 160}px)`}}>
				<div style={{position: 'absolute', top: 300, left: 70, right: 70, transform: `translateY(${(1 - notif) * -500}px)`}}>
					<Glass style={{display: 'flex', alignItems: 'center', gap: 34, padding: '34px 40px'}} glow="rgba(255,77,94,0.18)">
						<IconRing color={RED} size={120}>
							<Line.Mail size={64} />
						</IconRing>
						<div>
							<div style={{fontSize: 28, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.6, fontWeight: 600}}>Brief · Finanzamt</div>
							<div style={{fontSize: 52, fontWeight: 800, marginTop: 6}}>Belege vorlegen</div>
						</div>
					</Glass>
				</div>
				<div style={{position: 'absolute', top: 720, left: 70, right: 70, opacity: ramp(f, tDrop + 16, tDrop + 26)}}>
					<Glass style={{padding: '30px 36px', display: 'flex', alignItems: 'center', gap: 26}}>
						<Line.Search size={70} color="rgba(255,255,255,0.7)" />
						<div style={{fontSize: 50, fontWeight: 600}}>
							{query.slice(0, typed)}
							<span style={{opacity: Math.floor(f / 8) % 2 ? 0 : 0.8}}>|</span>
						</div>
					</Glass>
					{none && (
						<div style={{marginTop: 30, display: 'flex', alignItems: 'center', gap: 18, color: RED, fontSize: 46, fontWeight: 800, transform: `scale(${pop(f, tPanels - 22)})`, transformOrigin: 'left center'}}>
							<Line.X size={60} color={RED} stroke={8} />
							Keine Treffer
						</div>
					)}
				</div>
			</div>
			{f >= tPanels - 6 && (
				<div style={{position: 'absolute', top: 250, left: 70, right: 70, display: 'flex', flexDirection: 'column', gap: 40}}>
					{places.map(([label, Icon, t], i) => {
						const s = pop(f, t - 2, 15);
						return (
							<div key={label} style={{transform: `perspective(1400px) translateX(${(1 - s) * (i % 2 ? -700 : 700)}px) rotateY(${(1 - s) * (i % 2 ? 40 : -40)}deg)`, opacity: Math.min(1, s * 1.5)}}>
								<Glass style={{display: 'flex', alignItems: 'center', gap: 40, padding: '40px 46px'}}>
									<IconRing color={i === 2 ? LAVENDER : '#6f8cff'} size={170}>
										<Icon size={100} />
									</IconRing>
									<div style={{fontSize: 76, fontWeight: 800, letterSpacing: -2}}>{label}</div>
								</Glass>
							</div>
						);
					})}
				</div>
			)}
		</Stage>
	);
};

// Linien-Silhouette eines Autos (Seitenansicht), sauber statt comichaft.
const CarLine: React.FC<{w?: number; color?: string}> = ({w = 760, color = '#cfd8ff'}) => (
	<svg width={w} height={w * 0.36} viewBox="0 0 400 144" fill="none" stroke={color} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
		<path d="M20 104 C20 88 30 84 52 80 L104 72 C126 50 150 36 196 34 C246 32 280 44 312 70 L360 78 C378 82 386 90 386 104" />
		<path d="M20 104 H62 M118 104 H286 M342 104 H386" />
		<circle cx={90} cy={104} r={26} />
		<circle cx={314} cy={104} r={26} />
		<circle cx={90} cy={104} r={10} />
		<circle cx={314} cy={104} r={10} />
		<path d="M124 70 C140 54 160 46 196 45 V70 Z" />
		<path d="M208 45 C244 45 268 52 292 70 H208 Z" />
	</svg>
);

// Szene 2b: Einkauf dauert, Vertrag von Hand, das Auto ist weg; danach der Bestand nur ungefähr.
export const S2bProblem: React.FC<{d: number}> = () => {
	const f = useCurrentFrame();
	const tOff = sec(CUES.carOff());
	const tBlur = sec(CUES.blurry());
	const leave = interpolate(f, [tOff + 6, tOff + 26], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
	const blurIn = ramp(f, tBlur - 6, tBlur + 6);
	const ink = interpolate(f, [4, tOff], [0, 1], clamp);
	const timer = Math.floor(interpolate(f, [0, tOff + 10], [0, 47], clamp));
	return (
		<Stage tone="warn">
			<div style={{position: 'absolute', inset: 0, opacity: 1 - blurIn}}>
				<div style={{position: 'absolute', top: 220, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
					<Tag color="#ffb4bb">Einkauf</Tag>
				</div>
				<div style={{position: 'absolute', top: 400, left: 160 + leave * 1100, filter: leave > 0.02 ? `blur(${leave * 10}px)` : undefined}}>
					<CarLine />
					<div style={{position: 'absolute', left: 230, top: -70}}>
						<Glass style={{padding: '12px 26px', fontSize: 34, fontWeight: 700, borderRadius: 18}}>VW Golf · 14.900 €</Glass>
					</div>
				</div>
				{leave > 0 &&
					[0, 1, 2, 3, 4].map((i) => (
						<div key={i} style={{position: 'absolute', left: 100 + leave * 700 - i * 40, top: 430 + i * 42, width: 520, height: 4, borderRadius: 2, background: 'linear-gradient(90deg, rgba(255,120,130,0), rgba(255,120,130,0.8))', opacity: interpolate(leave, [0, 0.3, 1], [0, 1, 0], clamp)}} />
					))}
				{f >= tOff + 14 && (
					<div style={{position: 'absolute', top: 440, left: 0, right: 0}}>
						<Keyword text="Zu langsam." color="#ff6b78" size={150} delay={tOff + 14} />
					</div>
				)}
				<div style={{position: 'absolute', top: 820, left: 70, right: 70, display: 'flex', gap: 30}}>
					<Glass style={{flex: 1, padding: 36}}>
						<div style={{display: 'flex', alignItems: 'center', gap: 18, opacity: 0.7, fontSize: 30, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase'}}>
							<Line.Pen size={44} color="#fff" />
							Vertrag von Hand
						</div>
						<svg width={520} height={220} viewBox="0 0 520 220" style={{marginTop: 20}}>
							{[0, 1, 2, 3].map((i) => (
								<path
									key={i}
									d={`M0 ${30 + i * 52} q26 -18 52 0 t52 0 t52 0 t52 0 t52 0 t52 0 t52 0 t52 0 t52 0`}
									stroke="rgba(255,255,255,0.75)"
									strokeWidth={4}
									fill="none"
									strokeDasharray={480}
									strokeDashoffset={480 - Math.max(0, Math.min(1, ink * 4 - i)) * 480}
								/>
							))}
						</svg>
					</Glass>
					<Glass style={{width: 260, padding: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16}}>
						<Line.Clock size={110} color="#ff8a94" />
						<div style={{fontSize: 64, fontWeight: 800, fontVariantNumeric: 'tabular-nums'}}>{`00:${String(timer).padStart(2, '0')}`}</div>
						<div style={{fontSize: 26, opacity: 0.6}}>Wartezeit</div>
					</Glass>
				</div>
			</div>
			{blurIn > 0 && (
				<div style={{position: 'absolute', inset: 0, opacity: blurIn}}>
					<div style={{position: 'absolute', top: 200, left: 0, right: 0}}>
						<Keyword text="Bestand?" color={C.white} size={170} delay={tBlur - 6} />
					</div>
					<div style={{position: 'absolute', top: 480, left: 70, right: 70, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28}}>
						{Array.from({length: 6}).map((_, i) => (
							<Glass key={i} style={{height: 250, position: 'relative', overflow: 'hidden', transform: `scale(${pop(f, tBlur + i * 3)})`}}>
								<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'blur(10px)', opacity: 0.8}}>
									<CarLine w={380} />
								</div>
								<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 130, fontWeight: 800, color: '#ff6b78', textShadow: '0 0 40px rgba(255,80,100,0.6)', transform: `rotate(${Math.sin(f / 9 + i) * 8}deg)`}}>?</div>
							</Glass>
						))}
					</div>
				</div>
			)}
		</Stage>
	);
};

// Szene 2c: Mehmets Satz als große Typo-Zitat.
export const S2cMehmet: React.FC<{d: number}> = () => {
	const f = useCurrentFrame();
	const t1 = sec(rel('s2c', 'Ich arbeite', 0.05));
	const t2 = sec(rel('s2c', 'und habe', 0.5));
	return (
		<Stage tone="violet" grid={false}>
			<div style={{position: 'absolute', top: 260, left: 70, fontSize: 300, fontWeight: 800, color: LAVENDER, opacity: 0.25 * ramp(f, 0, 10), fontFamily: 'Georgia, serif', lineHeight: 1}}>„</div>
			<div style={{position: 'absolute', top: 520, left: 80, right: 80, fontStyle: 'italic'}}>
				<RevealText text="Ich arbeite mehr als alle" size={112} color={C.white} align="left" delay={t1} stagger={4} />
				<div style={{height: 30}} />
				{f >= t2 - 2 && <RevealText text="und habe trotzdem nichts im Griff." size={112} align="left" delay={t2} stagger={4} gradient={`linear-gradient(90deg, #ffffff 0%, ${LAVENDER} 60%, #7b4dff 100%)`} />}
			</div>
			<div style={{position: 'absolute', top: 1220, left: 80, opacity: ramp(f, t1 + 10, t1 + 22)}}>
				<Tag color={LAVENDER}>Mehmet</Tag>
			</div>
		</Stage>
	);
};

// Szene 3: Schwarz. Ein Satz, Buchstabe für Buchstabe, die Musik bricht ab.
export const S3Tiefpunkt: React.FC<{d: number}> = ({d}) => {
	const f = useCurrentFrame();
	const text = 'So kann es nicht weitergehen.';
	const n = Math.floor(interpolate(f, [4, d * 0.6], [0, text.length], clamp));
	const line = interpolate(f, [0, d * 0.8], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	return (
		<Stage tone="black" grid={false} dust={10}>
			<div style={{position: 'absolute', top: 860, left: 70, right: 70, fontFamily: font, fontWeight: 600, fontSize: 76, color: 'rgba(255,255,255,0.9)', letterSpacing: -1, textAlign: 'center'}}>
				{text.split('').map((ch, i) => (
					<span key={i} style={{opacity: i < n ? 1 : 0, filter: i < n && i > n - 3 ? 'blur(2px)' : undefined}}>
						{ch}
					</span>
				))}
			</div>
			<div style={{position: 'absolute', top: 1010, left: 540 - 300 * line, width: 600 * line, height: 2, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.6), rgba(255,255,255,0))', opacity: 0.6 + Math.sin(f / 2) * 0.2}} />
		</Stage>
	);
};
