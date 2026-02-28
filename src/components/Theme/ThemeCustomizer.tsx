'use client';

import { useState } from 'react';
import { ThemeDto } from '@/dtos/user.dto';
import { ProfilePreview } from './ProfilePreview';

const DEFAULT_THEME: ThemeDto = {
	backgroundColor: '#ffffff',
	textColor: '#18181b',
	buttonColor: '#18181b',
	buttonTextColor: '#ffffff',
	accentColor: '#a1a1aa'
};

interface Props {
	theme?: ThemeDto;
	onSave: (theme: ThemeDto) => Promise<void>;
	loading: boolean;
}

export function ThemeCustomizer({ theme, onSave, loading }: Props) {
	const [current, setCurrent] = useState<ThemeDto>(theme || DEFAULT_THEME);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const handleSave = async () => {
		setError(null);
		setSuccess(false);
		try {
			await onSave(current);
			setSuccess(true);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Error al guardar el tema');
		}
	};

	const fields: { key: keyof ThemeDto; label: string }[] = [
		{ key: 'backgroundColor', label: 'Color de fondo' },
		{ key: 'textColor', label: 'Color de texto' },
		{ key: 'buttonColor', label: 'Color de botón' },
		{ key: 'buttonTextColor', label: 'Texto del botón' },
		{ key: 'accentColor', label: 'Color de acento' }
	];

	return (
		<div className='space-y-4'>
			<div>
				<h3 className='text-sm font-semibold text-foreground'>
					Personalización del tema
				</h3>
				<p className='text-xs text-muted-foreground'>
					Ajusta los colores de tu perfil público.
				</p>
			</div>
			{error && <p className='text-xs text-error'>{error}</p>}
			{success && (
				<p className='text-xs text-success'>Tema guardado correctamente.</p>
			)}
			<div className='grid grid-cols-2 gap-3'>
				{fields.map(({ key, label }) => (
					<div key={key} className='flex items-center gap-2'>
						<input
							type='color'
							value={current[key]}
							onChange={e => setCurrent({ ...current, [key]: e.target.value })}
							className='w-8 h-8 border border-border cursor-pointer'
						/>
						<span className='text-xs text-muted-foreground'>{label}</span>
					</div>
				))}
			</div>
			<ProfilePreview theme={current} />
			<div className='flex gap-2'>
				<button
					onClick={handleSave}
					disabled={loading}
					className='px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors rounded'
				>
					{loading ? 'Guardando...' : 'Guardar'}
				</button>
				<button
					onClick={() => setCurrent(DEFAULT_THEME)}
					className='px-4 py-2 text-sm font-medium bg-muted text-muted-foreground hover:bg-muted transition-colors'
				>
					Restablecer
				</button>
			</div>
		</div>
	);
}
