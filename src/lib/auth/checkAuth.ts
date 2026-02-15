import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { resolveEffectiveHostname } from '@/lib/auth/resolveTenantId';

export async function checkAuth(
	req: NextRequest
): Promise<{ userId: string; tenantId: string }> {
	const header = req.headers.get('authorization');
	if (!header || !header.startsWith('Bearer ')) {
		throw new Error('Authentication required');
	}
	const token = header.split(' ')[1];
	const decoded = await adminAuth.verifyIdToken(token);
	const tokenTenantId = (decoded.firebase?.tenant as string) ?? null;
	const host = req.headers.get('host') || '';
	const hostname = resolveEffectiveHostname(host);

	const registryDoc = await adminDb
		.collection('tenant_registry')
		.doc(hostname)
		.get();
	const validTenantId = registryDoc.data()?.tenantId;

	if (!validTenantId || tokenTenantId !== validTenantId) {
		throw new Error('Security Alert: Tenant ID mismatch for this domain');
	}

	return { userId: decoded.uid, tenantId: tokenTenantId };
}
