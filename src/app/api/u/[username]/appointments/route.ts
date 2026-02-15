import { NextRequest, NextResponse } from "next/server";
import { container } from "@/infrastructure/container";
import { resolveTenantId } from "@/lib/auth/resolveTenantId";

export async function POST(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const tenantId = await resolveTenantId(req);
    const body = await req.json();
    const result = await container.bookAppointmentUseCase.execute(tenantId, username, body);
    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Booking failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
