import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = pathname === "/login" || pathname === "/register" || pathname.startsWith("/api/auth/") || pathname === "/api/inspiration/cron" || pathname === "/api/cron/daily-archive" || pathname.startsWith("/share/");
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method) && pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/") && request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "请求来源校验失败" }, { status: 403 });
  }

  if (!session && !isPublic) return NextResponse.redirect(new URL("/login", request.url));
  if (session && pathname === "/login") return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.svg).*)"] };
