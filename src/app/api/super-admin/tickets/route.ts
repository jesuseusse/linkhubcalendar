import { NextRequest, NextResponse } from 'next/server';
import { checkSuperAdmin, ForbiddenError } from '@/lib/auth/checkSuperAdmin';
import { container } from '@/infrastructure/container';

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await checkSuperAdmin(req);
    const tickets = await container.getAllTicketsUseCase.execute(tenantId);
    return NextResponse.json(tickets);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
