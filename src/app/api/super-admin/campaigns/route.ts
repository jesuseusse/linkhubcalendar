import { NextRequest, NextResponse } from 'next/server';
import { checkSuperAdmin, ForbiddenError } from '@/lib/auth/checkSuperAdmin';
import { container } from '@/infrastructure/container';
import { resolveTenantRegistry, resolveEffectiveHostname } from '@/lib/auth/resolveTenantId';
import { createEmailSenderService } from '@/infrastructure/services/emailSenderFactory';
import { IEmailSenderService, EmailSenderConfig } from '@/domain/interfaces/IEmailSenderService';
import { SendCampaignUseCase } from '@/application/use-cases/CampaignUseCases';
import { SendCampaignDto } from '@/dtos/user.dto';

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await checkSuperAdmin(req);
    const url = new URL(req.url);
    const cursor = url.searchParams.get('cursor') ?? undefined;
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '10', 10), 50);
    const result = await container.getCampaignsPaginatedUseCase.execute(tenantId, { cursor, limit });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await checkSuperAdmin(req);
    const body: SendCampaignDto = await req.json();

    const registry = await resolveTenantRegistry(req);
    const host = req.headers.get('host') || '';
    const hostname = resolveEffectiveHostname(host);
    const appBaseUrl = `https://${hostname}`;

    let emailSenderService: IEmailSenderService | null = null;
    let emailConfig: EmailSenderConfig | null = null;
    try {
      emailSenderService = createEmailSenderService(registry);
      const fromEmail = registry.sesConfig?.fromEmail ?? registry.resendFromEmail!;
      emailConfig = { tenantId, apiKey: registry.resendApiKey ?? '', fromEmail };
    } catch {
      // Email not configured — will throw inside use case
    }

    const useCase = new SendCampaignUseCase(
      container.campaignRepo,
      emailSenderService,
      emailConfig,
      appBaseUrl
    );

    const result = await useCase.execute(tenantId, body);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
