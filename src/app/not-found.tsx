import Link from 'next/link';

export default function NotFound() {
	return (
		<div className='min-h-screen flex items-center justify-center bg-background p-6'>
			<div className='text-center max-w-sm w-full space-y-8'>
				<div className='space-y-1'>
					<p className='text-[7rem] sm:text-[9rem] font-black leading-none tracking-tighter text-foreground select-none'>
						404
					</p>
					<div className='h-1 w-12 bg-primary mx-auto rounded-full' />
				</div>

				<div className='space-y-2'>
					<h1 className='text-lg font-semibold text-foreground'>
						Página no encontrada
					</h1>
					<p className='text-sm text-muted-foreground leading-relaxed'>
						El contenido que buscas no existe o fue movido.
					</p>
				</div>

				<Link
					href='/'
					className='inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity rounded-none'
				>
					← Ir al inicio
				</Link>
			</div>
		</div>
	);
}
