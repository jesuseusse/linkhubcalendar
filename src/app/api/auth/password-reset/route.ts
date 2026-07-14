import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { resolveTenantRegistry } from '@/lib/auth/resolveTenantId';
import { createEmailSenderService } from '@/infrastructure/services/emailSenderFactory';

const SENT = NextResponse.json({ sent: true });

export async function POST(req: NextRequest) {
	let email: string;
	try {
		const body = await req.json();
		email = typeof body?.email === 'string' ? body.email.trim() : '';
	} catch {
		return SENT;
	}

	if (!email) return SENT;

	try {
		const tenantRegistry = await resolveTenantRegistry(req);
		if (!tenantRegistry) return SENT;

		const { tenantId, companyName, logoUrl, domain } = tenantRegistry;

		let oobCode: string;
		try {
			const tenantAuth = adminAuth.tenantManager().authForTenant(tenantId);
			const rawLink = await tenantAuth.generatePasswordResetLink(email);
			oobCode = new URL(rawLink).searchParams.get('oobCode') ?? '';
		} catch {
			return SENT;
		}

		if (!oobCode || !domain) return SENT;

		const resetUrl = `https://${domain}/u/admin/login?oobCode=${encodeURIComponent(oobCode)}`;

		try {
			const emailSenderService = createEmailSenderService(tenantRegistry);
			const fromEmail =
				tenantRegistry.sesConfig?.fromEmail ?? tenantRegistry.resendFromEmail ?? '';
			await emailSenderService.sendPasswordResetEmail(
				{ tenantId, apiKey: tenantRegistry.resendApiKey ?? '', fromEmail },
				email,
				resetUrl,
				companyName ?? null,
				logoUrl ?? null
			);
		} catch {
			// email service not configured — silently skip
		}
	} catch {
		// unexpected error — still return 200
	}

	return SENT;
}
