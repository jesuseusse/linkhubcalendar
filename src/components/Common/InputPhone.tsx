'use client';

import { useState } from 'react';

const COUNTRY_CODES = [
	{ code: '+52', label: 'MX +52' },
	{ code: '+1', label: 'US/CA +1' },
	{ code: '+54', label: 'AR +54' },
	{ code: '+56', label: 'CL +56' },
	{ code: '+57', label: 'CO +57' },
	{ code: '+51', label: 'PE +51' },
	{ code: '+58', label: 'VE +58' },
	{ code: '+34', label: 'ES +34' },
	{ code: '+55', label: 'BR +55' },
];

interface Props {
	value: string;
	onChange: (value: string) => void;
	required?: boolean;
	borderStyle?: React.CSSProperties;
}

export function InputPhone({ value, onChange, required, borderStyle }: Props) {
	const [countryCode, setCountryCode] = useState('+52');

	const phoneNumber = value.startsWith(countryCode)
		? value.slice(countryCode.length).trimStart()
		: value;

	const handleCodeChange = (newCode: string) => {
		setCountryCode(newCode);
		onChange(phoneNumber ? `${newCode} ${phoneNumber}` : '');
	};

	const handleNumberChange = (num: string) => {
		onChange(num ? `${countryCode} ${num}` : '');
	};

	return (
		<div className='flex gap-2'>
			<select
				value={countryCode}
				onChange={e => handleCodeChange(e.target.value)}
				className='px-2 py-2 text-sm border border-border focus:outline-none focus:border-foreground rounded bg-background text-foreground'
				style={borderStyle}
			>
				{COUNTRY_CODES.map(c => (
					<option key={c.code} value={c.code}>
						{c.label}
					</option>
				))}
			</select>
			<input
				type='tel'
				placeholder='Teléfono'
				value={phoneNumber}
				onChange={e => handleNumberChange(e.target.value)}
				required={required}
				className='flex-1 px-3 py-2 text-sm border border-border focus:outline-none focus:border-foreground rounded'
				style={borderStyle}
			/>
		</div>
	);
}
