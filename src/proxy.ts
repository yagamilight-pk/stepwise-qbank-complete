import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = ["/app", "/admin", "/influencer"];

function providerConfigured() {
  return Boolean(
    process.env.APPWRITE_ENDPOINT?.trim()
    && process.env.APPWRITE_PROJECT_ID?.trim()
    && process.env.APPWRITE_DATABASE_ID?.trim()
    && process.env.APPWRITE_USER_STATE_TABLE_ID?.trim(),
  );
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;
  let routedPath = pathname;

  if (pathname === "/") {
    if (host.startsWith("app.")) {
      routedPath = "/app";
    } else if (host.startsWith("admin.")) {
      routedPath = "/admin";
    } else if (host.startsWith("influencer.")) {
      routedPath = "/influencer";
    }
  }

  const isProtected = protectedPrefixes.some(
    (prefix) => routedPath === prefix || routedPath.startsWith(`${prefix}/`),
  );
  const projectId = process.env.APPWRITE_PROJECT_ID?.trim();
  if (
    providerConfigured()
    && projectId
    && isProtected
    && !request.cookies.has(`a_session_${projectId}`)
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (routedPath !== pathname) {
    return NextResponse.rewrite(new URL(routedPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)"]
};
