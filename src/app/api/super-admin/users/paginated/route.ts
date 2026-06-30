import { NextRequest, NextResponse } from 'next/server';
import { checkSuperAdmin, ForbiddenError } from '@/lib/auth/checkSuperAdmin';
import { container } from '@/infrastructure/container';

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await checkSuperAdmin(req);
    const url = new URL(req.url);
    const cursor = url.searchParams.get('cursor') ?? undefined;
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '10', 10), 100);
    const plan = url.searchParams.get('plan') ?? undefined;
    const result = await container.getUsersPaginatedUseCase.execute(tenantId, { cursor, limit, plan });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
