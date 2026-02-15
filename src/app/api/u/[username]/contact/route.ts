import { NextRequest, NextResponse } from "next/server";
import { container } from "@/infrastructure/container";
import { resolveTenantId } from "@/lib/auth/resolveTenantId";

export async function POST(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const tenantId = await resolveTenantId(req);
    const body = await req.json();
    await container.submitLeadUseCase.execute(tenantId, username, body);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Submission failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
