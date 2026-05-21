import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth/checkAuth';
import { container } from '@/infrastructure/container';

export async function PUT(req: NextRequest) {
  try {
    const { userId, tenantId } = await checkAuth(req);
    const body = await req.json();
    const orderedIds: string[] = body.orderedIds;
    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: 'orderedIds must be an array' }, { status: 400 });
    }
    const photos = await container.reorderGalleryPhotosUseCase.execute(
      tenantId,
      userId,
      orderedIds
    );
    return NextResponse.json({ photos });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Reorder failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
