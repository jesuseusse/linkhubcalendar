import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/checkAuth";
import { container } from "@/infrastructure/container";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ linkId: string }> }) {
  try {
    const { userId, tenantId } = await checkAuth(req);
    const { linkId } = await params;
    const body = await req.json();
    const result = await container.updateLinkUseCase.execute(tenantId, userId, linkId, body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ linkId: string }> }) {
  try {
    const { userId, tenantId } = await checkAuth(req);
    const { linkId } = await params;
    const result = await container.deleteLinkUseCase.execute(tenantId, userId, linkId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
