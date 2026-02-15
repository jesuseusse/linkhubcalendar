'use client';

interface Props {
	enabled: boolean;
	onToggle: (enabled: boolean) => Promise<void>;
	loading: boolean;
}

export function CalendarToggle({ enabled, onToggle, loading }: Props) {
	return (
		<div className='flex items-center justify-between'>
			<div>
				<h3 className='text-sm font-semibold text-zinc-900'>Calendario</h3>
				<p className='text-xs text-zinc-500'>
					Activa o desactiva la disponibilidad de tu calendario para recibir
					citas.
				</p>
			</div>
			<button
				onClick={() => onToggle(!enabled)}
				disabled={loading}
				className={`px-3 py-1.5 text-xs font-medium transition-colors ${enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}
			>
				{enabled ? 'Activado' : 'Desactivado'}
			</button>
		</div>
	);
}
