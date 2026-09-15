import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "personal_site_session";

function getSecret() {
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
