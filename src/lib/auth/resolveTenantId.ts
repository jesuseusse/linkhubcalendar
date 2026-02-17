import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { adminDb } from '@/lib/firebase/admin';
import { TenantRegistryData } from '@/interfaces/ITenantRegistryData';

/**
 * Devuelve el hostname efectivo para resolver el tenant.
 * En localhost/127.0.0.1 usa NEXT_PUBLIC_DEFAULT_TENANT_HOSTNAME;
 * en producción devuelve el hostname tal cual.
 */
export function resolveEffectiveHostname(host: string): string {
	const hostname = host.split(':')[0];

	if (
		hostname === 'localhost' ||
		hostname === '127.0.0.1' ||
		hostname.includes('amplifyapp.com') // Para testing en AWS Amplify
	) {
		const defaultHostname = process.env.NEXT_PUBLIC_DEFAULT_TENANT_HOSTNAME;
		if (!defaultHostname) {
			throw new Error(
				'NEXT_PUBLIC_DEFAULT_TENANT_HOSTNAME missing in .env.local'
			);
		}
		return defaultHostname;
	}

	return hostname;
}

async function resolveTenantIdByHost(host: string): Promise<string> {
	const hostname = resolveEffectiveHostname(host);

	const doc = await adminDb.collection('tenant_registry').doc(hostname).get();
	if (!doc.exists) {
		throw new Error('Domain not authorized');
	}

	const tenantId = doc.data()?.tenantId;
	if (!tenantId) {
		throw new Error('Tenant ID not found for domain');
	}

	return tenantId;
}

export async function resolveTenantId(req: NextRequest): Promise<string> {
	const host = req.headers.get('host') || '';
	return resolveTenantIdByHost(host);
}

export async function resolveTenantIdFromHeaders(): Promise<string> {
	const headersList = await headers();
	const host = headersList.get('host') || '';
	return resolveTenantIdByHost(host);
}

async function resolveTenantRegistryByHost(
	host: string
): Promise<TenantRegistryData> {
	const hostname = resolveEffectiveHostname(host);

	const doc = await adminDb.collection('tenant_registry').doc(hostname).get();
	if (!doc.exists) {
		throw new Error('Domain not authorized');
	}

	const data = doc.data();
	const tenantId = data?.tenantId;
	if (!tenantId) {
		throw new Error('Tenant ID not found for domain');
	}

	return {
		tenantId,
		theme: data?.theme ?? null,
		domain: data?.domain ?? null,
		companyName: data?.companyName ?? null,
		logoUrl: data?.logoUrl ?? null,
		resendApiKey: data?.resendApiKey ?? null,
		resendFromEmail: data?.resendFromEmail ?? null
	};
}

/**
 * Returns both tenantId and theme from a single Firestore read.
 * Used in the root layout to avoid double reads.
 */
export async function resolveTenantRegistryFromHeaders(): Promise<TenantRegistryData> {
	const headersList = await headers();
	const host = headersList.get('host') || '';

	return resolveTenantRegistryByHost(host);
}
