import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/checkAuth";
import { container } from "@/infrastructure/container";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slotId: string }> }) {
  try {
    const { userId, tenantId } = await checkAuth(req);
    const { slotId } = await params;
    const result = await container.releaseCalendarSlotUseCase.execute(tenantId, userId, slotId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Release failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
