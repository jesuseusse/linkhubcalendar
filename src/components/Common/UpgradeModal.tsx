'use client';

import { useState } from 'react';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import {
	BILLING_PRICES,
	BILLING_LABELS,
	BILLING_BENEFITS,
} from '@/components/Billing/billing.const';

interface Props {
	onClose: () => void;
}

export function UpgradeModal({ onClose }: Props) {
	const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
	const interval = billing === 'yearly' ? 'year' : 'month';
	const { checkout, loading, error } = useStripeCheckout(interval);

	const isYearly = billing === 'yearly';

	return (
		<div className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4'>
			<div className='bg-surface w-full max-w-sm sm:max-w-md relative overflow-hidden shadow-2xl'>
				{/* Top accent bar */}
				<div className='h-1.5 w-full bg-linear-to-r from-primary via-accent to-primary' />

				<div className='p-5 sm:p-6'>
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
							{BILLING_LABELS.trialBadge}
						</span>
						<h2 className='text-lg sm:text-xl font-bold text-foreground'>
							{BILLING_LABELS.modalTitle}
						</h2>
						<p className='text-sm text-muted-foreground mt-1'>
							{BILLING_LABELS.trialSubtext}
						</p>
					</div>

					{/* Billing toggle */}
					<div className='flex mb-5 border border-border overflow-hidden'>
						<button
							onClick={() => setBilling('monthly')}
							className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
								!isYearly
									? 'bg-primary text-primary-foreground'
									: 'bg-surface text-muted-foreground hover:bg-muted'
							}`}
						>
							{BILLING_LABELS.monthlyTab}
						</button>
						<button
							onClick={() => setBilling('yearly')}
							className={`flex-1 py-2.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
								isYearly
									? 'bg-primary text-primary-foreground'
									: 'bg-surface text-muted-foreground hover:bg-muted'
							}`}
						>
							{BILLING_LABELS.annualTab}
							<span className={`text-[9px] font-bold px-1 py-0.5 leading-none ${
								isYearly
									? 'bg-primary-foreground/20 text-primary-foreground'
									: 'bg-primary/10 text-primary'
							}`}>
								{BILLING_LABELS.annualTabBadge}
							</span>
						</button>
					</div>

					{/* Pricing card */}
					<div className='border-2 border-primary p-4 sm:p-5 mb-4 relative'>
						<span className='absolute -top-3 left-4 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 tracking-widest'>
							{BILLING_LABELS.planBadge}
						</span>

						{/* Price display */}
						{isYearly ? (
							<>
								<div className='flex flex-wrap items-end gap-x-2 gap-y-0.5 mb-0.5'>
									<span className='text-3xl sm:text-4xl font-extrabold text-foreground'>
										${BILLING_PRICES.annual.promo}
									</span>
									<span className='text-sm text-muted-foreground mb-1'>
										{BILLING_PRICES.annual.currency} / {BILLING_PRICES.annual.period}
									</span>
									<span className='ml-auto text-xs text-muted-foreground line-through self-end mb-1'>
										${BILLING_PRICES.annual.regular} MXN
									</span>
								</div>
								<p className='text-xs text-muted-foreground mb-4'>
									{BILLING_LABELS.annualHint}
								</p>
							</>
						) : (
							<>
								<div className='flex flex-wrap items-end gap-x-2 gap-y-0.5 mb-0.5'>
									<span className='text-3xl sm:text-4xl font-extrabold text-foreground'>
										${BILLING_PRICES.monthly.promo}
									</span>
									<span className='text-sm text-muted-foreground mb-1'>
										{BILLING_PRICES.monthly.currency} / {BILLING_PRICES.monthly.period}
									</span>
									<span className='ml-auto text-xs text-muted-foreground line-through self-end mb-1'>
										${BILLING_PRICES.monthly.regular} MXN
									</span>
								</div>
								<p className='text-xs text-muted-foreground mb-4'>
									{BILLING_LABELS.monthlyHint}
								</p>
							</>
						)}

						{/* Benefits */}
						<ul className='space-y-2 mb-5'>
							{BILLING_BENEFITS.map(b => (
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
							className='w-full py-3 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-wide'
						>
							{loading ? BILLING_LABELS.ctaLoading : BILLING_LABELS.ctaButton}
						</button>
					</div>

					<p className='text-center text-[11px] text-muted-foreground leading-relaxed'>
						{BILLING_LABELS.disclaimer}
					</p>
				</div>
			</div>
		</div>
	);
}
