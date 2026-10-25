import React from 'react';
import {C} from '../theme';

type P = {size?: number; color?: string};

export const LockIcon: React.FC<P> = ({size = 120, color = C.violet}) => (
	<svg width={size} height={size} viewBox="0 0 100 100">
		<path d="M30 45 V32 a20 20 0 0 1 40 0 V45" stroke={color} strokeWidth={10} fill="none" />
		<rect x={20} y={44} width={60} height={46} rx={10} fill={color} />
		<circle cx={50} cy={64} r={7} fill="#fff" />
		<rect x={47} y={66} width={6} height={14} rx={3} fill="#fff" />
	</svg>
);

export const CheckIcon: React.FC<P> = ({size = 80, color = C.green}) => (
	<svg width={size} height={size} viewBox="0 0 100 100">
		<circle cx={50} cy={50} r={46} fill={color} />
		<path d="M28 52 L44 68 L74 36" stroke="#fff" strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

export const InfoIcon: React.FC<P> = ({size = 80, color = C.blue}) => (
	<svg width={size} height={size} viewBox="0 0 100 100">
		<circle cx={50} cy={50} r={46} fill={color} />
		<rect x={44} y={42} width={12} height={34} rx={5} fill="#fff" />
		<circle cx={50} cy={28} r={7} fill="#fff" />
	</svg>
);

export const PdfIcon: React.FC<P & {label?: string}> = ({size = 160, label = 'PDF'}) => (
	<svg width={size} height={size * 1.25} viewBox="0 0 100 125">
		<path d="M10 5 H65 L90 30 V118 a5 5 0 0 1 -5 5 H15 a5 5 0 0 1 -5 -5 Z" fill="#fff" stroke="#d6dbef" strokeWidth={2} />
		<path d="M65 5 V30 H90" fill="#eef1fb" stroke="#d6dbef" strokeWidth={2} />
		<rect x={18} y={78} width={64} height={28} rx={6} fill="#e5484d" />
		<text x={50} y={98} textAnchor="middle" fontSize={18} fontWeight={800} fill="#fff" fontFamily="Inter, sans-serif">
			{label}
		</text>
		{[40, 50, 60].map((y) => (
			<rect key={y} x={18} y={y} width={y === 60 ? 40 : 64} height={5} rx={2.5} fill="#cfd5ea" />
		))}
	</svg>
);

export const CarIcon: React.FC<P> = ({size = 200, color = C.blue}) => (
	<svg width={size} height={size * 0.55} viewBox="0 0 200 110">
		<path d="M20 70 L40 35 Q48 22 64 22 H130 Q146 22 156 35 L178 62 Q195 66 195 80 V88 H8 V80 Q8 72 20 70 Z" fill={color} />
		<path d="M52 38 Q56 30 66 30 H96 V60 H40 Z" fill="#cfe0ff" />
		<path d="M104 30 H128 Q138 30 146 40 L160 60 H104 Z" fill="#cfe0ff" />
		<circle cx={52} cy={90} r={18} fill="#1b1f3b" />
		<circle cx={52} cy={90} r={8} fill="#c9cde0" />
		<circle cx={152} cy={90} r={18} fill="#1b1f3b" />
		<circle cx={152} cy={90} r={8} fill="#c9cde0" />
	</svg>
);

export const MailboxIcon: React.FC<P & {open: number}> = ({size = 240, open}) => (
	<svg width={size} height={size} viewBox="0 0 120 120">
		<rect x={56} y={70} width={8} height={50} fill="#4b4f66" />
		<path d="M20 40 Q20 20 40 20 H80 Q100 20 100 40 V75 H20 Z" fill="#3b5bdb" />
		<g transform={`rotate(${-open * 40} 20 55)`}>
			<rect x={20} y={50} width={80} height={10} rx={3} fill="#2f47b0" />
		</g>
		<rect x={92} y={28} width={6} height={22} fill="#e5484d" />
	</svg>
);

export const CalendarIcon: React.FC<P & {checks: number}> = ({size = 260, checks}) => (
	<svg width={size} height={size} viewBox="0 0 120 120">
		<rect x={8} y={16} width={104} height={96} rx={12} fill="#fff" stroke="#dfe3f3" strokeWidth={2} />
		<rect x={8} y={16} width={104} height={24} rx={12} fill={C.blue} />
		<rect x={8} y={30} width={104} height={10} fill={C.blue} />
		{Array.from({length: 12}).map((_, i) => {
			const x = 18 + (i % 4) * 24;
			const y = 50 + Math.floor(i / 4) * 20;
			return (
				<g key={i}>
					<rect x={x} y={y} width={18} height={14} rx={3} fill={i < checks ? '#e7f8ef' : '#f1f3fa'} />
					{i < checks && <path d={`M${x + 4} ${y + 7} l4 4 l7 -8`} stroke={C.green} strokeWidth={2.5} fill="none" strokeLinecap="round" />}
				</g>
			);
		})}
	</svg>
);
