'use client';

interface Props {
	enabled: boolean;
	onToggle: (enabled: boolean) => Promise<void>;
	loading: boolean;
}

export function ContactFormToggle({ enabled, onToggle, loading }: Props) {
	return (
		<div className='flex items-center justify-between'>
			<div>
				<h3 className='text-sm font-semibold text-zinc-900'>Título</h3>
				<p className='text-xs text-zinc-500'>Descripción</p>
			</div>
			<button
				onClick={() => onToggle(!enabled)}
				disabled={loading}
				className={`px-3 py-1.5 text-xs font-medium transition-colors ${enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}
			>
				{enabled ? 'activado' : 'desactivado'}
			</button>
		</div>
	);
}
