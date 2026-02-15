import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/checkAuth";
import { container } from "@/infrastructure/container";
import { adminDb } from "@/lib/firebase/admin";

export async function PUT(req: NextRequest) {
  try {
    const { userId, tenantId } = await checkAuth(req);
    const { domain } = await req.json();
    if (!domain || typeof domain !== "string") {
      return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
    }
    const cleanDomain = domain.toLowerCase().trim();
    const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;
    if (!domainRegex.test(cleanDomain)) {
      return NextResponse.json({ error: "Invalid domain format" }, { status: 400 });
    }
    const user = await container.getProfileUseCase.execute(tenantId, userId);
    await adminDb.collection("domains").doc(cleanDomain).set({
      username: user.username,
      userId,
      verified: false,
      createdAt: new Date(),
    });
    return NextResponse.json({
      domain: cleanDomain,
      verified: false,
      instructions: `Add a CNAME record pointing ${cleanDomain} to ${process.env.NEXT_PUBLIC_DOMAIN}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to set domain";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await checkAuth(req);
    const domainsSnapshot = await adminDb.collection("domains").where("userId", "==", userId).get();
    const batch = adminDb.batch();
    domainsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete domain";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
