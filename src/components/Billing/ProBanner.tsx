'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
			<div className='max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center gap-4'>
				{/* Icon + copy */}
				<div className='flex items-center gap-3 flex-1 min-w-0'>
					<span className='text-2xl shrink-0' aria-hidden>🎁</span>
					<div>
						<p className='font-bold text-sm sm:text-base leading-snug'>
							¡3 meses GRATIS para ti!
						</p>
						<p className='text-xs text-primary-foreground/80 mt-0.5'>
							Después: $200/mes o $900/año (50% off) · Se requiere tarjeta
						</p>
					</div>
				</div>

				{/* Badges + CTAs */}
				<div className='flex items-center gap-3 shrink-0'>
					<span className='hidden md:inline-block text-[10px] font-bold px-2 py-1 border border-primary-foreground/40 text-primary-foreground/90 tracking-wider'>
						OFERTA LIMITADA
					</span>
					<button
						type='button'
						onClick={onUpgrade}
						className='px-4 py-2 text-xs font-bold bg-primary-foreground text-primary hover:bg-primary-foreground/90 transition-colors tracking-wide whitespace-nowrap'
					>
						Reclamar plan gratis
					</button>
					<Link
						href='/u/admin/dashboard/billing'
						className='text-xs text-primary-foreground/80 hover:text-primary-foreground underline whitespace-nowrap'
					>
						Ver detalles
					</Link>
				</div>

				{/* Dismiss */}
				<button
					type='button'
					onClick={dismiss}
					aria-label='Cerrar banner'
					className='absolute top-2 right-2 sm:static text-primary-foreground/60 hover:text-primary-foreground text-lg leading-none'
				>
					&times;
				</button>
			</div>
		</div>
	);
}
