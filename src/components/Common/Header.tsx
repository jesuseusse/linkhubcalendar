'use client';

interface Props {
	userName?: string;
	isAuthenticated?: boolean;
	onLogout?: () => void;
}

export function Header({ userName, isAuthenticated, onLogout }: Props) {
	return (
		<header className='bg-primary text-primary-foreground px-4 py-3'>
			<div className='max-w-5xl mx-auto flex items-center justify-between'>
				<span className='text-sm font-semibold tracking-tight'>
					LinkCalendarHub
				</span>
				<div className='flex items-center gap-3'>
					{isAuthenticated && userName && (
						<span className='text-xs text-primary-foreground/60'>{userName}</span>
					)}
					{isAuthenticated && onLogout && (
						<button
							onClick={onLogout}
							className='px-3 py-1 text-xs font-medium bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors'
						>
							Cerrar Sesión
						</button>
					)}
				</div>
			</div>
		</header>
	);
}
