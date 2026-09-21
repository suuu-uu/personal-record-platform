import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ cardId: z.number().int(), title: z.string().trim().min(1).max(200), description: z.string().trim().max(1000).optional(), priority: z.enum(["low", "medium", "high"]).optional() });
export async function POST(request: Request) { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 }); const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "待办内容不正确" }, { status: 400 }); const card = await prisma.dailyTodoCard.findFirst({ where: { id: parsed.data.cardId, userId: user.id, status: "active" } }); if (!card) return NextResponse.json({ error: "今日卡片不可用" }, { status: 404 }); const max = await prisma.todo.aggregate({ where: { dailyCardId: card.id, userId: user.id }, _max: { sortOrder: true } }); return NextResponse.json(await prisma.todo.create({ data: { title: parsed.data.title, description: parsed.data.description || null, priority: parsed.data.priority || "medium", userId: user.id, dailyCardId: card.id, todoDate: card.cardDate, sortOrder: (max._max.sortOrder || 0) + 1 } }), { status: 201 }); }
