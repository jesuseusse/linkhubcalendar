import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/checkAuth";
import { container } from "@/infrastructure/container";

export async function POST(req: NextRequest) {
  try {
    const { userId, tenantId } = await checkAuth(req);
    const result = await container.sendEmailVerificationUseCase.execute(tenantId, userId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send verification email";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
