import { logOperation } from "@/lib/operation-log";
export async function captureError(error: unknown, context: { path?: string; loggedIn?: boolean } = {}) {
  const message = error instanceof Error ? error.message : "Unknown error";
  const stack = error instanceof Error ? error.stack : undefined;
  const payload = { message, stack, path: context.path, loggedIn: Boolean(context.loggedIn), timestamp: new Date().toISOString() };
  if (process.env.SENTRY_DSN) { try { await fetch(process.env.SENTRY_DSN, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, platform: "javascript" }), cache: "no-store" }); } catch {} }
  await logOperation({ action: "error", module: "monitoring", objectType: "Application", result: "failed", errorMessage: message, detail: context.path });
}
