import Link from 'next/link';
import { headers } from 'next/headers';
import { resolveEffectiveHostname } from '@/lib/auth/resolveTenantId';
import { container } from '@/infrastructure/container';

async function getTenantName(): Promise<string | null> {
	try {
		const headersList = await headers();
		const host = headersList.get('host') || '';
		const hostname = resolveEffectiveHostname(host);
		const config = await container.tenantRegistryRepo.getByHostname(hostname);
		return config?.companyName ?? null;
	} catch {
		return null;
	}
}

export default async function TenantNotFound() {
	const companyName = await getTenantName();

	return (
		<div className='min-h-screen flex items-center justify-center bg-background p-6'>
			<div className='text-center max-w-sm w-full space-y-8'>
				<div className='space-y-1'>
					<p className='text-[7rem] sm:text-[9rem] font-black leading-none tracking-tighter text-primary select-none'>
						404
					</p>
					<div className='h-1 w-12 bg-primary mx-auto rounded-full opacity-30' />
				</div>

				<div className='space-y-2'>
					<h1 className='text-lg font-semibold text-foreground'>
						Página no encontrada
					</h1>
					<p className='text-sm text-muted-foreground leading-relaxed'>
						{companyName
							? `Este contenido de ${companyName} no existe o fue movido.`
							: 'El contenido que buscas no existe o fue movido.'}
					</p>
				</div>

				<Link
					href='/'
					className='inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity'
				>
					← Ir al inicio
				</Link>
			</div>
		</div>
	);
}
