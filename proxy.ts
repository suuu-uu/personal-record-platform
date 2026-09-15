import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = pathname === "/login" || pathname.startsWith("/api/auth/") || pathname === "/api/inspiration/cron";
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session && !isPublic) return NextResponse.redirect(new URL("/login", request.url));
  if (session && pathname === "/login") return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.svg).*)"] };
