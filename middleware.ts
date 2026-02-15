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
      const path = url.pathname;
      if (path === "/" || path === "") {
        url.pathname = "/t";
        url.searchParams.set("username", username);
      } else if (path === "/calendar") {
        url.pathname = "/t/calendar";
        url.searchParams.set("username", username);
      } else {
        url.pathname = "/t" + path;
        url.searchParams.set("username", username);
      }
      return NextResponse.rewrite(url);
    }
  } catch {
    // Tenant resolution failed
  }

  return NextResponse.next();
}
