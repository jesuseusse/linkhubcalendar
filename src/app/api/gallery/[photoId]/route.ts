import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth/checkAuth';
import { container } from '@/infrastructure/container';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { userId, tenantId } = await checkAuth(req);
    const { photoId } = await params;
    const photos = await container.deleteGalleryPhotoUseCase.execute(tenantId, userId, photoId);
    return NextResponse.json({ photos });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
