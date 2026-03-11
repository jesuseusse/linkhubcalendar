import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/checkAuth";
import { container, userRepo } from "@/infrastructure/container";

export async function POST(req: NextRequest) {
  try {
    const { userId, tenantId } = await checkAuth(req);
    const body = await req.json();
    const { name, email, referredBy } = body;
    await userRepo.createWithId(tenantId, userId, {
      name: name || "",
      email: email || "",
      ...(referredBy ? { referredBy } : {}),
      links: [],
      calendarEnabled: false,
      contactFormEnabled: false,
      plan: "free",
    });
    const result = await container.getProfileUseCase.execute(tenantId, userId);
    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Signup failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
