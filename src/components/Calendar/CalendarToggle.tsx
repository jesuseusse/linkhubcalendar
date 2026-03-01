'use client';

interface Props {
	enabled: boolean;
	onToggle: (enabled: boolean) => Promise<void>;
	loading: boolean;
}

export function CalendarToggle({ enabled, onToggle, loading }: Props) {
	const buttonName = enabled ? 'está activado' : 'está desactivado';
	const loadingStatus = enabled ? 'desactivando...' : 'activando...';
	return (
		<div className='flex items-center justify-between'>
			<div>
				<h3 className='text-sm font-semibold text-foreground'>Calendario</h3>
				<p className='text-xs text-muted-foreground'>
					Activa o desactiva la disponibilidad de tu calendario para recibir
					citas.
				</p>
			</div>
			<button
				onClick={() => onToggle(!enabled)}
				disabled={loading}
				className={`px-3 py-1.5 text-xs font-medium transition-colors ${enabled ? 'bg-success-light text-success' : 'bg-muted text-muted-foreground'}`}
			>
				{loading ? loadingStatus : buttonName}
			</button>
		</div>
	);
}
