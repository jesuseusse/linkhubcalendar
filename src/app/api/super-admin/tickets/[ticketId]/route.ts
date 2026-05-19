import { NextRequest, NextResponse } from 'next/server';
import { checkSuperAdmin, ForbiddenError } from '@/lib/auth/checkSuperAdmin';
import { container } from '@/infrastructure/container';
import { TicketStatus } from '@/domain/entities/SupportTicket';

interface Params {
  params: Promise<{ ticketId: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { tenantId } = await checkSuperAdmin(req);
    const { ticketId } = await params;
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId query param required' }, { status: 400 });
    }
    const detail = await container.getTicketDetailUseCase.execute(tenantId, userId, ticketId);
    return NextResponse.json(detail);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: err instanceof ForbiddenError ? 403 : 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { tenantId } = await checkSuperAdmin(req);
    const { ticketId } = await params;
    const body = await req.json();
    const { userId, status } = body as { userId: string; status: TicketStatus };
    if (!userId || !status) {
      return NextResponse.json({ error: 'userId and status required' }, { status: 400 });
    }
    const ticket = await container.updateTicketStatusUseCase.execute(tenantId, userId, ticketId, status);
    return NextResponse.json(ticket);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
