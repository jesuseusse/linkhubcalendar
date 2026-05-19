import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth/checkAuth';
import { container } from '@/infrastructure/container';
import { TicketStatus } from '@/domain/entities/SupportTicket';

/**
 * GET /api/support/[ticketId]
 * Returns a single ticket with its comment thread.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { userId, tenantId } = await checkAuth(req);
    const { ticketId } = await params;
    const result = await container.getTicketDetailUseCase.execute(tenantId, userId, ticketId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get ticket';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * PATCH /api/support/[ticketId]
 * Updates the status of a ticket.
 *
 * Body: { status: TicketStatus }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { userId, tenantId } = await checkAuth(req);
    const { ticketId } = await params;
    const body = await req.json();
    const status: TicketStatus = body.status;

    if (!status) {
      return NextResponse.json({ error: 'Campo status requerido' }, { status: 400 });
    }

    const result = await container.updateTicketStatusUseCase.execute(tenantId, userId, ticketId, status);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update ticket';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
