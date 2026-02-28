import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth/checkAuth';
import { userRepo, emailVerificationService } from '@/infrastructure/container';
import { SendEmailVerificationUseCase } from '@/application/use-cases/SendEmailVerificationUseCase';
import { createEmailSenderService } from '@/infrastructure/services/emailSenderFactory';

export async function POST(req: NextRequest) {
	try {
		const { userId, tenantId, tenantRegistry } = await checkAuth(req);

		let emailSenderService;
		try {
			emailSenderService = createEmailSenderService(tenantRegistry);
		} catch {
			return NextResponse.json(
				{ error: 'Servicio de correo no configurado para este tenant' },
				{ status: 500 }
			);
		}

		const fromEmail =
			tenantRegistry.sesConfig?.fromEmail ?? tenantRegistry.resendFromEmail!;

		const sendEmailVerificationUseCase = new SendEmailVerificationUseCase(
			userRepo,
			emailVerificationService,
			emailSenderService
		);

		const result = await sendEmailVerificationUseCase.execute({
			tenantId,
			userId,
			emailConfig: {
				tenantId,
				apiKey: tenantRegistry.resendApiKey ?? '',
				fromEmail
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
