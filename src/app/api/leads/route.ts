import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/checkAuth";
import { container } from "@/infrastructure/container";
import { LeadOrder } from "@/domain/interfaces/ILeadRepository";
import { LeadStatus } from "@/domain/entities/Lead";

export async function GET(req: NextRequest) {
  try {
    const { userId, tenantId } = await checkAuth(req);
    const { searchParams } = req.nextUrl;

    const paginated = searchParams.has('limit') || searchParams.has('order') || searchParams.has('cursor');

    if (paginated) {
      const order = (searchParams.get('order') ?? 'recent') as LeadOrder;
      const status = searchParams.get('status') as LeadStatus | null ?? undefined;
      const cursor = searchParams.get('cursor') ?? undefined;
      const limit = parseInt(searchParams.get('limit') ?? '25', 10);
      const result = await container.getLeadsPaginatedUseCase.execute(tenantId, userId, { order, status, cursor, limit });
      return NextResponse.json(result);
    }

    const result = await container.getLeadsUseCase.execute(tenantId, userId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to get leads";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
