import { NextRequest, NextResponse } from "next/server";
import { BookAppointmentUseCase } from "@/application/use-cases/BookAppointmentUseCase";
import { userRepo, appointmentRepo } from "@/infrastructure/container";
import { resolveTenantRegistry, resolveEffectiveHostname } from "@/lib/auth/resolveTenantId";
import { createEmailSenderService } from "@/infrastructure/services/emailSenderFactory";
import { IEmailSenderService, EmailSenderConfig } from "@/domain/interfaces/IEmailSenderService";

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

    const dashboardUrl = `https://${hostname}/tenants/${hostname}/u/admin/dashboard/dates`;
    const useCase = new BookAppointmentUseCase(
      userRepo,
      appointmentRepo,
      emailSenderService,
      emailConfig,
      dashboardUrl,
      registry.companyName
    );

    const body = await req.json();
    const result = await useCase.execute(tenantId, username, body);
    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Booking failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
