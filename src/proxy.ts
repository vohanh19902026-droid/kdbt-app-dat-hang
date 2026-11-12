import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // API handlers enforce auth and return JSON status responses for fetch clients.
  const isPublic = pathname === "/login" || pathname === "/forgot-password" || pathname === "/reset-password" || pathname.startsWith("/api/") || pathname === "/manifest.webmanifest" || pathname === "/.well-known/assetlinks.json" || pathname === "/icon.svg" || pathname === "/offline.html" || pathname === "/pending-approval";
  const hasSession = Boolean(getSessionCookie(request));
  if (!isPublic && !hasSession) return NextResponse.redirect(new URL("/login", request.url));
  if (pathname === "/login" && hasSession) return NextResponse.redirect(new URL("/orders", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|css|js)$).*)"] };
