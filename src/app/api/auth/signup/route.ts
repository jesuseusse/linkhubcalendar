import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/checkAuth";
import { container, userRepo } from "@/infrastructure/container";
import { normalizeEmail } from "@/utils/normalizeEmail";

export async function POST(req: NextRequest) {
  try {
    const { userId, tenantId, email } = await checkAuth(req);
    const body = await req.json();
    const { name, referredBy } = body;
    await userRepo.createWithId(tenantId, userId, {
      name: name || "",
      // Always the verified Firebase Auth email, never client input — a client-supplied
      // email here could drift in casing (or be arbitrary) from the identity the user
      // actually authenticated with, breaking findByEmail() lookups used by the Stripe
      // webhook (see normalizeEmail.ts).
      email: normalizeEmail(email),
      ...(referredBy ? { referredBy } : {}),
      links: [],
      calendarEnabled: false,
      contactFormEnabled: false,
      galleryEnabled: false,
      galleryPhotos: [],
      plan: "free",
    });
    const result = await container.getProfileUseCase.execute(tenantId, userId);
    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Signup failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
