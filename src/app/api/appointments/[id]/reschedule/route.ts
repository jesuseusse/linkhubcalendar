import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/checkAuth";
import { container } from "@/infrastructure/container";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, tenantId } = await checkAuth(req);
    const { id } = await params;
    const result = await container.rescheduleAppointmentUseCase.execute(tenantId, userId, id);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Reschedule failed";
    const status = message === "Slot already booked" ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
