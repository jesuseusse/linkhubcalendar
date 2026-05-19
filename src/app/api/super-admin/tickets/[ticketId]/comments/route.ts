import { NextRequest, NextResponse } from 'next/server';
import { checkSuperAdmin, ForbiddenError } from '@/lib/auth/checkSuperAdmin';
import { container } from '@/infrastructure/container';

interface Params {
  params: Promise<{ ticketId: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const auth = await checkSuperAdmin(req);
    const { ticketId } = await params;
    const body = await req.json();
    const { userId, content } = body as { userId: string; content: string };
    if (!userId || !content?.trim()) {
      return NextResponse.json({ error: 'userId and content required' }, { status: 400 });
    }
    const comment = await container.addCommentUseCase.execute(
      auth.tenantId,
      userId,
      ticketId,
      content.trim(),
      'Admin',
      auth.email ?? 'admin'
    );
    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
