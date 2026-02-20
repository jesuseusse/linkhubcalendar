'use client';

interface Props {
	success: boolean;
	onClose: () => void;
}

export function StripeResultModal({ success, onClose }: Props) {
	return (
		<div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
			<div className='bg-surface w-full max-w-sm p-6 relative'>
				<h2 className='text-lg font-semibold text-foreground mb-2'>
					{success
						? 'Suscripción actualizada correctamente'
						: 'No se pudo completar el pago, intenta de nuevo'}
				</h2>
				<button
					onClick={onClose}
					className='mt-4 w-full py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors'
				>
					Cerrar
				</button>
			</div>
		</div>
	);
}
