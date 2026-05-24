'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';

function formatDate(ms: number): string {
	return new Intl.DateTimeFormat('es-MX', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}).format(new Date(ms));
}

export function BillingClient() {
	const { user, token } = useAuthContext();
	const [portalUrl, setPortalUrl] = useState<string | null>(null);

	useEffect(() => {
		if (!token) return;
		fetch('/api/stripe/portal-link', {
			headers: { Authorization: `Bearer ${token}` }
		})
			.then(res => (res.ok ? res.json() : null))
			.then(data => { if (data?.url) setPortalUrl(data.url); })
			.catch(() => {});
	}, [token]);

	if (!user) return null;

	const plan = user.plan ?? 'free';
	const isPro = plan !== 'free';
	const cancelScheduled = user.subscriptionCancelAtPeriodEnd ?? false;
	const isPastDue = user.subscriptionStatus === 'past_due';
	const periodEnd = user.planExpiredAt ?? null;

	return (
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

			{/* Stripe customer portal — opens in new tab with email prefilled */}
			{isPro && portalUrl && (
				<div className='pt-2 space-y-2'>
					<a
						href={portalUrl}
						target='_blank'
						rel='noopener noreferrer'
						className='inline-flex items-center px-4 py-2 text-sm font-medium border border-border text-foreground bg-surface hover:bg-muted transition-colors'
					>
						Gestionar facturación
					</a>
					<p className='text-xs text-muted-foreground'>
						Desde aquí puedes cancelar tu suscripción, actualizar tu método de pago o aplicar códigos de descuento.
					</p>
				</div>
			)}
		</div>
	);
}
