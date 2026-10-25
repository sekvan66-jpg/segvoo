import React from 'react';
import {C, font} from '../theme';

export const Fill: React.FC<{bg: string; children?: React.ReactNode; style?: React.CSSProperties}> = ({bg, children, style}) => (
	<div style={{position: 'absolute', inset: 0, background: bg, overflow: 'hidden', fontFamily: font, ...style}}>{children}</div>
);

export const Abs: React.FC<{x: number; y: number; children: React.ReactNode; style?: React.CSSProperties}> = ({x, y, children, style}) => (
	<div style={{position: 'absolute', left: x, top: y, ...style}}>{children}</div>
);

// Ein Blatt Papier mit angedeuteten Zeilen und optionaler Überschrift.
export const Sheet: React.FC<{w?: number; label?: string; rot?: number; tint?: string; style?: React.CSSProperties}> = ({
	w = 180,
	label,
	rot = 0,
	tint = C.paper,
	style,
}) => (
	<div
		style={{
			width: w,
			height: w * 1.3,
			background: tint,
			borderRadius: 8,
			boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
			transform: `rotate(${rot}deg)`,
			padding: w * 0.1,
			boxSizing: 'border-box',
			fontFamily: font,
			...style,
		}}
	>
		{label && (
			<div style={{fontSize: w * 0.11, fontWeight: 800, color: C.ink, marginBottom: w * 0.06}}>{label}</div>
		)}
		{Array.from({length: 6}).map((_, i) => (
			<div key={i} style={{height: w * 0.035, background: C.paperLine, marginBottom: w * 0.07, width: `${90 - ((i * 17) % 35)}%`, borderRadius: 4}} />
		))}
	</div>
);

// Schreibtisch über die ganze Breite.
export const Desk: React.FC<{y: number; day?: boolean}> = ({y, day}) => (
	<div style={{position: 'absolute', left: -40, right: -40, top: y, height: 2000}}>
		<div style={{height: 40, background: day ? '#dcae7e' : '#7d5a40', borderRadius: 12}} />
		<div style={{height: 2000, background: day ? C.deskDay : C.desk}} />
	</div>
);

// Stapel aus versetzten Blättern; count steuert die Höhe.
export const PaperPile: React.FC<{count: number; x: number; bottom: number; w?: number}> = ({count, x, bottom, w = 220}) => (
	<div style={{position: 'absolute', left: x, top: bottom}}>
		{Array.from({length: Math.floor(count)}).map((_, i) => (
			<div
				key={i}
				style={{
					position: 'absolute',
					left: ((i * 37) % 23) - 11,
					top: -i * 16,
					width: w,
					height: 22,
					background: i % 3 === 0 ? '#fffdf6' : i % 3 === 1 ? C.paper : '#efe8d6',
					borderRadius: 4,
					transform: `rotate(${((i * 53) % 9) - 4}deg)`,
					boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
				}}
			/>
		))}
	</div>
);

export const Coffee: React.FC<{steam: boolean; frame: number}> = ({steam, frame}) => (
	<svg width={140} height={180} viewBox="0 0 140 180">
		{steam &&
			[30, 60, 90].map((x, i) => (
				<path
					key={x}
					d={`M${x} 60 q-12 -15 0 -30 q12 -15 0 -30`}
					stroke="rgba(255,255,255,0.5)"
					strokeWidth={5}
					fill="none"
					transform={`translate(0 ${-((frame + i * 10) % 30)})`}
					opacity={1 - ((frame + i * 10) % 30) / 30}
				/>
			))}
		<rect x={15} y={70} width={95} height={100} rx={14} fill="#d9dce8" />
		<path d="M110 90 q30 0 30 30 q0 30 -30 30" stroke="#d9dce8" strokeWidth={12} fill="none" />
		<ellipse cx={62} cy={74} rx={44} ry={8} fill="#3b2516" />
	</svg>
);

export const Laptop: React.FC<{glow: number; children?: React.ReactNode; w?: number}> = ({glow, children, w = 520}) => (
	<div style={{width: w, position: 'relative'}}>
		<div
			style={{
				width: w,
				height: w * 0.62,
				background: '#1c2033',
				borderRadius: 18,
				padding: 16,
				boxSizing: 'border-box',
				boxShadow: `0 0 ${120 * glow}px ${40 * glow}px rgba(120,150,255,${0.35 * glow})`,
			}}
		>
			<div style={{width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden', background: `rgba(160,185,255,${0.25 + glow * 0.5})`, position: 'relative'}}>
				{children}
			</div>
		</div>
		<div style={{width: w * 1.15, marginLeft: -w * 0.075, height: 22, background: '#2b3048', borderRadius: '0 0 18px 18px'}} />
	</div>
);

export const Window: React.FC<{w: number; h: number; children?: React.ReactNode; style?: React.CSSProperties}> = ({w, h, children, style}) => (
	<div style={{width: w, height: h, position: 'relative', ...style}}>
		<svg width={w} height={h} viewBox="0 0 100 160" preserveAspectRatio="none" style={{position: 'absolute'}}>
			<rect x={0} y={0} width={100} height={160} fill="#2d3a6b" />
			<line x1={50} y1={0} x2={50} y2={160} stroke="#6b4a34" strokeWidth={4} />
			<line x1={0} y1={80} x2={100} y2={80} stroke="#6b4a34" strokeWidth={4} />
			<rect x={0} y={0} width={100} height={160} fill="none" stroke="#6b4a34" strokeWidth={8} />
		</svg>
		{children}
	</div>
);
