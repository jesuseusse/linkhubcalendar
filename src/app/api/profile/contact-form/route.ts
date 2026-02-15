import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/checkAuth";
import { container } from "@/infrastructure/container";

export async function PUT(req: NextRequest) {
  try {
    const { userId, tenantId } = await checkAuth(req);
    const { enabled } = await req.json();
    const result = await container.toggleContactFormUseCase.execute(tenantId, userId, enabled);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
