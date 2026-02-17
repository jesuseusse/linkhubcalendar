import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { resolveEffectiveHostname } from '@/lib/auth/resolveTenantId';
import { TenantRegistryData } from '@/interfaces/ITenantRegistryData';

export interface AuthResult {
	userId: string;
	tenantId: string;
	emailVerified: boolean;
	tenantRegistry: TenantRegistryData;
}

export async function checkAuth(req: NextRequest): Promise<AuthResult> {
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
	const data = registryDoc.data();
	const validTenantId = data?.tenantId;

	if (!validTenantId || tokenTenantId !== validTenantId) {
		throw new Error('Security Alert: Tenant ID mismatch for this domain');
	}

	return {
		userId: decoded.uid,
		tenantId: tokenTenantId,
		emailVerified: decoded.email_verified ?? false,
		tenantRegistry: {
			tenantId: validTenantId,
			theme: data?.theme ?? null,
			domain: data?.domain ?? null,
			companyName: data?.companyName ?? null,
			logoUrl: data?.logoUrl ?? null,
			resendApiKey: data?.resendApiKey ?? null,
			resendFromEmail: data?.resendFromEmail ?? null
		}
	};
}
