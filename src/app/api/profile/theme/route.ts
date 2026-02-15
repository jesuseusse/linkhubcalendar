import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/checkAuth";
import { container } from "@/infrastructure/container";

export async function PUT(req: NextRequest) {
  try {
    const { userId, tenantId } = await checkAuth(req);
    const theme = await req.json();
    const result = await container.updateThemeUseCase.execute(tenantId, userId, theme);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
