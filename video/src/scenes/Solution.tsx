import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {DocCard, Glass, IconRing, Line, Stage, Tag} from '../components/Stage';
import {Keyword} from '../components/Captions';
import {Button, Dashboard, Logo, SyncBadge} from '../components/Brand';
import {Flash, RevealText, Ripple, Shine, Tilt3D} from '../components/fx';
import {clamp, pop, ramp} from '../components/anim';
import {CUES, rel} from '../cues';
import {SHOW_MOBILEDE} from '../timing';
import {C, font, sec} from '../theme';

const GREEN = '#3ddc97';
const BRAND_TEXT = 'linear-gradient(90deg, #ffffff 0%, #9db8ff 45%, #b18cff 100%)';

// Hochkant-Gerät mit leuchtendem Rand, in dem der App-Nachbau läuft.
const Device: React.FC<{children: React.ReactNode; w?: number; h?: number}> = ({children, w = 900, h = 1120}) => (
	<div
		style={{
			width: w,
			height: h,
			borderRadius: 56,
			background: '#0b0e22',
			padding: 16,
			boxSizing: 'border-box',
			boxShadow: '0 80px 160px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.12), 0 0 120px rgba(80,100,255,0.35)',
		}}
	>
		<div style={{width: '100%', height: '100%', borderRadius: 42, overflow: 'hidden', position: 'relative', background: C.appBg}}>{children}</div>
	</div>
);

