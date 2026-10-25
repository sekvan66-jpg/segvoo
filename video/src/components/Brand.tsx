import React from 'react';
import {C, font} from '../theme';

// Vereinfachte Nachbildung des Logos: „db“ mit „Automobile“ in Blau und Violett auf weißem, abgerundetem Quadrat.
// Sobald eine Logo-Datei in guter Qualität vorliegt, kann sie hier ersetzt werden.
export const Logo: React.FC<{size?: number}> = ({size = 220}) => (
	<div
		style={{
			width: size,
			height: size,
			borderRadius: size * 0.22,
			background: C.white,
			boxShadow: '0 20px 60px rgba(40,30,120,0.35)',
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			fontFamily: font,
		}}
	>
		<div
			style={{
				fontSize: size * 0.48,
				fontWeight: 800,
				lineHeight: 1,
				letterSpacing: -size * 0.02,
				background: C.brandGradient,
				WebkitBackgroundClip: 'text',
				color: 'transparent',
			}}
		>
			db
		</div>
		<div style={{fontSize: size * 0.1, fontWeight: 600, color: C.violet, marginTop: size * 0.02}}>Automobile</div>
	</div>
);

const NAV = ['Übersicht', 'Bestand', 'mobile.de', 'Kunden', 'Rechnungen', 'AUTO1 Preis-Check', 'Buchhaltung', 'Handelsbuch', 'Termine'];

export const Sidebar: React.FC<{active?: string; w?: number}> = ({active = 'Übersicht', w = 250}) => (
	<div style={{width: w, background: C.white, height: '100%', padding: '24px 14px', boxSizing: 'border-box', borderRight: '1px solid #e3e6f5'}}>
		<div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 26}}>
			<Logo size={44} />
			<div style={{fontWeight: 800, color: C.ink, fontSize: 20}}>DB-Automobile</div>
		</div>
		{NAV.map((n) => (
			<div
				key={n}
				style={{
					padding: '10px 14px',
					borderRadius: 10,
					fontSize: 17,
					fontWeight: n === active ? 600 : 400,
					color: n === active ? C.white : C.muted,
					background: n === active ? C.blue : 'transparent',
					marginBottom: 4,
				}}
			>
				{n}
			</div>
		))}
	</div>
);

export const Card: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
	<div style={{background: C.white, borderRadius: 18, padding: 20, boxShadow: '0 8px 24px rgba(60,70,140,0.12)', fontFamily: font, ...style}}>{children}</div>
);

export const Button: React.FC<{children: React.ReactNode; pressed?: boolean; style?: React.CSSProperties}> = ({children, pressed, style}) => (
	<div
		style={{
			display: 'inline-block',
			background: C.blue,
			color: C.white,
			fontWeight: 600,
			fontSize: 22,
			padding: '14px 22px',
			borderRadius: 12,
			transform: `scale(${pressed ? 0.94 : 1})`,
			boxShadow: pressed ? '0 2px 6px rgba(47,107,255,0.3)' : '0 8px 20px rgba(47,107,255,0.35)',
			fontFamily: font,
			...style,
		}}
	>
		{children}
	</div>
);

export const SyncBadge: React.FC<{scale?: number}> = ({scale = 1}) => (
	<div style={{display: 'inline-flex', alignItems: 'center', gap: 8 * scale, background: '#e7f8ef', color: C.green, borderRadius: 999, padding: `${6 * scale}px ${14 * scale}px`, fontWeight: 600, fontSize: 16 * scale, fontFamily: font}}>
		<div style={{width: 10 * scale, height: 10 * scale, borderRadius: 99, background: C.green}} />
		Cloud synchronisiert
	</div>
);

// Gefüllte Balken im Verlauf von Blau zu Violett (Übersicht).
export const Bars: React.FC<{values: number[]; h: number; grow: number}> = ({values, h, grow}) => (
	<div style={{display: 'flex', alignItems: 'flex-end', gap: 12, height: h}}>
		{values.map((v, i) => (
			<div key={i} style={{flex: 1, height: h * v * grow, background: 'linear-gradient(180deg, #7b4dff, #2f6bff)', borderRadius: 8}} />
		))}
	</div>
);

// Übersicht mit erfundenen Beispieldaten.
export const Dashboard: React.FC<{grow?: number; compact?: boolean}> = ({grow = 1, compact}) => (
	<div style={{display: 'flex', width: '100%', height: '100%', background: C.appBg, fontFamily: font}}>
		{!compact && <Sidebar />}
		<div style={{flex: 1, padding: compact ? 18 : 28, display: 'flex', flexDirection: 'column', gap: compact ? 12 : 18}}>
			<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
				<div style={{fontSize: compact ? 26 : 32, fontWeight: 800, color: C.ink}}>Übersicht</div>
				<SyncBadge scale={compact ? 0.8 : 1} />
			</div>
			{!compact && (
				<div style={{display: 'flex', gap: 12}}>
					<Button>+ Fahrzeug</Button>
					<Button style={{background: C.violet}}>+ Kaufvertrag/Rechnung</Button>
				</div>
			)}
			<div style={{display: 'flex', gap: compact ? 10 : 16}}>
				{[
					['Im Bestand', '24'],
					['Verkauft (Monat)', '7'],
					['Offene Rechnungen', '3'],
				].map(([k, v]) => (
					<Card key={k} style={{flex: 1, padding: compact ? 12 : 20}}>
						<div style={{fontSize: compact ? 13 : 16, color: C.muted}}>{k}</div>
						<div style={{fontSize: compact ? 30 : 40, fontWeight: 800, color: C.ink}}>{v}</div>
					</Card>
				))}
			</div>
			<Card style={{flex: 1, padding: compact ? 14 : 20}}>
				<div style={{fontSize: compact ? 15 : 18, color: C.muted, marginBottom: 10}}>Verkäufe</div>
				<Bars values={[0.4, 0.55, 0.35, 0.7, 0.6, 0.85, 0.75]} h={compact ? 110 : 200} grow={grow} />
			</Card>
		</div>
	</div>
);
