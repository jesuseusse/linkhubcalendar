'use client';

import { useState } from 'react';

interface Props {
	onClose: () => void;
	email?: string;
}

export function UpgradeModal({ onClose, email }: Props) {
	const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

	const openWhatsApp = (plan: string) => {
		const message = `Hola, quiero actualizar al plan ${plan}.${email ? ` Mi correo es: ${email}` : ''}`;
		const url = `https://wa.me/525513746423?text=${encodeURIComponent(message)}`;
		window.open(url, '_blank');
	};

	return (
		<div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
			<div className='bg-surface w-full max-w-lg p-6 relative'>
				<button
					onClick={onClose}
					className='absolute top-3 right-3 text-muted-foreground hover:text-foreground text-lg'
				>
					&times;
				</button>
				<h2 className='text-lg font-semibold text-foreground mb-1'>
					Actualiza tu plan
				</h2>
				<p className='text-sm text-muted-foreground mb-4'>
					Desbloquea más funciones y lleva tu cuenta al siguiente nivel.
				</p>
				<div className='flex gap-2 mb-4'>
					<button
						onClick={() => setBilling('monthly')}
						className={`px-3 py-1 text-xs font-medium transition-colors ${billing === 'monthly' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
					>
						Mensual
					</button>
					<button
						onClick={() => setBilling('yearly')}
						className={`px-3 py-1 text-xs font-medium transition-colors ${billing === 'yearly' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
					>
						Anual
					</button>
				</div>
				<div className='grid grid-cols-2 gap-4'>
					<div className='border border-border p-4'>
						<h3 className='text-sm font-semibold text-foreground'>Pro</h3>
						<p className='text-lg font-bold text-foreground my-2'>
							{billing === 'monthly' ? '$19 USD / mes' : '$190 USD / año'}
						</p>
						<ul className='text-xs text-muted-foreground space-y-1 mb-4'>
							<li>Acceso a funciones avanzadas</li>
							<li>Soporte prioritario</li>
						</ul>
						<button
							onClick={() => openWhatsApp('Pro')}
							className='w-full py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors'
						>
							Seleccionar
						</button>
					</div>
					<div className='border border-border p-4'>
						<h3 className='text-sm font-semibold text-foreground'>Team</h3>
						<p className='text-lg font-bold text-foreground my-2'>
							{billing === 'monthly' ? '$49 USD / mes' : '$490 USD / año'}
						</p>
						<ul className='text-xs text-muted-foreground space-y-1 mb-4'>
							<li>Todo lo incluido en Pro</li>
							<li>Gestión de múltiples usuarios</li>
							<li>Soporte dedicado</li>
						</ul>
						<button
							onClick={() => openWhatsApp('Team')}
							className='w-full py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors'
						>
							Seleccionar
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
