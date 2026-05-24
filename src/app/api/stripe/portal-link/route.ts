import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth/checkAuth';

export async function GET(req: NextRequest) {
	try {
		const { email, tenantRegistry } = await checkAuth(req);
		const link = tenantRegistry.stripeConfig?.customerPortalLink;

		if (!link) {
			return NextResponse.json(
				{ error: 'Portal de clientes no configurado' },
				{ status: 404 }
			);
		}

		const url = new URL(link);
		if (email) url.searchParams.set('prefilled_email', email);

		return NextResponse.json({ url: url.toString() });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Error al obtener el portal';
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
