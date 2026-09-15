import { prisma } from "@/lib/prisma";
const REDACT = /password|token|cookie|secret|authorization/i;
function safe(value?: string) { return value && !REDACT.test(value) ? value.slice(0, 500) : undefined; }
export async function logOperation(data: { action: string; module: string; objectType: string; objectId?: number | string; result?: string; detail?: string; errorMessage?: string }) {
  try { await prisma.operationLog.create({ data: { action: data.action, module: data.module, objectType: data.objectType, objectId: data.objectId == null ? null : String(data.objectId), result: data.result ?? "success", detail: safe(data.detail), errorMessage: safe(data.errorMessage) } }); } catch (error) { console.error("Operation log failed", error); }
}
export async function pruneOperationLogs() { const cutoff = new Date(Date.now() - 30 * 86400000); await prisma.operationLog.deleteMany({ where: { createdAt: { lt: cutoff } } }); }
