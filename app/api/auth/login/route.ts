import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scryptSync, timingSafeEqual } from "node:crypto";
import { clientKey, rateLimit } from "@/lib/security";

const schema = z.object({ username: z.string().min(1), password: z.string().min(1) });

export async function POST(request: Request) {
  const limited = rateLimit(`login:${clientKey(request)}`, 5);
  if (!limited.ok) return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429, headers: { "Retry-After": String(limited.retryAfter) } });
  const result = schema.safeParse(await request.json());
  if (!result.success) return NextResponse.json({ error: "请输入用户名和密码" }, { status: 400 });

  const user = await prisma.user.findFirst({ where: { OR: [{ username: result.data.username }, { email: result.data.username.toLowerCase() }] } });
  const valid = user && (() => { const [salt, key] = user.passwordHash.split(":"); const actual = scryptSync(result.data.password, salt, 64); return timingSafeEqual(actual, Buffer.from(key, "hex")); })();
  if (!valid || !user) return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, await createSession(user.id, user.username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}
