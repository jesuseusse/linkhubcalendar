import { NextResponse } from 'next/server';
import { container } from '@/infrastructure/container';
import { buildTenantManifest } from '@/lib/tenant/pwaManifest';

/**
 * Per-tenant Web App Manifest. The proxy rewrites `/manifest` on any tenant
 * host to this route, so every domain installs as its own app.
 *
 * Deliberately NOT `/manifest.webmanifest`: the proxy matcher's extension
 * exclusion is not end-anchored, so `.webm` (video) also swallows
 * `.webmanifest` and the request would never be rewritten to the tenant.
 */
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ tenantRegistryId: string }> }
) {
	const { tenantRegistryId } = await params;
	const tenant =
		await container.tenantRegistryRepo.getByHostname(tenantRegistryId);

	if (!tenant) {
		return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
	}

	return new NextResponse(JSON.stringify(buildTenantManifest(tenant)), {
		headers: {
			'Content-Type': 'application/manifest+json; charset=utf-8',
			'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
		}
	});
}
