import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth/checkAuth';
import { resolveEffectiveHostname } from '@/lib/auth/resolveTenantId';
import { container } from '@/infrastructure/container';
import { SeoConfig } from '@/interfaces/ISeoConfig';

export async function GET(req: NextRequest) {
	try {
		await checkAuth(req);
		const hostname = resolveEffectiveHostname(req.headers.get('host') || '');
		const registry = await container.tenantRegistryRepo.getByHostname(hostname);
		return NextResponse.json({ seoConfig: registry?.seoConfig ?? null });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Failed to get SEO config';
		return NextResponse.json({ error: message }, { status: 400 });
	}
}

export async function PUT(req: NextRequest) {
	try {
		await checkAuth(req);
		const hostname = resolveEffectiveHostname(req.headers.get('host') || '');
		const body: SeoConfig = await req.json();
		const registry = await container.tenantRegistryRepo.getByHostname(hostname);
		const seoConfig: SeoConfig = {
			...body,
			canonicalUrl: registry?.domain ?? null,
			favicon: registry?.logoUrl ?? null,
			ogImage: registry?.logoUrl ?? null,
			locale: 'es_ES',
			organizationType: 'Organization'
		};
		const updated = await container.tenantRegistryRepo.updateByHostname(hostname, {
			seoConfig
		});
		return NextResponse.json({ seoConfig: updated.seoConfig ?? null });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Failed to update SEO config';
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
