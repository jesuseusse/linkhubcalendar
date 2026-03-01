import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/checkAuth";
import { container } from "@/infrastructure/container";

export async function POST(req: NextRequest) {
  try {
    const { userId, tenantId } = await checkAuth(req);
    const body = await req.json();
    const slots = Array.isArray(body) ? body : [body];
    const result = await container.upsertCalendarSlotsUseCase.execute(tenantId, userId, slots);
    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to add slot";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
