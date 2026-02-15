import { NextRequest, NextResponse } from "next/server";
import { container } from "@/infrastructure/container";
import { resolveTenantId } from "@/lib/auth/resolveTenantId";

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const tenantId = await resolveTenantId(req);
    const result = await container.getPublicCalendarUseCase.execute(tenantId, username);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Calendar not found";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
