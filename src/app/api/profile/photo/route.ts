import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/checkAuth";
import { container } from "@/infrastructure/container";

export async function POST(req: NextRequest) {
  try {
    const { userId, tenantId } = await checkAuth(req);
    const formData = await req.formData();
    const file = formData.get("photo") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await container.uploadPhotoUseCase.execute(tenantId, userId, {
      buffer,
      originalName: file.name,
      mimeType: file.type,
    });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
