import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {Abs, Desk, Fill, Sheet} from '../components/Props';
import {Mehmet} from '../components/Mehmet';
import {Keyword} from '../components/Captions';
import {Button, Card, Dashboard, Logo} from '../components/Brand';
import {CalendarIcon, CarIcon, CheckIcon, InfoIcon, LockIcon, PdfIcon} from '../components/Icons';
import {clamp, pop, ramp} from '../components/anim';
import {CUES} from '../cues';
import {SHOW_MOBILEDE} from '../timing';
import {C, font, sec} from '../theme';

const LAUNCH = `linear-gradient(170deg, #0d1240 0%, #2a1f78 60%, #5b3bc7 100%)`;

// Hochkant-Gerät, in dem der App-Nachbau läuft.
const Device: React.FC<{children: React.ReactNode; scale?: number; y?: number}> = ({children, scale = 1, y = 150}) => (
	<div
		style={{
			position: 'absolute',
			left: 60,
			top: y,
			width: 960,
			height: 1220,
			borderRadius: 44,
			background: '#141833',
			padding: 18,
			boxSizing: 'border-box',
			transform: `scale(${scale})`,
			boxShadow: '0 40px 100px rgba(10,10,40,0.45)',
		}}
	>
		<div style={{width: '100%', height: '100%', borderRadius: 30, overflow: 'hidden', position: 'relative', background: C.appBg}}>{children}</div>
	</div>
);

const Login: React.FC<{pressed: boolean}> = ({pressed}) => (
	<div style={{position: 'absolute', inset: 0, background: LAUNCH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 50, fontFamily: font}}>
		<Logo size={260} />
		<div style={{color: C.white, fontSize: 52, fontWeight: 800}}>DB-Automobile</div>
		<div
			style={{
				background: C.white,
				color: C.ink,
				fontSize: 34,
				fontWeight: 600,
				padding: '24px 40px',
				borderRadius: 18,
				display: 'flex',
				alignItems: 'center',
				gap: 18,
				transform: `scale(${pressed ? 0.93 : 1})`,
				boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
			}}
		>
			<div style={{width: 40, height: 40, borderRadius: 99, border: '6px solid #4285f4', borderRightColor: '#34a853', borderBottomColor: '#fbbc05', borderLeftColor: '#ea4335', boxSizing: 'border-box'}} />
			Mit Google anmelden
		</div>
	</div>
);

// Szene 4a: Der Laptop wird hell, Anmeldung, Klick, Übergang zur Übersicht.
export const S4aWende: React.FC<{d: number}> = () => {
	const f = useCurrentFrame();
	const tClick = sec(CUES.loginClick());
	const enter = pop(f, 0, 14);
	const toDash = ramp(f, tClick + 4, tClick + 14);
	return (
		<Fill bg={`linear-gradient(180deg, #dfe7ff 0%, #efe9ff 100%)`}>
			<div style={{position: 'absolute', inset: 0, background: 'rgba(4,5,13,1)', opacity: 1 - ramp(f, 0, 10)}} />
			<Device scale={0.6 + enter * 0.4}>
				<div style={{position: 'absolute', inset: 0, transform: `translateX(${toDash * -100}%)`}}>
					<Login pressed={f >= tClick && f < tClick + 5} />
				</div>
				<div style={{position: 'absolute', inset: 0, transform: `translateX(${100 - toDash * 100}%)`}}>
					<Dashboard grow={ramp(f, tClick + 10, tClick + 30)} />
				</div>
			</Device>
		</Fill>
	);
};

const Beat: React.FC<{title: string; children: React.ReactNode; from: number; to: number}> = ({title, children, from, to}) => {
	const f = useCurrentFrame();
	if (f < from || f >= to) return null;
	const local = f - from;
	const slide = interpolate(local, [0, 8], [120, 0], clamp);
	return (
		<div style={{position: 'absolute', inset: 0, transform: `translateX(${slide}px)`, opacity: interpolate(local, [0, 5], [0, 1], clamp)}}>
			<div style={{position: 'absolute', top: 120, left: 40, right: 40}}>
				<Keyword text={title} color={C.ink} size={88} delay={from} />
			</div>
			<div style={{position: 'absolute', top: 330, left: 60, right: 60, height: 1000}}>{children}</div>
		</div>
	);
};

