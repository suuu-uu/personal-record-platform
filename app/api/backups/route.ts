import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { collect, loadBackup, removeBackup, saveBackup, scopes, type BackupScope } from "@/lib/backup";

export async function GET(request: Request) {
  const url = new URL(request.url); const action = url.searchParams.get("action");
  if (action === "export") {
    const scope = (scopes.includes((url.searchParams.get("scope") ?? "all") as BackupScope) ? url.searchParams.get("scope") : "all") as BackupScope;
    const format = url.searchParams.get("format") ?? "json"; const payload = await collect(scope);
    if (format === "csv") {
      const chunks = Object.entries(payload.data).map(([module, rows]) => { const list = rows as Record<string, unknown>[]; const keys = [...new Set(list.flatMap(row => Object.keys(row)))]; return `# ${module}\n${keys.join(",")}\n${list.map(row => keys.map(key => JSON.stringify(row[key] ?? "")).join(",")).join("\n")}`; }).join("\n\n");
      return new Response(chunks, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename=backup-${new Date().toISOString().slice(0, 10)}.csv` } });
    }
    return new Response(JSON.stringify(payload, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename=backup-${new Date().toISOString().slice(0, 10)}.json` } });
  }
  if (action === "download") { const record = await prisma.backupRecord.findUnique({ where: { id: Number(url.searchParams.get("id")) } }); if (!record) return NextResponse.json({ error: "备份不存在" }, { status: 404 }); const payload = await loadBackup(record.fileName); return new Response(JSON.stringify(payload, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename=${record.fileName}` } }); }
  return NextResponse.json(await prisma.backupRecord.findMany({ orderBy: { createdAt: "desc" } }));
}

export async function POST(request: Request) {
  const body = await request.json();
  if (body.action === "create") return NextResponse.json(await saveBackup("manual", body.scope ?? "all"));
  if (body.action === "delete") { const record = await prisma.backupRecord.findUnique({ where: { id: Number(body.id) } }); if (record) { await removeBackup(record.fileName); await prisma.backupRecord.delete({ where: { id: record.id } }); } return NextResponse.json({ ok: true }); }
  if (body.action === "preview") { const backup = body.backup; if (!backup || backup.version !== 1 || !backup.data) return NextResponse.json({ error: "文件结构或版本号无效" }, { status: 400 }); const result: Record<string, unknown> = {}; for (const [module, rows] of Object.entries(backup.data)) { const model = { achievements: "achievement", todos: "todo", footprints: "footprint", inspirations: "inspirationItem" }[module]; if (!model) continue; const ids = (rows as { id?: number }[]).map(row => row.id).filter(Boolean) as number[]; const existing = await (prisma as any)[model].count({ where: { id: { in: ids } } }); result[module] = { total: (rows as unknown[]).length, existing, added: (rows as unknown[]).length - existing }; } return NextResponse.json({ modules: result }); }
  if (body.action === "import") { const backup = body.backup; const mode = body.mode ?? "merge"; try { await prisma.$transaction(async tx => { for (const [module, rows] of Object.entries(backup.data)) { const model = { achievements: "achievement", todos: "todo", footprints: "footprint", inspirations: "inspirationItem" }[module] as any; if (!model) continue; const delegate = (tx as any)[model]; if (mode === "clear") await delegate.deleteMany({}); for (const raw of rows as any[]) { const data = { ...raw }; for (const key of ["createdAt", "updatedAt", "startDate", "endDate", "dueDate", "completedAt", "archivedAt", "visitedAt", "collectedAt", "startedAt", "finishedAt"]) if (data[key]) data[key] = new Date(data[key]); if (mode === "merge") { const found = data.id ? await delegate.findUnique({ where: { id: data.id } }) : null; if (found) continue; } await delegate.upsert({ where: { id: data.id }, create: data, update: mode === "overwrite" ? data : {} }); } } }); return NextResponse.json({ ok: true }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "导入失败，原有数据未修改" }, { status: 400 }); } }
  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}
