import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/checkAuth";
import { userRepo } from "@/infrastructure/container";
import { container } from "@/infrastructure/container";

export async function PUT(req: NextRequest) {
  try {
    const { userId, tenantId } = await checkAuth(req);
    await userRepo.updatePlan(tenantId, userId, "free", null);
    const result = await container.getProfileUseCase.execute(tenantId, userId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Downgrade failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
