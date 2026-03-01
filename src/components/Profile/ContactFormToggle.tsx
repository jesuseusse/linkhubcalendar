'use client';

interface Props {
	enabled: boolean;
	onToggle: (enabled: boolean) => Promise<void>;
	loading: boolean;
}

export function ContactFormToggle({ enabled, onToggle, loading }: Props) {
	const buttonName = enabled ? 'está activado' : 'está desactivado';
	const loadingStatus = enabled ? 'desactivando...' : 'activando...';

	return (
		<div className='flex items-center justify-between mt-2'>
			<div>
				<h3 className='text-sm font-semibold text-foreground'>
					Se solicitará:
				</h3>
				<p className='text-xs text-muted-foreground'>
					Nombre, teléfono y correo
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
