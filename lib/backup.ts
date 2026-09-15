import { prisma } from "@/lib/prisma";
import { mkdir, writeFile, stat, readFile, unlink } from "node:fs/promises";
import path from "node:path";

export const BACKUP_VERSION = 1;
export const scopes = ["all", "achievements", "todos", "footprints", "inspirations"] as const;
export type BackupScope = typeof scopes[number];
const models = { achievements: "achievement", todos: "todo", footprints: "footprint", inspirations: "inspirationItem" } as const;
const backupDir = path.join(process.cwd(), "storage", "backups");

function clean(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clean(v)]));
  return value;
}

export async function collect(scope: BackupScope) {
  const selected = scope === "all" ? Object.keys(models) : [scope];
  const data: Record<string, unknown> = {};
  for (const key of selected) data[key] = clean(await (prisma as any)[models[key as keyof typeof models]].findMany({ orderBy: { id: "asc" } }));
  return { version: BACKUP_VERSION, exportedAt: new Date().toISOString(), scope, modules: selected, data };
}

export async function saveBackup(type: "manual" | "auto", scope: BackupScope) {
  await mkdir(backupDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const fileName = `backup-${stamp}-${Date.now()}.json`;
  const filePath = path.join(backupDir, fileName);
  try {
    await writeFile(filePath, JSON.stringify(await collect(scope), null, 2), "utf8");
    const size = (await stat(filePath)).size;
    return await prisma.backupRecord.create({ data: { type, scope, fileName, fileSize: size, storagePath: filePath, status: "success" } });
  } catch (error) {
    return await prisma.backupRecord.create({ data: { type, scope, fileName, storagePath: filePath, status: "failed", errorMessage: error instanceof Error ? error.message : String(error) } });
  }
}

export async function loadBackup(fileName: string) { return JSON.parse(await readFile(path.join(backupDir, path.basename(fileName)), "utf8")); }
export async function removeBackup(fileName: string) { try { await unlink(path.join(backupDir, path.basename(fileName))); } catch {} }
