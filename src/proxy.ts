// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export const config = {
	matcher: ['/((?!api|_next|static|favicon.ico|.*\\..*).*)']
};

export async function proxy(req: NextRequest) {
	const host = req.headers.get('host') || '';
	const url = req.nextUrl.clone();

	console.log('Middleware hit for host:', host, 'and path:', url.pathname);

	// 1. Skip dominios raíz rápidamente
	const mainDomain = process.env.NEXT_PUBLIC_DOMAIN || 'linkhub.dev';
	if (host === mainDomain) {
		console.log('Host is main domain, skipping middleware');
		return NextResponse.next();
	}

	console.log(`Proxy: will attempt to resolve tenant for host ${host}`);

	// 2. Resolución de Tenant (TIP: Usa una Cache de 1er nivel)
	// Si puedes, usa Vercel Edge Config o una llamada a Redis aquí.
	// Evita importar librerías que traigan DB drivers (como Prisma) al middleware.
	try {
		let tenantRegistryId = host.split('.')[0]; // O tu lógica de resolveTenant simplificada

		console.log(`Proxy: TenantId found ${tenantRegistryId}`);

		if (
			tenantRegistryId.includes('localhost') ||
			tenantRegistryId === '127.0.0.1' ||
			tenantRegistryId.includes('amplifyapp.com') // Para testing en AWS Amplify
		) {
			console.log(
				'Host is localhost or testing domain, using default tenant hostname'
			);
			tenantRegistryId = process.env.NEXT_PUBLIC_DEFAULT_TENANT_HOSTNAME || '';
			console.log(`Default tenant hostname resolved to ${tenantRegistryId}`);
			if (!tenantRegistryId) {
				throw new Error(
					'NEXT_PUBLIC_DEFAULT_TENANT_HOSTNAME missing in .env.local'
				);
			}
		}

		if (tenantRegistryId) {
			// REWRITE ESTRATÉGICO:
			// Enviamos a una ruta interna que Next.js maneja mejor
			url.pathname = `/tenants/${tenantRegistryId}${url.pathname}`;

			console.log(`Proxy: Rewriting to ${url.pathname}`);

			const response = NextResponse.rewrite(url);

			// 3. Inyectar el Tenant ID en los headers para que tus Server Components
			// no tengan que volver a calcular quién es el host.
			response.headers.set('x-tenant-id', tenantRegistryId);

			return response;
		}
	} catch (e) {
		console.error('Middleware Error:', e);
	}

	return NextResponse.next();
}
