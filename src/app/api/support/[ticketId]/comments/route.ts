import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth/checkAuth';
import { container } from '@/infrastructure/container';

/**
 * POST /api/support/[ticketId]/comments
 * Adds a comment to a ticket. Only allowed when the ticket status is `open`.
 *
 * Body: { content: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { userId, tenantId, email } = await checkAuth(req);
    const { ticketId } = await params;
    const body = await req.json();
    const content: string = body.content?.trim();

    if (!content) {
      return NextResponse.json({ error: 'El comentario no puede estar vacío' }, { status: 400 });
    }

    const user = await container.userRepo.findById(tenantId, userId);
    const userName = user?.name ?? email ?? 'Usuario';

    const result = await container.addCommentUseCase.execute(
      tenantId,
      userId,
      ticketId,
      content,
      userName,
      email ?? ''
    );

    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add comment';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
