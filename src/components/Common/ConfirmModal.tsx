'use client';

interface Props {
	title: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	variant?: 'danger' | 'default';
	loading?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export function ConfirmModal({
	title,
	message,
	confirmLabel = 'Confirmar',
	cancelLabel = 'Cancelar',
	variant = 'default',
	loading = false,
	onConfirm,
	onCancel,
}: Props) {
	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20'>
			<div className='w-full max-w-sm bg-background border border-border p-6 space-y-4'>
				<h3 className='text-sm font-semibold text-foreground'>{title}</h3>
				<p className='text-sm text-muted-foreground'>{message}</p>
				<div className='flex gap-3 pt-1'>
					<button
						type='button'
						onClick={onCancel}
						disabled={loading}
						className='flex-1 py-2 text-sm border border-border text-foreground hover:border-foreground transition-colors disabled:opacity-50'
					>
						{cancelLabel}
					</button>
					<button
						type='button'
						onClick={onConfirm}
						disabled={loading}
						className={`flex-1 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
							variant === 'danger'
								? 'bg-error text-white hover:bg-error/90'
								: 'bg-primary text-primary-foreground hover:bg-primary/90'
						}`}
					>
						{loading ? 'Eliminando...' : confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}