// Szene 4a: Lichtblitz, Logo, Anmeldung mit Google, Klick, die Übersicht schwebt herein.
export const S4aWende: React.FC<{d: number}> = () => {
	const f = useCurrentFrame();
	const tClick = sec(CUES.loginClick());
	const tOrt = sec(rel('s4a', 'alles an einem Ort', 0.75));
	const logo = pop(f, 2, 11);
	const up = ramp(f, tClick + 2, tClick + 14);
	return (
		<Stage tone="brand">
			<div style={{position: 'absolute', left: 0, right: 0, top: 520 - up * 330, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 - up * 20, transform: `scale(${1 - up * 0.45})`}}>
				<div style={{position: 'relative', transform: `scale(${logo}) rotate(${(1 - logo) * -15}deg)`}}>
					<div style={{position: 'absolute', inset: -140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(120,110,255,0.55) 0%, rgba(120,110,255,0) 65%)'}} />
					<div style={{position: 'relative'}}>
						<Logo size={280} />
						<Shine at={10} dur={24} radius={280 * 0.22} />
					</div>
				</div>
				<RevealText text="DB-Automobile" size={130} gradient={BRAND_TEXT} delay={6} />
			</div>
			{f < tClick + 8 && (
				<div style={{position: 'absolute', top: 1120, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: ramp(f, 14, 22) * (1 - ramp(f, tClick + 2, tClick + 8))}}>
					<div
						style={{
							background: C.white,
							color: C.ink,
							fontSize: 44,
							fontWeight: 600,
							padding: '30px 50px',
							borderRadius: 24,
							display: 'flex',
							alignItems: 'center',
							gap: 22,
							fontFamily: font,
							transform: `scale(${f >= tClick && f < tClick + 5 ? 0.93 : 1})`,
							boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 60px rgba(120,140,255,0.4)',
						}}
					>
						<div style={{width: 48, height: 48, borderRadius: 99, border: '8px solid #4285f4', borderRightColor: '#34a853', borderBottomColor: '#fbbc05', borderLeftColor: '#ea4335', boxSizing: 'border-box'}} />
						Mit Google anmelden
					</div>
				</div>
			)}
			<Ripple at={tClick} x={540} y={1175} color={C.white} size={300} />
			{f >= tClick + 4 && (
				<Tilt3D delay={tClick + 4} style={{position: 'absolute', top: 560, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
					<div style={{display: 'flex', justifyContent: 'center'}}>
						<div style={{width: 940, height: 640, borderRadius: 34, overflow: 'hidden', boxShadow: '0 60px 140px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.15), 0 0 120px rgba(80,100,255,0.35)'}}>
							<div style={{width: 1410, height: 960, transform: 'scale(0.6667)', transformOrigin: 'top left'}}>
								<Dashboard grow={ramp(f, tClick + 14, tClick + 34)} />
							</div>
						</div>
					</div>
				</Tilt3D>
			)}
			{f >= tClick + 8 && (
				<div style={{position: 'absolute', top: 1260, left: 70, right: 70, display: 'flex', justifyContent: 'center', gap: 24}}>
					{[
						['Alles auf Deutsch', tClick + 8],
						['Alles an einem Ort', tOrt],
					].map(([t, at]) => (
						<div key={t as string} style={{transform: `scale(${pop(f, at as number)})`}}>
							<Tag color="#9db8ff">{t}</Tag>
						</div>
					))}
				</div>
			)}
			<Flash at={0} dur={16} />
		</Stage>
	);
};

// Ein Funktions-Schnitt: Nummer, große Überschrift, Inhalt fliegt in 3D herein.
const Beat: React.FC<{n: string; title: string; children: React.ReactNode; from: number; to: number}> = ({n, title, children, from, to}) => {
	const f = useCurrentFrame();
	if (f < from || f >= to) return null;
	const local = f - from;
	const blur = interpolate(local, [0, 6], [14, 0], clamp);
	return (
		<div style={{position: 'absolute', inset: 0, opacity: interpolate(local, [0, 4], [0, 1], clamp), filter: blur > 0.3 ? `blur(${blur}px)` : undefined}}>
			<div style={{position: 'absolute', top: 150, left: 70, right: 70}}>
				<div style={{fontFamily: 'JetBrains Mono, monospace', fontSize: 30, color: '#9db8ff', letterSpacing: 4, marginBottom: 14, opacity: ramp(local, 0, 6)}}>{n}</div>
				<Keyword text={title} size={118} delay={from} gradient={BRAND_TEXT} align="left" />
			</div>
			<Tilt3D delay={from + 2} style={{position: 'absolute', top: 520, left: 70, right: 70}}>
				{children}
			</Tilt3D>
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
	<div style={{background: C.appBg, borderRadius: 36, padding: 34, boxShadow: '0 60px 140px rgba(0,0,0,0.55), 0 0 100px rgba(80,100,255,0.3)', fontFamily: font}}>
		<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26}}>
			<div style={{fontSize: 44, fontWeight: 800, color: C.ink}}>Bestand</div>
			<div style={{position: 'relative'}}>
				<Button pressed={local > 6 && local < 12} style={{fontSize: 30}}>
					+ Fahrzeug
				</Button>
			</div>
		</div>
		<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22}}>
			{VEHICLES.map(([name, info, color], i) => {
				const s = pop(local, 12 + i * 5);
				return (
					<div key={name} style={{background: C.white, borderRadius: 22, overflow: 'hidden', transform: `translateY(${(1 - s) * -300}px) scale(${0.6 + s * 0.4})`, opacity: Math.min(1, s * 1.5), boxShadow: '0 10px 30px rgba(60,70,140,0.12)'}}>
						<div style={{height: 210, background: `linear-gradient(150deg, ${color}, ${color}99 60%, #1b1f3b)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
							<Line.Car size={190} color="rgba(255,255,255,0.95)" stroke={3.5} />
							<div style={{position: 'absolute', right: 14, top: 14, background: 'rgba(0,0,0,0.35)', color: '#fff', fontSize: 20, fontWeight: 600, padding: '6px 12px', borderRadius: 10}}>12 Fotos</div>
						</div>
						<div style={{padding: 18}}>
							<div style={{fontSize: 28, fontWeight: 700, color: C.ink}}>{name}</div>
							<div style={{fontSize: 23, color: C.muted}}>{info}</div>
						</div>
					</div>
				);
			})}
		</div>
	</div>
);

const DocBeat: React.FC<{local: number; title: string; sub: string; badge?: string}> = ({local, title, sub, badge}) => (
	<div style={{display: 'flex', justifyContent: 'center', position: 'relative', height: 900}}>
		<div style={{position: 'absolute', top: 40, transform: `rotate(-8deg) translateX(-160px) scale(0.86)`, opacity: 0.5 * ramp(local, 6, 14)}}>
			<DocCard title={title} sub={sub} w={520} />
		</div>
		<div style={{position: 'relative', transform: `rotate(${(1 - pop(local, 2)) * 10}deg)`}}>
			<DocCard title={title} sub={sub} w={560} badge="PDF" />
			<Shine at={8} dur={20} radius={34} />
			{badge && (
				<div style={{position: 'absolute', right: -70, top: 190, background: 'linear-gradient(90deg, #2f6bff, #7b4dff)', color: '#fff', fontWeight: 800, fontSize: 46, padding: '18px 34px', borderRadius: 999, transform: `rotate(10deg) scale(${pop(local, 14)})`, boxShadow: '0 20px 50px rgba(80,90,255,0.5)', fontFamily: font}}>
					{badge}
				</div>
			)}
		</div>
	</div>
);

const VIN = 'WVWZZZ1KZ9W123456'; // erfundene Beispiel-Fahrgestellnummer

const VinBeat: React.FC<{local: number}> = ({local}) => {
	const typed = Math.floor(interpolate(local, [4, 30], [0, VIN.length], clamp));
	return (
		<div style={{display: 'flex', flexDirection: 'column', gap: 40}}>
			<Glass style={{padding: 36}}>
				<div style={{fontSize: 28, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.6, fontWeight: 600, marginBottom: 16}}>Fahrgestellnummer</div>
				<div style={{fontSize: 52, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', border: '2px solid rgba(157,184,255,0.7)', borderRadius: 18, padding: '18px 24px', boxShadow: '0 0 40px rgba(80,120,255,0.3)'}}>
					{VIN.slice(0, typed)}
					<span style={{opacity: Math.floor(local / 8) % 2 ? 0 : 1, color: '#9db8ff'}}>|</span>
				</div>
			</Glass>
			{local > 34 && (
				<div style={{display: 'flex', justifyContent: 'center', transform: `scale(${pop(local, 34)})`}}>
					<DocCard title="Fahrzeug-Check" sub="Bericht" w={420} badge="PDF" />
				</div>
			)}
		</div>
	);
};

const MobileBeat: React.FC<{local: number}> = ({local}) => (
	<Glass style={{padding: 36}}>
		<div style={{display: 'flex', gap: 30, alignItems: 'center'}}>
			<Line.Car size={200} color="#9db8ff" />
			<div>
				<div style={{fontSize: 40, fontWeight: 700}}>VW Golf 1.5 TSI</div>
				<div style={{fontSize: 28, opacity: 0.6}}>Inserat von mobile.de</div>
			</div>
		</div>
		<div style={{marginTop: 30, display: 'flex', justifyContent: 'center'}}>
			<Button pressed={local > 10 && local < 16} style={{fontSize: 36}}>
				In DB übernehmen
			</Button>
		</div>
	</Glass>
);

// Szene 4b: Schnelle Schnitte durch die Funktionen.
export const S4bFunktionen: React.FC<{d: number}> = ({d}) => {
	const f = useCurrentFrame();
	type B = [string, number, (l: number) => React.ReactNode];
	const mobile: B[] = SHOW_MOBILEDE ? [['mobile.de → Bestand', sec(CUES.b4Mobile()), (l) => <MobileBeat local={l} />]] : [];
	const beats: B[] = [
		['Fahrzeug anlegen', sec(CUES.b4Vehicle()), (l) => <BestandBeat local={l} />],
		['Kaufvertrag als PDF', sec(CUES.b4Contract()), (l) => <DocBeat local={l} title="Kaufvertrag" sub="Käufer: Anna Beispiel" />],
		['Rechnung', sec(CUES.b4Invoice()), (l) => <DocBeat local={l} title="Rechnung" sub="Nr. 2026-041" badge="E-Rechnung" />],
		...mobile,
		['Fahrzeug-Check', sec(CUES.b4Vin()), (l) => <VinBeat local={l} />],
	];
	return (
		<Stage tone="brand">
			{beats.map(([title, from, render], i) => {
				const to = i + 1 < beats.length ? beats[i + 1][1] : d;
				return (
					<Beat key={title} n={`0${i + 1}`} title={title} from={from} to={to}>
						{render(f - from)}
					</Beat>
				);
			})}
		</Stage>
	);
};

const LOG = ['10:42  Rechnung 2026-041 erstellt', '10:43  Rechnung gesperrt', '10:43  PDF erzeugt'];

// Szene 4c: Sperre und Protokoll, tägliche Sicherung, Handy mit „Cloud synchronisiert“.
export const S4cSicherheit: React.FC<{d: number}> = ({d}) => {
	const f = useCurrentFrame();
	const tB = sec(CUES.c4Backup());
	const tP = sec(CUES.c4Phone());
	const checks = Math.floor(interpolate(f - tB, [4, 36], [0, 14], clamp));
	return (
		<Stage tone="brand">
			<Beat n="05" title="Gesperrt & protokolliert" from={0} to={tB}>
				<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40}}>
					<div style={{position: 'relative'}}>
						<DocCard title="Rechnung" sub="Nr. 2026-041" w={380} />
						<div style={{position: 'absolute', left: 90, top: 150, transform: `translateY(${(1 - pop(f, 10)) * -300}px) scale(${pop(f, 10)})`}}>
							<IconRing color="#7b4dff" size={200}>
								<Line.Lock size={110} />
							</IconRing>
						</div>
					</div>
					<Glass style={{width: '100%', boxSizing: 'border-box', padding: 30}}>
						<div style={{fontSize: 26, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.6, fontWeight: 600, marginBottom: 10}}>Protokoll</div>
						{LOG.map((l, i) => (
							<div key={l} style={{fontSize: 30, padding: '6px 0', opacity: ramp(f, 18 + i * 6, 24 + i * 6), fontFamily: 'JetBrains Mono, monospace'}}>
								{l}
							</div>
						))}
					</Glass>
				</div>
			</Beat>
			<Beat n="06" title="Sicherung jeden Tag" from={tB} to={tP}>
				<Glass style={{padding: 40}}>
					<div style={{display: 'flex', alignItems: 'center', gap: 24, marginBottom: 30}}>
						<Line.Shield size={80} color={GREEN} />
						<div style={{fontSize: 42, fontWeight: 700}}>Automatische Sicherung</div>
					</div>
					<div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 14}}>
						{Array.from({length: 14}).map((_, i) => (
							<div key={i} style={{aspectRatio: '1', borderRadius: 16, border: `2px solid ${i < checks ? GREEN : 'rgba(255,255,255,0.15)'}`, background: i < checks ? 'rgba(61,220,151,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: i < checks ? '0 0 24px rgba(61,220,151,0.35)' : undefined}}>
								{i < checks && <Line.Check size={56} color={GREEN} stroke={9} />}
							</div>
						))}
					</div>
				</Glass>
			</Beat>
			<Beat n="07" title="Auch auf dem Handy" from={tP} to={d}>
				<div style={{position: 'relative', height: 1000}}>
					<div style={{position: 'absolute', left: -20, top: 140, width: 700, height: 470, borderRadius: 26, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.55)', opacity: 0.85}}>
						<div style={{width: 1400, height: 940, transform: 'scale(0.5)', transformOrigin: 'top left'}}>
							<Dashboard />
						</div>
					</div>
					<div style={{position: 'absolute', right: 0, top: 40, transform: `translateX(${(1 - pop(f, tP + 4, 14)) * 700}px) rotate(${(1 - pop(f, tP + 4, 14)) * 12}deg)`}}>
						<Device w={400} h={800}>
							<Dashboard compact />
						</Device>
					</div>
					<div style={{position: 'absolute', left: 0, top: 700, transform: `scale(${pop(f, tP + 14)})`, transformOrigin: 'left center'}}>
						<div style={{background: 'rgba(255,255,255,0.95)', borderRadius: 999, padding: 6}}>
							<SyncBadge scale={1.8} />
						</div>
					</div>
				</div>
			</Beat>
		</Stage>
	);
};

// Szene 5: Kunde unterschreibt, der nächste Brief: ein Tippen, das PDF ist da. Dann Mehmets Satz.
export const S5HappyEnd: React.FC<{d: number}> = () => {
	const f = useCurrentFrame();
	const tL = sec(CUES.s5Letter());
	const tPdf = sec(CUES.s5Pdf());
	const tSmile = sec(CUES.s5Smile());
	const sign = interpolate(f, [12, 50], [0, 1], clamp);
	const quote = ramp(f, tSmile - 8, tSmile + 4);
	return (
		<Stage tone="warm">
			<div style={{position: 'absolute', inset: 0, opacity: 1 - quote, transform: `scale(${1 - quote * 0.08})`}}>
				{f < tL && (
					<Tilt3D style={{position: 'absolute', top: 420, left: 70, right: 70}}>
						<div style={{background: C.white, borderRadius: 30, padding: 44, fontFamily: font, boxShadow: '0 60px 140px rgba(0,0,0,0.55)'}}>
							<div style={{fontSize: 52, fontWeight: 800, color: C.ink}}>Kaufvertrag</div>
							<div style={{fontSize: 30, color: C.muted, marginBottom: 30}}>Käufer: Anna Beispiel · VW Golf 1.5 TSI</div>
							{[90, 76, 84].map((p, i) => (
								<div key={i} style={{height: 14, width: `${p}%`, background: '#e3e6f2', borderRadius: 99, marginBottom: 20}} />
							))}
							<svg width={820} height={150} viewBox="0 0 820 150" style={{marginTop: 20}}>
								<line x1={0} y1={130} x2={820} y2={130} stroke="#c9cde0" strokeWidth={3} />
								<path d="M30 100 q50 -90 90 -20 t70 0 q40 -70 70 15 q50 -50 100 -10 q70 20 140 -40" stroke={C.blue} strokeWidth={7} fill="none" strokeLinecap="round" strokeDasharray={700} strokeDashoffset={700 * (1 - sign)} />
							</svg>
						</div>
					</Tilt3D>
				)}
				{f < tL && f > 52 && (
					<div style={{position: 'absolute', top: 260, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${pop(f, 52)})`}}>
						<Tag color={GREEN}>Verkauft</Tag>
					</div>
				)}
				{f >= tL && (
					<>
						<div style={{position: 'absolute', top: 260, left: 70, right: 70, transform: `translateY(${(1 - pop(f, tL, 15)) * -500}px)`}}>
							<Glass style={{display: 'flex', alignItems: 'center', gap: 30, padding: '30px 36px'}}>
								<IconRing color="#9db8ff" size={110}>
									<Line.Mail size={60} />
								</IconRing>
								<div>
									<div style={{fontSize: 26, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.6, fontWeight: 600}}>Brief · Finanzamt</div>
									<div style={{fontSize: 46, fontWeight: 800, marginTop: 4}}>Belege vorlegen</div>
								</div>
							</Glass>
						</div>
						<Ripple at={tPdf - 4} x={540} y={900} color={C.white} size={260} />
						{f >= tPdf && (
							<div style={{position: 'absolute', top: 560, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${pop(f, tPdf)})`}}>
								<div style={{position: 'relative'}}>
									<DocCard title="Kaufvertrag" sub="Käufer: Anna Beispiel" w={440} badge="PDF" />
									<div style={{position: 'absolute', right: -50, top: -50, transform: `scale(${pop(f, tPdf + 6)})`}}>
										<IconRing color={GREEN} size={150}>
											<Line.Check size={90} color="#fff" stroke={9} />
										</IconRing>
									</div>
								</div>
							</div>
						)}
						{f >= tPdf + 8 && (
							<div style={{position: 'absolute', top: 1180, left: 40, right: 40}}>
								<Keyword text="In Sekunden." size={130} delay={tPdf + 8} gradient={BRAND_TEXT} />
							</div>
						)}
					</>
				)}
			</div>
			{quote > 0 && (
				<div style={{position: 'absolute', inset: 0, opacity: quote}}>
					<div style={{position: 'absolute', top: 420, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: 0.9}}>
						<IconRing color="#b9a6ff" size={180}>
							<Line.Moon size={96} />
						</IconRing>
					</div>
					<div style={{position: 'absolute', top: 700, left: 80, right: 80, fontStyle: 'italic'}}>
						<RevealText text="Zum ersten Mal schlafe ich gut." size={124} delay={tSmile - 4} stagger={4} gradient="linear-gradient(90deg, #ffffff 0%, #ffe3a8 100%)" />
					</div>
					<div style={{position: 'absolute', top: 1200, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: ramp(f, tSmile + 10, tSmile + 20)}}>
						<Tag color="#b9a6ff">Mehmet</Tag>
					</div>
				</div>
			)}
		</Stage>
	);
};

const LIMITS = [
	'Kein Ersatz für den Steuerberater',
	'Fahrzeug-Check bei EU-Autos oft nur Hersteller und Basisdaten',
	'Rückrufdaten nur aus den USA',
	'Voller Verlaufsbericht (z. B. carVertical) kostet Geld',
];

// Szene 6: Ehrlich bleiben. Ruhige Glas-Karten, dann drei Häkchen.
export const S6Ehrlich: React.FC<{d: number}> = () => {
	const f = useCurrentFrame();
	const times = CUES.s6Limits().map(sec);
	const tC = sec(CUES.s6Checks());
	const shrink = ramp(f, tC - 6, tC + 6);
	return (
		<Stage tone="cold">
			<div style={{position: 'absolute', top: 150, left: 70, right: 70}}>
				<RevealText text="Fair gesagt." size={130} align="left" gradient={BRAND_TEXT} />
			</div>
			<div style={{position: 'absolute', top: 400, left: 70, right: 70, display: 'flex', flexDirection: 'column', gap: 24, transform: `scale(${1 - shrink * 0.1})`, transformOrigin: 'top center', opacity: 1 - shrink * 0.45}}>
				{LIMITS.map((t, i) => {
					const s = pop(f, times[i], 16);
					return (
						<div key={t} style={{opacity: Math.min(1, s * 1.5), transform: `perspective(1400px) translateX(${(1 - s) * 300}px) rotateY(${(1 - s) * -35}deg)`}}>
							<Glass style={{display: 'flex', alignItems: 'center', gap: 28, padding: '30px 34px', borderRadius: 26}}>
								<Line.Info size={76} color={i === 0 ? '#b18cff' : '#9db8ff'} />
								<div style={{fontSize: 42, fontWeight: 600, lineHeight: 1.2}}>{t}</div>
							</Glass>
						</div>
					);
				})}
			</div>
			{f >= tC && (
				<div style={{position: 'absolute', top: 1100, left: 50, right: 50, display: 'flex', justifyContent: 'space-around'}}>
					{['einfach', 'deutsch', 'für kleine Händler'].map((t, i) => (
						<div key={t} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, transform: `scale(${pop(f, tC + i * 8)})`}}>
							<IconRing color={GREEN} size={130}>
								<Line.Check size={76} color="#fff" stroke={9} />
							</IconRing>
							<div style={{fontSize: 40, fontWeight: 800, color: C.white, textAlign: 'center', maxWidth: 300}}>{t}</div>
						</div>
					))}
				</div>
			)}
		</Stage>
	);
};

// Schluss: Logo und Slogan, keine Webadresse.
export const SEnd: React.FC<{d: number}> = () => {
	const f = useCurrentFrame();
	const s = pop(f, 4, 11);
	const ring = (k: number) => ((f + k * 20) % 60) / 60;
	return (
		<Stage tone="brand" grid={false} dust={36}>
			<div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 80}}>
				<div style={{position: 'relative', transform: `scale(${s}) rotate(${(1 - s) * -12}deg)`}}>
					{[0, 1, 2].map((k) => (
						<div key={k} style={{position: 'absolute', left: 170 - 220, top: 170 - 220, width: 440, height: 440, borderRadius: '50%', border: '2px solid rgba(190,170,255,0.6)', transform: `scale(${0.8 + ring(k) * 1.2})`, opacity: f > 8 ? 1 - ring(k) : 0}} />
					))}
					<div style={{position: 'absolute', inset: -160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(140,110,255,0.55) 0%, rgba(140,110,255,0) 65%)'}} />
					<div style={{position: 'relative'}}>
						<Logo size={340} />
						<Shine at={18} dur={24} radius={340 * 0.22} />
					</div>
				</div>
				<div style={{textAlign: 'center'}}>
					<RevealText text="DB-Automobile." delay={14} size={110} gradient={BRAND_TEXT} />
					<div style={{height: 10}} />
					<RevealText text="Ordnung im Autohandel." delay={22} size={66} weight={600} color="rgba(255,255,255,0.85)" />
				</div>
			</div>
		</Stage>
	);
};
