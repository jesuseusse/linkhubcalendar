'use client';

import { useState } from 'react';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';

interface Props {
	onClose: () => void;
}

const BENEFITS = [
	'Tema personalizado para tu perfil',
	'Formulario de contacto para clientes',
	'Calendario de citas online',
	'Galería de fotos profesional',
	'Captura y gestión de leads',
];

export function UpgradeModal({ onClose }: Props) {
	const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
	const interval = billing === 'yearly' ? 'year' : 'month';
	const { checkout, loading, error } = useStripeCheckout(interval);

	return (
		<div className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4'>
			<div className='bg-surface w-full max-w-md relative overflow-hidden shadow-2xl'>
				{/* Top gradient accent */}
				<div className='h-1.5 w-full bg-linear-to-r from-primary via-accent to-primary' />

				<div className='p-6'>
					<button
						onClick={onClose}
						className='absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl leading-none'
						aria-label='Cerrar'
					>
						&times;
					</button>

					{/* Header */}
					<div className='text-center mb-5'>
						<span className='inline-block px-3 py-1 text-xs font-bold bg-primary text-primary-foreground mb-3 tracking-wider'>
							3 MESES GRATIS
						</span>
						<h2 className='text-xl font-bold text-foreground'>
							Activa tu plan Pro
						</h2>
						<p className='text-sm text-muted-foreground mt-1'>
							Sin cobro durante los primeros 3 meses
						</p>
					</div>

					{/* Billing toggle */}
					<div className='flex gap-0 mb-5 border border-border overflow-hidden'>
						<button
							onClick={() => setBilling('monthly')}
							className={`flex-1 py-2 text-xs font-semibold transition-colors ${
								billing === 'monthly'
									? 'bg-primary text-primary-foreground'
									: 'bg-surface text-muted-foreground hover:bg-muted'
							}`}
						>
							Mensual
						</button>
						<button
							onClick={() => setBilling('yearly')}
							className={`flex-1 py-2 text-xs font-semibold transition-colors relative ${
								billing === 'yearly'
									? 'bg-primary text-primary-foreground'
									: 'bg-surface text-muted-foreground hover:bg-muted'
							}`}
						>
							Anual
							<span className={`ml-1.5 text-[10px] font-bold px-1 py-0.5 ${
								billing === 'yearly'
									? 'bg-primary-foreground/20 text-primary-foreground'
									: 'bg-primary text-primary-foreground'
							}`}>
								AHORRA 50%
							</span>
						</button>
					</div>

					{/* Pricing card */}
					<div className='border-2 border-primary p-5 mb-4 relative'>
						<span className='absolute -top-3 left-4 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 tracking-widest'>
							PRO
						</span>

						<div className='flex items-end gap-2 mb-1'>
							{billing === 'yearly' ? (
								<>
									<span className='text-3xl font-extrabold text-foreground'>$900</span>
									<span className='text-sm text-muted-foreground mb-1'>MXN / año</span>
									<span className='ml-auto text-xs text-muted-foreground line-through'>$1,800 MXN</span>
								</>
							) : (
								<>
									<span className='text-3xl font-extrabold text-foreground'>$200</span>
									<span className='text-sm text-muted-foreground mb-1'>MXN / mes</span>
								</>
							)}
						</div>
						{billing === 'yearly' && (
							<p className='text-xs text-muted-foreground mb-4'>equivale a $75 MXN/mes</p>
						)}
						{billing === 'monthly' && (
							<p className='text-xs text-muted-foreground mb-4'>o $900/año y ahorra 50%</p>
						)}

						<ul className='space-y-2 mb-5'>
							{BENEFITS.map(b => (
								<li key={b} className='flex items-start gap-2 text-sm text-foreground'>
									<span className='text-primary font-bold mt-0.5 shrink-0'>✓</span>
									{b}
								</li>
							))}
						</ul>

						{error && (
							<p className='text-xs text-error mb-3'>{error}</p>
						)}

						<button
							onClick={checkout}
							disabled={loading}
							className='w-full py-3 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-wide'
						>
							{loading ? 'Redirigiendo...' : 'Comenzar 3 meses gratis'}
						</button>
					</div>

					<p className='text-center text-[11px] text-muted-foreground'>
						Se requiere tarjeta · Sin cobro durante los primeros 3 meses · Cancela cuando quieras
					</p>
				</div>
			</div>
		</div>
	);
}
