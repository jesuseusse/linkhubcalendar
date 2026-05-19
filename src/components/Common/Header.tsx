'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
	userName?: string;
	isAuthenticated?: boolean;
	onLogout?: () => void;
	badge?: string;
}

export function Header({ userName, isAuthenticated, onLogout, badge }: Props) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const pathname = usePathname();

	// Derive section paths from current pathname by finding the "/dashboard" segment
	const dashboardIndex = pathname.indexOf('/dashboard');
	const dashboardBase =
		dashboardIndex !== -1
			? pathname.slice(0, dashboardIndex + '/dashboard'.length)
			: '';
	const billingPath = dashboardBase ? dashboardBase + '/billing' : '/billing';
	const seoPath = dashboardBase ? dashboardBase + '/seo' : '/seo';
	const supportPath = dashboardBase ? dashboardBase + '/support' : '/support';

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return (
		<header className='bg-primary text-primary-foreground px-4 py-3'>
			<div className='max-w-5xl mx-auto flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<span className='text-sm font-semibold tracking-tight'>Link Hub</span>
					{badge && (
						<span className='text-xs font-bold px-2 py-0.5 bg-warning text-white rounded uppercase tracking-wider'>
							{badge}
						</span>
					)}
				</div>
				<div className='flex items-center gap-3'>
					{isAuthenticated && userName && (
						<span className='text-xs text-primary-foreground/60'>
							{userName}
						</span>
					)}
					{isAuthenticated && (
						<div className='relative' ref={ref}>
							<button
								onClick={() => setOpen((v) => !v)}
								className='flex items-center justify-center w-8 h-8 rounded bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors'
								aria-label='Configuración'
							>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									className='w-4 h-4'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
									strokeLinejoin='round'
								>
									<circle cx='12' cy='12' r='3' />
									<path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' />
								</svg>
							</button>

							{open && (
								<div className='absolute right-0 mt-2 w-52 rounded-md shadow-lg bg-surface border border-border z-50 overflow-hidden'>
									<Link
										href={seoPath}
										onClick={() => setOpen(false)}
										className='flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors'
									>
										SEO
									</Link>
									<Link
										href={billingPath}
										onClick={() => setOpen(false)}
										className='flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors'
									>
										Cuenta
									</Link>
									<Link
										href={supportPath}
										onClick={() => setOpen(false)}
										className='flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors'
									>
										Soporte y sugerencias
									</Link>
									{onLogout && (
										<button
											onClick={() => { setOpen(false); onLogout(); }}
											className='w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors'
										>
											Cerrar Sesión
										</button>
									)}
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</header>
	);
}