const VEHICLES = [
	['VW Golf 1.5 TSI', '2019 · 14.900 €', '#5b8cff'],
	['Opel Corsa 1.2', '2020 · 11.450 €', '#8a6bff'],
	['Ford Focus Turnier', '2018 · 12.300 €', '#4ab0c9'],
	['Skoda Fabia 1.0', '2021 · 13.990 €', '#2f6bff'],
];

const BestandBeat: React.FC<{local: number}> = ({local}) => (
	<Card style={{height: 960, padding: 28}}>
		<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
			<div style={{fontSize: 40, fontWeight: 800, color: C.ink}}>Bestand</div>
			<Button pressed={local > 6 && local < 12} style={{fontSize: 30}}>
				+ Fahrzeug
			</Button>
		</div>
		<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20}}>
			{VEHICLES.map(([name, info, color], i) => {
				const s = pop(local, 12 + i * 5);
				return (
					<div key={name} style={{background: '#f5f6fd', borderRadius: 18, overflow: 'hidden', transform: `translateY(${(1 - s) * -400}px) scale(${0.5 + s * 0.5})`, opacity: Math.min(1, s * 1.5)}}>
						<div style={{height: 220, background: `linear-gradient(160deg, ${color}33, ${color}66)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
							<CarIcon size={300} color={color} />
						</div>
						<div style={{padding: 16}}>
							<div style={{fontSize: 26, fontWeight: 700, color: C.ink}}>{name}</div>
							<div style={{fontSize: 22, color: C.muted}}>{info}</div>
						</div>
					</div>
				);
			})}
		</div>
	</Card>
);

const Doc: React.FC<{local: number; title: string; badge?: string; label?: string}> = ({local, title, badge, label}) => {
	const s = pop(local, 4);
	return (
		<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30}}>
			<div style={{transform: `scale(${s}) rotate(${(1 - s) * 10}deg)`, position: 'relative'}}>
				<PdfIcon size={440} label={label} />
				<div style={{position: 'absolute', top: 90, left: 70, fontSize: 44, fontWeight: 800, color: C.ink, fontFamily: font}}>{title}</div>
				{badge && (
					<div
						style={{
							position: 'absolute',
							right: -60,
							top: 30,
							background: C.brandGradient,
							color: C.white,
							fontWeight: 800,
							fontSize: 38,
							padding: '14px 26px',
							borderRadius: 999,
							transform: `rotate(12deg) scale(${pop(local, 14)})`,
							fontFamily: font,
						}}
					>
						{badge}
					</div>
				)}
			</div>
		</div>
	);
};

const VIN = 'WVWZZZ1KZ9W123456'; // erfundene Beispiel-Fahrgestellnummer

const VinBeat: React.FC<{local: number}> = ({local}) => {
	const typed = Math.floor(interpolate(local, [4, 34], [0, VIN.length], clamp));
	return (
		<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40}}>
			<Card style={{width: '100%', boxSizing: 'border-box', padding: 30}}>
				<div style={{fontSize: 28, color: C.muted, marginBottom: 12}}>Fahrgestellnummer</div>
				<div style={{fontSize: 46, fontWeight: 700, color: C.ink, fontFamily: 'JetBrains Mono, monospace', border: `3px solid ${C.blue}`, borderRadius: 14, padding: '16px 20px'}}>
					{VIN.slice(0, typed)}
					<span style={{opacity: Math.floor(local / 8) % 2 ? 0 : 1, color: C.blue}}>|</span>
				</div>
			</Card>
			{local > 38 && <Doc local={local - 38} title="Fahrzeug-Check" />}
		</div>
	);
};

const MobileBeat: React.FC<{local: number}> = ({local}) => (
	<Card style={{padding: 30}}>
		<div style={{display: 'flex', gap: 24, alignItems: 'center'}}>
			<CarIcon size={300} color="#5b8cff" />
			<div>
				<div style={{fontSize: 30, fontWeight: 700, color: C.ink}}>VW Golf 1.5 TSI</div>
				<div style={{fontSize: 24, color: C.muted}}>Inserat von mobile.de</div>
			</div>
		</div>
		<div style={{marginTop: 30, display: 'flex', justifyContent: 'center'}}>
			<Button pressed={local > 10 && local < 16} style={{fontSize: 34}}>
				In DB übernehmen
			</Button>
		</div>
	</Card>
);

// Szene 4b: Schnelle Schnitte durch die Funktionen.
export const S4bFunktionen: React.FC<{d: number}> = ({d}) => {
	const f = useCurrentFrame();
	type B = [string, number, (l: number) => React.ReactNode];
	const mobile: B[] = SHOW_MOBILEDE ? [['mobile.de → Bestand', sec(CUES.b4Mobile()), (l) => <MobileBeat local={l} />]] : [];
	const beats: B[] = [
		['Fahrzeug anlegen', sec(CUES.b4Vehicle()), (l) => <BestandBeat local={l} />],
		['Kaufvertrag als PDF', sec(CUES.b4Contract()), (l) => <Doc local={l} title="Kaufvertrag" />],
		['Rechnung', sec(CUES.b4Invoice()), (l) => <Doc local={l} title="Rechnung" badge="E-Rechnung" />],
		...mobile,
		['Fahrzeug-Check', sec(CUES.b4Vin()), (l) => <VinBeat local={l} />],
	];
	return (
		<Fill bg={C.appBg}>
			{beats.map(([title, from, render], i) => {
				const to = i + 1 < beats.length ? beats[i + 1][1] : d;
				return (
					<Beat key={title} title={title} from={from} to={to}>
						{render(f - from)}
					</Beat>
				);
			})}
		</Fill>
	);
};

const LOG = ['10:42  Rechnung 2026-041 erstellt', '10:43  Rechnung gesperrt', '10:43  PDF erzeugt'];

// Szene 4c: Sperre und Protokoll, tägliche Sicherung, Handy mit „Cloud synchronisiert“.
export const S4cSicherheit: React.FC<{d: number}> = ({d}) => {
	const f = useCurrentFrame();
	const tB = sec(CUES.c4Backup());
	const tP = sec(CUES.c4Phone());
	return (
		<Fill bg={C.appBg}>
			<Beat title="Gesperrt & protokolliert" from={0} to={tB}>
				<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30}}>
					<div style={{position: 'relative'}}>
						<Sheet w={360} label="Rechnung 2026-041" tint="#fff" />
						<div style={{position: 'absolute', left: 110, top: 150, transform: `translateY(${(1 - pop(f, 10)) * -300}px)`, opacity: pop(f, 10)}}>
							<LockIcon size={160} />
						</div>
					</div>
					<Card style={{width: '100%', boxSizing: 'border-box'}}>
						<div style={{fontSize: 26, fontWeight: 700, color: C.ink, marginBottom: 10}}>Protokoll</div>
						{LOG.map((l, i) => (
							<div key={l} style={{fontSize: 26, color: C.muted, padding: '6px 0', opacity: ramp(f, 18 + i * 6, 24 + i * 6), fontFamily: 'JetBrains Mono, monospace'}}>
								{l}
							</div>
						))}
					</Card>
				</div>
			</Beat>
			<Beat title="Sicherung jeden Tag" from={tB} to={tP}>
				<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20}}>
					<CalendarIcon size={560} checks={Math.floor(interpolate(f - tB, [4, 40], [0, 12], clamp))} />
					<div style={{fontSize: 40, fontWeight: 700, color: C.green, fontFamily: font}}>✓ automatisch</div>
				</div>
			</Beat>
			<Beat title="Auch auf dem Handy" from={tP} to={d}>
				<div style={{position: 'relative', height: 1000}}>
					<div style={{position: 'absolute', left: 0, top: 120, width: 640, height: 430, borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 50px rgba(40,50,120,0.25)', transform: 'scale(0.9)', transformOrigin: 'top left'}}>
						<div style={{width: 1280, height: 860, transform: 'scale(0.5)', transformOrigin: 'top left'}}>
							<Dashboard />
						</div>
					</div>
					<div
						style={{
							position: 'absolute',
							right: 0,
							top: 60,
							width: 380,
							height: 760,
							borderRadius: 50,
							background: '#141833',
							padding: 14,
							boxSizing: 'border-box',
							transform: `translateX(${(1 - pop(f, tP + 4, 14)) * 600}px)`,
							boxShadow: '0 30px 70px rgba(20,20,60,0.4)',
						}}
					>
						<div style={{width: '100%', height: '100%', borderRadius: 38, overflow: 'hidden'}}>
							<Dashboard compact />
						</div>
					</div>
				</div>
			</Beat>
		</Fill>
	);
};

const DAY = 'linear-gradient(180deg, #bfe0ff 0%, #fdf3e3 70%)';

// Szene 5: Tag, Ordnung, Kunde unterschreibt, Unterlagen in Sekunden, Mehmet schläft gut.
export const S5HappyEnd: React.FC<{d: number}> = () => {
	const f = useCurrentFrame();
	const tL = sec(CUES.s5Letter());
	const tPdf = sec(CUES.s5Pdf());
	const tSmile = sec(CUES.s5Smile());
	const sign = interpolate(f, [10, 45], [0, 1], clamp);
	const smileZoom = interpolate(f, [tSmile - 6, tSmile + 10], [1, 1.35], clamp);
	return (
		<Fill bg={DAY}>
			<div style={{position: 'absolute', inset: 0, transform: `scale(${smileZoom})`, transformOrigin: '55% 40%'}}>
				<div style={{position: 'absolute', left: 80, top: 110, width: 120, height: 120, borderRadius: 99, background: '#ffd76a', boxShadow: '0 0 80px rgba(255,200,80,0.7)'}} />
				{/* Ordentliches Regal */}
				<div style={{position: 'absolute', left: 560, top: 180, width: 440, height: 22, background: '#c08a5a', borderRadius: 6}} />
				<div style={{position: 'absolute', left: 580, top: 40, display: 'flex', gap: 10}}>
					{['#2f6bff', '#7b4dff', '#4ab0c9', '#2f6bff', '#7b4dff', '#22b573'].map((c, i) => (
						<div key={i} style={{width: 56, height: 140, background: c, borderRadius: 6, position: 'relative'}}>
							<div style={{position: 'absolute', left: 14, right: 14, top: 30, height: 26, background: '#fff', borderRadius: 3}} />
						</div>
					))}
				</div>
				<Abs x={330} y={490}>
					<Mehmet pose={f >= tL && f < tPdf + 10 ? 'tap' : 'happy'} day />
				</Abs>
				<Desk y={1070} day />
			</div>
			{/* Kunde unterschreibt */}
			{f < tL && (
				<Abs x={140} y={1090} style={{transform: 'rotate(-4deg)'}}>
					<div style={{width: 520, height: 260, background: C.white, borderRadius: 12, padding: 24, boxSizing: 'border-box', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', fontFamily: font}}>
						<div style={{fontSize: 34, fontWeight: 800, color: C.ink}}>Kaufvertrag</div>
						<div style={{fontSize: 22, color: C.muted, marginBottom: 10}}>Käufer: Anna Beispiel</div>
						<svg width={460} height={90} viewBox="0 0 460 90">
							<line x1={0} y1={80} x2={460} y2={80} stroke="#c9cde0" strokeWidth={3} />
							<path d="M10 60 q30 -50 50 -10 t40 0 q20 -40 40 10 q30 -30 60 -5 q40 10 80 -20" stroke={C.blue} strokeWidth={5} fill="none" strokeDasharray={420} strokeDashoffset={420 * (1 - sign)} />
						</svg>
					</div>
				</Abs>
			)}
			{/* Neuer Brief, ein Tippen, PDF ist da */}
			{f >= tL && f < tSmile && (
				<>
					<Abs x={90} y={1080} style={{transform: `translateY(${(1 - pop(f, tL)) * -600}px) rotate(-6deg)`}}>
						<div style={{width: 300, height: 190, background: '#fffaf0', borderRadius: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'flex-end', padding: 20, boxSizing: 'border-box', fontFamily: font, fontWeight: 800, fontSize: 30, color: C.ink}}>
							Brief
						</div>
					</Abs>
					{f >= tPdf && (
						<Abs x={560} y={880} style={{transform: `scale(${pop(f, tPdf)})`}}>
							<div style={{position: 'relative'}}>
								<PdfIcon size={260} />
								<div style={{position: 'absolute', right: -30, top: -30}}>
									<CheckIcon size={110} />
								</div>
							</div>
						</Abs>
					)}
					{f >= tPdf + 6 && (
						<div style={{position: 'absolute', top: 290, left: 40, right: 40}}>
							<Keyword text="Unterlagen sofort griffbereit" color={C.ink} size={60} delay={tPdf + 6} />
						</div>
					)}
				</>
			)}
		</Fill>
	);
};

const LIMITS = [
	'Kein Ersatz für den Steuerberater',
	'Fahrzeug-Check bei EU-Autos oft nur Hersteller und Basisdaten',
	'Rückrufdaten nur aus den USA',
	'Voller Verlaufsbericht (z. B. carVertical) kostet Geld',
];

// Szene 6: Ehrlich bleiben. Ruhige Karten, dann drei Häkchen.
export const S6Ehrlich: React.FC<{d: number}> = () => {
	const f = useCurrentFrame();
	const times = CUES.s6Limits().map(sec);
	const tC = sec(CUES.s6Checks());
	const shrink = ramp(f, tC - 6, tC + 6);
	return (
		<Fill bg={C.appBg}>
			<div style={{position: 'absolute', top: 120, left: 60, right: 60, fontSize: 84, fontWeight: 800, color: C.ink, opacity: ramp(f, 0, 10)}}>Fair gesagt</div>
			<div style={{position: 'absolute', top: 280, left: 60, right: 60, display: 'flex', flexDirection: 'column', gap: 22, transform: `scale(${1 - shrink * 0.12})`, transformOrigin: 'top center', opacity: 1 - shrink * 0.35}}>
				{LIMITS.map((t, i) => {
					const s = ramp(f, times[i], times[i] + 10);
					return (
						<Card key={t} style={{display: 'flex', alignItems: 'center', gap: 24, padding: 28, opacity: s, transform: `translateY(${(1 - s) * 30}px)`}}>
							<InfoIcon size={70} color={i === 0 ? C.violet : C.blue} />
							<div style={{fontSize: 40, fontWeight: 600, color: C.ink, lineHeight: 1.2}}>{t}</div>
						</Card>
					);
				})}
			</div>
			{f >= tC && (
				<div style={{position: 'absolute', top: 1020, left: 40, right: 40, display: 'flex', justifyContent: 'space-around'}}>
					{['einfach', 'deutsch', 'für kleine Händler'].map((t, i) => (
						<div key={t} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, transform: `scale(${pop(f, tC + i * 8)})`}}>
							<CheckIcon size={110} />
							<div style={{fontSize: 38, fontWeight: 800, color: C.ink, textAlign: 'center', maxWidth: 300}}>{t}</div>
						</div>
					))}
				</div>
			)}
		</Fill>
	);
};

// Schluss: Logo und Slogan, keine Webadresse.
export const SEnd: React.FC<{d: number}> = () => {
	const f = useCurrentFrame();
	const s = pop(f, 4, 11);
	return (
		<Fill bg={LAUNCH}>
			<div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 60}}>
				<div style={{transform: `scale(${s})`}}>
					<Logo size={340} />
				</div>
				<div style={{textAlign: 'center', color: C.white, opacity: ramp(f, 16, 30), transform: `translateY(${(1 - ramp(f, 16, 30)) * 30}px)`}}>
					<div style={{fontSize: 80, fontWeight: 800}}>DB-Automobile.</div>
					<div style={{fontSize: 60, fontWeight: 600, opacity: 0.9}}>Ordnung im Autohandel.</div>
				</div>
			</div>
		</Fill>
	);
};

