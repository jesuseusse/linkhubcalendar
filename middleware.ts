import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"],
};

export async function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const mainDomain = process.env.NEXT_PUBLIC_DOMAIN || "localhost:3000";

  if (host === mainDomain || host === `www.${mainDomain}` || host.includes("localhost") || host.includes("127.0.0.1")) {
    return NextResponse.next();
  }

  try {
    const { resolveTenant } = await import("@/lib/tenant/resolveTenant");
    const username = await resolveTenant(host);
    if (username) {
      const url = req.nextUrl.clone();
      url.pathname = `/${username}${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.rewrite(url);
    }
  } catch {
    // Tenant resolution failed
  }

  return NextResponse.next();
}
