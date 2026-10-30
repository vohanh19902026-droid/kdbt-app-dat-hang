import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = pathname === "/login" || pathname.startsWith("/api/auth/") || pathname === "/manifest.webmanifest" || pathname === "/icon.svg" || pathname === "/offline.html";
  const hasSession = Boolean(getSessionCookie(request));
  if (!isPublic && !hasSession) return NextResponse.redirect(new URL("/login", request.url));
  if (pathname === "/login" && hasSession) return NextResponse.redirect(new URL("/orders", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|css|js)$).*)"] };
