import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logOperation } from "@/lib/operation-log";

const schema = z.object({ title: z.string().trim().min(1).max(80).optional(), status: z.enum(["active", "archived"]).optional(), clearDone: z.boolean().optional() });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const { id } = await params; const cardId = Number(id); const data = schema.safeParse(await request.json()); if (!data.success || !Number.isInteger(cardId)) return NextResponse.json({ error: "请求无效" }, { status: 400 });
  const card = await prisma.dailyTodoCard.findFirst({ where: { id: cardId, userId: user.id } }); if (!card) return NextResponse.json({ error: "卡片不存在" }, { status: 404 });
  const now = new Date();
  if (data.data.clearDone) await prisma.todo.updateMany({ where: { dailyCardId: cardId, userId: user.id, status: "done" }, data: { isDeleted: true, deletedAt: now } });
  const updates = { ...(data.data.title ? { title: data.data.title } : {}), ...(data.data.status === "archived" ? { status: "archived", archivedAt: now } : {}) };
  if (data.data.status === "archived") await prisma.todo.updateMany({ where: { dailyCardId: cardId, userId: user.id }, data: { isDailyArchived: true, dailyArchivedAt: now } });
  const updated = await prisma.dailyTodoCard.update({ where: { id: cardId }, data: updates, include: { items: { where: { isDeleted: false } } } });
  if (data.data.status === "archived") await logOperation({ action: "archive", module: "daily-todos", objectType: "DailyTodoCard", objectId: cardId, detail: `手动归档：${card.title}` });
  return NextResponse.json(updated);
}
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 }); const { id } = await params; const card = await prisma.dailyTodoCard.findFirst({ where: { id: Number(id), userId: user.id } }); if (!card) return NextResponse.json({ error: "卡片不存在" }, { status: 404 });
  await prisma.dailyTodoCard.delete({ where: { id: card.id } }); await logOperation({ action: "delete", module: "daily-todos", objectType: "DailyTodoCard", objectId: card.id, detail: card.title }); return NextResponse.json({ ok: true });
}
