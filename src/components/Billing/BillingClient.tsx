'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { BILLING_LABELS } from '@/components/Billing/billing.const';

type DiscountInfo = {
	percentOff: number | null;
	amountOff: number | null;
	currency: string | null;
	duration: string;
	durationInMonths: number | null;
};

function formatDate(ms: number): string {
	return new Intl.DateTimeFormat('es-MX', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}).format(new Date(ms));
}

function formatPromoSuccess(discount: DiscountInfo | null): string {
	if (!discount) return 'Código aplicado correctamente.';
	const amountStr =
		discount.percentOff != null
			? `${discount.percentOff}% de descuento`
			: discount.amountOff != null && discount.currency
				? `${(discount.amountOff / 100).toFixed(2)} ${discount.currency.toUpperCase()} de descuento`
				: 'descuento';
	const durationStr =
		discount.duration === 'forever'
			? 'de forma permanente'
			: discount.duration === 'repeating' && discount.durationInMonths != null
				? `por ${discount.durationInMonths} ${discount.durationInMonths === 1 ? 'mes' : 'meses'}`
				: 'en el próximo ciclo de facturación';
	return `Código aplicado. Obtendrás ${amountStr} ${durationStr}.`;
}

export function BillingClient() {
	const { user, token } = useAuthContext();
	const [portalUrl, setPortalUrl] = useState<string | null>(null);
	const [showPromoInput, setShowPromoInput] = useState(false);
	const [promoCode, setPromoCode] = useState('');
	const [promoLoading, setPromoLoading] = useState(false);
	const [promoError, setPromoError] = useState<string | null>(null);
	const [promoSuccess, setPromoSuccess] = useState<DiscountInfo | null>(null);

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
	const showPromoForm = isPro && !cancelScheduled;

	async function handleApplyPromo(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!promoCode.trim() || promoLoading) return;
		setPromoLoading(true);
		setPromoError(null);
		setPromoSuccess(null);
		try {
			const res = await fetch('/api/stripe/apply-promo', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
				body: JSON.stringify({ code: promoCode.trim() })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error ?? 'Error al aplicar el código');
			setPromoSuccess(data.discount);
			setPromoCode('');
			setShowPromoInput(false);
		} catch (err) {
			setPromoError(err instanceof Error ? err.message : 'Error al aplicar el código');
		} finally {
			setPromoLoading(false);
		}
	}

	return (
		<div className='space-y-4'>
			{/* Plan name + billing interval + status badge */}
			<div className='flex flex-wrap items-center gap-3'>
				<span className='text-sm font-semibold text-foreground capitalize'>
					{isPro
						? user.billingInterval === 'year'
							? BILLING_LABELS.billingAnnualLabel
							: BILLING_LABELS.billingMonthlyLabel
						: BILLING_LABELS.billingFreeLabel}
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

			{/* Promo code — only for active pro subscribers */}
			{showPromoForm && (
				<div className='pt-2'>
					{!showPromoInput ? (
						<button
							type='button'
							onClick={() => setShowPromoInput(true)}
							className='text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors'
						>
							Tengo un código de promoción
						</button>
					) : (
						<>
							<p className='text-xs font-medium text-foreground mb-1'>Código de promoción</p>
							<form onSubmit={handleApplyPromo} className='flex gap-2'>
								<input
									type='text'
									value={promoCode}
									onChange={e => setPromoCode(e.target.value.toUpperCase())}
									placeholder='Ej. SAVE20'
									disabled={promoLoading}
									className='flex-1 min-w-0 px-3 py-1.5 text-sm border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-border disabled:opacity-50'
								/>
								<button
									type='submit'
									disabled={promoLoading || !promoCode.trim()}
									className='px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50'
								>
									{promoLoading ? 'Aplicando...' : 'Aplicar'}
								</button>
							</form>
							{promoError && (
								<p className='mt-1.5 text-xs text-error'>{promoError}</p>
							)}
						</>
					)}
					{promoSuccess !== null && (
						<p className='mt-1.5 text-xs text-green-700'>
							{formatPromoSuccess(promoSuccess)}
						</p>
					)}
				</div>
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
