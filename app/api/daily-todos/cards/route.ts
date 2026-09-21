import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { shanghaiDate } from "@/lib/daily-todos";

const schema = z.object({ cardDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), title: z.string().trim().min(1).max(80).optional() });
export async function POST(request: Request) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "卡片信息不正确" }, { status: 400 });
  const cardDate = parsed.data.cardDate || shanghaiDate();
  const card = await prisma.dailyTodoCard.upsert({ where: { userId_cardDate: { userId: user.id, cardDate } }, update: parsed.data.title ? { title: parsed.data.title } : {}, create: { userId: user.id, cardDate, title: parsed.data.title || "今日待办" }, include: { items: true } });
  return NextResponse.json(card, { status: 201 });
}
