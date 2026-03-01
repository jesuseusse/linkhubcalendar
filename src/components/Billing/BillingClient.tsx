'use client';

import { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';

function formatDate(ms: number): string {
	return new Intl.DateTimeFormat('es-MX', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}).format(new Date(ms));
}

export function BillingClient() {
	const { user, token, updateUser } = useAuthContext();
	const [modalOpen, setModalOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (!user) return null;

	const plan = user.plan ?? 'free';
	const isPro = plan !== 'free';
	const cancelScheduled = user.subscriptionCancelAtPeriodEnd ?? false;
	const isPastDue = user.subscriptionStatus === 'past_due';
	const periodEnd = user.planExpiredAt ?? null;

	async function handleCancel() {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch('/api/stripe/cancel', {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` }
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error ?? 'Error al cancelar');
			updateUser({ ...user!, subscriptionCancelAtPeriodEnd: true });
			setModalOpen(false);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Ocurrió un error, intenta de nuevo'
			);
		} finally {
			setLoading(false);
		}
	}

	return (
		<>
			<div className='space-y-4'>
				{/* Plan name + status badge */}
				<div className='flex flex-wrap items-center gap-3'>
					<span className='text-sm font-semibold text-foreground capitalize'>
						Plan {plan}
					</span>
					<span
						className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${
							isPastDue
								? 'bg-error-light text-error border-error/30'
								: cancelScheduled
									? 'bg-yellow-50 text-yellow-700 border-yellow-200'
									: isPro
										? 'bg-green-50 text-green-700 border-green-200'
										: 'bg-muted text-muted-foreground border-border'
						}`}
					>
						{isPastDue
							? 'Pago pendiente'
							: cancelScheduled
								? 'Cancela al final del periodo'
								: isPro
									? 'Activo'
									: 'Gratis'}
					</span>
				</div>

				{/* Period date */}
				{periodEnd && (
					<p className='text-sm text-muted-foreground'>
						{cancelScheduled ? (
							<>
								<span className='font-medium text-foreground'>Acceso hasta:</span>{' '}
								{formatDate(periodEnd)}
							</>
						) : (
							<>
								<span className='font-medium text-foreground'>Próximo pago:</span>{' '}
								{formatDate(periodEnd)}
							</>
						)}
					</p>
				)}

				{/* Cancel button — only for active pro plans */}
				{isPro && !cancelScheduled && (
					<div className='pt-2'>
						<button
							type='button'
							onClick={() => setModalOpen(true)}
							className='px-4 py-2 text-sm font-medium border border-error text-error bg-error-light hover:bg-error/10 transition-colors'
						>
							Cancelar suscripción
						</button>
					</div>
				)}
			</div>

			{/* Confirmation modal */}
			{modalOpen && (
				<div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
					<div className='bg-surface w-full max-w-md p-6'>
						<h2 className='text-base font-semibold text-foreground mb-3'>
							¿Cancelar suscripción?
						</h2>
						<p className='text-sm text-muted-foreground mb-1'>
							Tu plan seguirá activo hasta el{' '}
							<span className='font-medium text-foreground'>
								{periodEnd ? formatDate(periodEnd) : '—'}
							</span>
							.
						</p>
						<p className='text-sm text-muted-foreground mb-1'>
							Podrás seguir usando todas las funciones hasta esa fecha.
						</p>
						<p className='text-sm text-muted-foreground mb-5'>
							Después de esa fecha, tu cuenta pasará al plan gratuito.
						</p>

						{error && (
							<p className='text-sm text-error bg-error-light border border-error/20 p-3 mb-4'>
								{error}
							</p>
						)}

						<div className='flex gap-3 justify-end'>
							<button
								type='button'
								onClick={() => setModalOpen(false)}
								disabled={loading}
								className='px-4 py-2 text-sm font-medium bg-muted text-foreground hover:bg-muted/70 transition-colors disabled:opacity-50'
							>
								Volver
							</button>
							<button
								type='button'
								onClick={handleCancel}
								disabled={loading}
								className='px-4 py-2 text-sm font-medium bg-error text-white hover:bg-error/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
							>
								{loading && (
									<span className='inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin' />
								)}
								Sí, cancelar
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
