import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    if (host.startsWith("app.")) {
      return NextResponse.rewrite(new URL("/app", request.url));
    }
    if (host.startsWith("admin.")) {
      return NextResponse.rewrite(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)"]
};
