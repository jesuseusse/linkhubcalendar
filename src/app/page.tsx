import Link from 'next/link';

export default function LandingPage() {
	return (
		<div className='min-h-screen bg-surface flex flex-col items-center justify-center p-4'>
			<div className='text-center max-w-lg'>
				<h1 className='text-4xl font-bold text-foreground mb-4'>LinkHub</h1>
				<p className='text-muted-foreground mb-8'>
					Crea tu página de enlaces personal. Comparte tu foto de perfil y todos
					tus enlaces importantes en un solo lugar con una URL simple y limpia.
				</p>
				<div className='flex gap-4 justify-center'>
					<Link
						href='/admin/login'
						className='px-6 py-3 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors'
					>
						Comenzar
					</Link>
				</div>
			</div>
		</div>
	);
}
