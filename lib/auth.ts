import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { setUserScope } from "@/lib/prisma";

export const SESSION_COOKIE = "personal_site_session";

function getSecret() {
  if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) throw new Error("AUTH_SECRET must be configured in production");
  return new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "local-development-secret-change-before-deployment",
  );
}

export async function createSession(userId: number, username: string) {
  return new SignJWT({ userId, username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySession(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  const userId = typeof session?.userId === "number" ? session.userId : Number(session?.userId);
  if (!Number.isInteger(userId)) return null;
  setUserScope(userId);
  return prisma.user.findUnique({ where: { id: userId } });
}
