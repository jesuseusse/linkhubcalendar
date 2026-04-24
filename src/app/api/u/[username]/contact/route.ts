import { NextRequest, NextResponse } from "next/server";
import { userRepo, leadRepo } from "@/infrastructure/container";
import { resolveTenantRegistry, resolveEffectiveHostname } from "@/lib/auth/resolveTenantId";
import { createEmailSenderService } from "@/infrastructure/services/emailSenderFactory";
import { IEmailSenderService, EmailSenderConfig } from "@/domain/interfaces/IEmailSenderService";
import { SubmitLeadUseCase } from "@/application/use-cases/SubmitLeadUseCase";

export async function POST(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const host = req.headers.get("host") || "";
    const hostname = resolveEffectiveHostname(host);
    const registry = await resolveTenantRegistry(req);
    const { tenantId } = registry;

    let emailSenderService: IEmailSenderService | null = null;
    let emailConfig: EmailSenderConfig | null = null;
    try {
      emailSenderService = createEmailSenderService(registry);
      const fromEmail = registry.sesConfig?.fromEmail ?? registry.resendFromEmail!;
      emailConfig = { tenantId, apiKey: registry.resendApiKey ?? "", fromEmail };
    } catch {
      // Email not configured for this tenant — proceed without notification
    }

    const dashboardUrl = `https://${hostname}/u/admin/dashboard/leads`;
    const useCase = new SubmitLeadUseCase(
      userRepo,
      leadRepo,
      emailSenderService,
      emailConfig,
      dashboardUrl,
      registry.companyName
    );

    const body = await req.json();
    await useCase.execute(tenantId, username, body);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Submission failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
