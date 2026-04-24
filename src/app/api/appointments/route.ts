import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/checkAuth";
import { container } from "@/infrastructure/container";

export async function GET(req: NextRequest) {
  try {
    const { userId, tenantId } = await checkAuth(req);
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10");
    const filterParam = req.nextUrl.searchParams.get("filter");
    const filter = filterParam === 'past' ? 'past' : filterParam === 'upcoming' ? 'upcoming' : undefined;
    const result = await container.getAppointmentsUseCase.execute(tenantId, userId, page, limit, filter);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to get appointments";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
