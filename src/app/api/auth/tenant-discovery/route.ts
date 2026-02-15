import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { resolveEffectiveHostname } from '@/lib/auth/resolveTenantId';

export async function GET(req: NextRequest) {
	const host = req.headers.get('host') || '';
	const hostname = resolveEffectiveHostname(host);

	try {
		const doc = await adminDb
			.collection('tenant_registry')
			.doc(hostname)
			.get();

		if (!doc.exists) {
			return NextResponse.json(
				{ error: 'Domain not authorized' },
				{ status: 404 }
			);
		}

		const tenantId = doc.data()?.tenantId;
		return NextResponse.json({ tenantId });
	} catch (error) {
		return NextResponse.json(
			{ error: 'Discovery failed', details: error },
			{ status: 500 }
		);
	}
}
