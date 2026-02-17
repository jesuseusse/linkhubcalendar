import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth/checkAuth';
import { container } from '@/infrastructure/container';

export async function POST(req: NextRequest) {
	try {
		const { userId, tenantId, tenantRegistry } = await checkAuth(req);

		if (!tenantRegistry.resendApiKey || !tenantRegistry.resendFromEmail) {
			return NextResponse.json(
				{ error: 'Servicio de correo no configurado para este tenant' },
				{ status: 500 }
			);
		}

		const result = await container.sendEmailVerificationUseCase.execute({
			tenantId,
			userId,
			emailConfig: {
				tenantId,
				apiKey: tenantRegistry.resendApiKey,
				fromEmail: tenantRegistry.resendFromEmail
			},
			companyName: tenantRegistry.companyName ?? undefined
		});

		return NextResponse.json(result);
	} catch (err: unknown) {
		const message =
			err instanceof Error ? err.message : 'Failed to send verification email';
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
