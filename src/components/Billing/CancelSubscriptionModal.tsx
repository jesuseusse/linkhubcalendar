'use client';

import { BILLING_LABELS } from '@/components/Billing/billing.const';

interface Props {
	portalUrl: string | null;
	onClose: () => void;
}

const { cancelModal } = BILLING_LABELS;

export function CancelSubscriptionModal({ portalUrl, onClose }: Props) {
	function handlePortalClick() {
		if (portalUrl) {
			window.open(portalUrl, '_blank', 'noopener,noreferrer');
		}
		onClose();
	}

	return (
		<div className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4'>
			<div className='bg-surface w-full max-w-sm sm:max-w-md relative overflow-hidden shadow-2xl'>
				{/* Top accent */}
				<div className='h-1 w-full bg-error' />

				<div className='p-5 sm:p-6'>
					<button
						onClick={onClose}
						className='absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl leading-none'
						aria-label='Cerrar'
					>
						&times;
					</button>

					{/* Header */}
					<h2 className='text-base sm:text-lg font-bold text-foreground mb-1 pr-6'>
						{cancelModal.title}
					</h2>
					<p className='text-sm text-muted-foreground mb-5'>
						{cancelModal.subtitle}
					</p>

					{/* Steps */}
					<p className='text-xs font-semibold text-foreground uppercase tracking-wider mb-3'>
						{cancelModal.stepsHeading}
					</p>
					<ol className='space-y-3 mb-6'>
						{cancelModal.steps.map((step, i) => (
							<li key={i} className='flex items-start gap-3'>
								<span className='shrink-0 w-5 h-5 rounded-full bg-muted text-muted-foreground text-[11px] font-bold flex items-center justify-center mt-0.5'>
									{i + 1}
								</span>
								<span className='text-sm text-foreground leading-snug'>{step}</span>
							</li>
						))}
					</ol>

					{/* CTAs */}
					<div className='flex flex-col gap-2'>
						<button
							type='button'
							onClick={handlePortalClick}
							disabled={!portalUrl}
							className='w-full py-2.5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
						>
							{portalUrl ? (
								<>
									{cancelModal.portalCta}
									<span aria-hidden>↗</span>
								</>
							) : (
								cancelModal.portalLoading
							)}
						</button>
						<button
							type='button'
							onClick={onClose}
							className='w-full py-2.5 text-sm font-medium border border-border text-foreground bg-surface hover:bg-muted active:bg-muted transition-colors'
						>
							{cancelModal.keepCta}
						</button>
					</div>

					<p className='text-center text-[11px] text-muted-foreground mt-3'>
						{cancelModal.portalNote}
					</p>
				</div>
			</div>
		</div>
	);
}
