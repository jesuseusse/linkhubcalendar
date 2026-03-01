import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/checkAuth";
import { container } from "@/infrastructure/container";
import { LeadStatus } from "@/domain/entities/Lead";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { userId, tenantId } = await checkAuth(req);
    const { leadId } = await params;
    const body = await req.json();
    const status: LeadStatus | null = body.status ?? null;
    const result = await container.updateLeadStatusUseCase.execute(tenantId, leadId, userId, status);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
