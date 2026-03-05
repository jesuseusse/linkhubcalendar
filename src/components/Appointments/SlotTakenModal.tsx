'use client';

interface Props {
	onClose: () => void;
}

export function SlotTakenModal({ onClose }: Props) {
	return (
		<div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40'>
			<div className='w-full sm:max-w-sm bg-background border border-border p-6'>
				<p className='text-sm font-semibold text-foreground mb-2'>
					Horario ya fué agendado
				</p>
				<p className='text-sm text-muted-foreground mb-5'>
					Vuelva a agendar en otro horario disponible.
				</p>
				<button
					onClick={onClose}
					className='w-full py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors'
				>
					Entendido
				</button>
			</div>
		</div>
	);
}
