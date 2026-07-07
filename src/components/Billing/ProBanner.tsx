'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BILLING_LABELS } from '@/components/Billing/billing.const';

interface Props {
	onUpgrade: () => void;
}

const DISMISS_KEY = 'pro_banner_dismissed_session';

export function ProBanner({ onUpgrade }: Props) {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const dismissed = sessionStorage.getItem(DISMISS_KEY);
		if (!dismissed) setVisible(true);
	}, []);

	function dismiss() {
		sessionStorage.setItem(DISMISS_KEY, '1');
		setVisible(false);
	}

	if (!visible) return null;

	return (
		<div className='relative bg-primary text-primary-foreground'>
			<div className='max-w-5xl mx-auto px-4 py-3 sm:py-4'>
				{/* Mobile: stacked layout */}
				<div className='flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pr-6 sm:pr-0'>
					{/* Icon + copy */}
					<div className='flex items-start sm:items-center gap-3 flex-1 min-w-0'>
						<span className='text-xl sm:text-2xl shrink-0 mt-0.5 sm:mt-0' aria-hidden>🎁</span>
						<div className='min-w-0'>
							<p className='font-bold text-sm sm:text-base leading-snug'>
								{BILLING_LABELS.bannerHeadline}
							</p>
							<p className='text-xs text-primary-foreground/80 mt-0.5 leading-snug'>
								{BILLING_LABELS.bannerSubtext}
							</p>
						</div>
					</div>

					{/* CTAs */}
					<div className='flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap'>
						<span className='hidden lg:inline-block text-[10px] font-bold px-2 py-1 border border-primary-foreground/40 text-primary-foreground/90 tracking-wider whitespace-nowrap'>
							{BILLING_LABELS.limitedOffer}
						</span>
						<button
							type='button'
							onClick={onUpgrade}
							className='px-4 py-2 text-xs font-bold bg-primary-foreground text-primary hover:bg-primary-foreground/90 active:bg-primary-foreground/80 transition-colors tracking-wide whitespace-nowrap'
						>
							{BILLING_LABELS.bannerCta}
						</button>
						<Link
							href='/u/admin/dashboard/billing'
							className='text-xs text-primary-foreground/80 hover:text-primary-foreground underline whitespace-nowrap'
						>
							{BILLING_LABELS.bannerDetails}
						</Link>
					</div>
				</div>

				{/* Dismiss — absolute on mobile, inline on sm+ */}
				<button
					type='button'
					onClick={dismiss}
					aria-label='Cerrar banner'
					className='absolute top-2.5 right-3 text-primary-foreground/60 hover:text-primary-foreground text-lg leading-none'
				>
					&times;
				</button>
			</div>
		</div>
	);
}
