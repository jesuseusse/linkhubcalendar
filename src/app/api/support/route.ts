import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth/checkAuth';
import { container } from '@/infrastructure/container';
import { FirebaseStorageService } from '@/infrastructure/services/FirebaseStorageService';
import { createEmailSenderService } from '@/infrastructure/services/emailSenderFactory';
import { IEmailSenderService, EmailSenderConfig } from '@/domain/interfaces/IEmailSenderService';
import { CreateSupportTicketUseCase } from '@/application/use-cases/ManageSupportTicketsUseCase';
import { CreateSupportTicketDto } from '@/domain/dtos/AuthDtos';
import { DeviceType, TicketType } from '@/domain/entities/SupportTicket';

/**
 * GET /api/support
 * Returns all support tickets for the authenticated user.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId, tenantId } = await checkAuth(req);
    const result = await container.getSupportTicketsUseCase.execute(tenantId, userId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get support tickets';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * POST /api/support
 * Creates a new support ticket. Accepts multipart/form-data to allow an optional screenshot.
 *
 * Form fields:
 * - type: 'error' | 'suggestion'
 * - title: string
 * - description: string
 * - deviceType?: DeviceType (for error tickets)
 * - deviceOther?: string
 * - whatsappPhone?: string
 * - screenshot?: File
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, tenantId, email, tenantRegistry } = await checkAuth(req);

    const formData = await req.formData();
    const type = formData.get('type') as TicketType;
    const title = (formData.get('title') as string)?.trim();
    const description = (formData.get('description') as string)?.trim();
    const deviceType = (formData.get('deviceType') as DeviceType) || undefined;
    const deviceOther = (formData.get('deviceOther') as string)?.trim() || undefined;
    const whatsappPhone = (formData.get('whatsappPhone') as string)?.trim() || undefined;
    const screenshotFile = formData.get('screenshot') as File | null;

    if (!type || !title || !description) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Upload screenshot to Firebase Storage if provided
    let screenshotUrl: string | undefined;
    if (screenshotFile && screenshotFile.size > 0) {
      const arrayBuffer = await screenshotFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const storageService = new FirebaseStorageService();
      screenshotUrl = await storageService.saveFile(tenantId, {
        buffer,
        originalName: `support-screenshots/${userId}/${Date.now()}.webp`,
        mimeType: screenshotFile.type || 'image/webp',
      });
    }

    // Resolve email service from tenant registry (fails silently if not configured)
    let emailSenderService: IEmailSenderService | null = null;
    let emailConfig: EmailSenderConfig | null = null;
    try {
      emailSenderService = createEmailSenderService(tenantRegistry);
      const fromEmail = tenantRegistry.sesConfig?.fromEmail ?? tenantRegistry.resendFromEmail!;
      emailConfig = { tenantId, apiKey: tenantRegistry.resendApiKey ?? '', fromEmail };
    } catch {
      // Email not configured — notification will be skipped
    }

    // Look up the user's display name for the admin notification
    const user = await container.userRepo.findById(tenantId, userId);
    const userName = user?.name ?? email ?? 'Usuario';

    const useCase = new CreateSupportTicketUseCase(
      container.supportTicketRepo,
      emailSenderService,
      emailConfig,
      tenantRegistry.companyName
    );

    const dto: CreateSupportTicketDto = {
      type,
      title,
      description,
      deviceType,
      deviceOther,
      whatsappPhone,
    };

    const result = await useCase.execute(tenantId, userId, email ?? '', userName, dto, screenshotUrl);
    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create support ticket';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
