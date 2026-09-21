import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { archiveExpiredDailyCards } from "@/lib/daily-todos";
import { prisma } from "@/lib/prisma";

export async function GET() { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 }); await archiveExpiredDailyCards(user.id); return NextResponse.json(await prisma.dailyTodoCard.findMany({ where: { userId: user.id, status: "archived" }, include: { items: { where: { isDeleted: false }, orderBy: { sortOrder: "asc" } } }, orderBy: { cardDate: "desc" } })); }
export async function POST(request: Request) { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 }); const all = new URL(request.url).searchParams.get("all") === "1"; if (all && user.role !== "admin") return NextResponse.json({ error: "仅管理员可补跑全部归档" }, { status: 403 }); try { return NextResponse.json({ count: await archiveExpiredDailyCards(all ? undefined : user.id) }); } catch (error) { await prisma.operationLog.create({ data: { userId: user.id, action: "run", module: "daily-todos-cron", objectType: "DailyTodoCard", result: "failed", errorMessage: error instanceof Error ? error.message : "手动归档失败" } }); return NextResponse.json({ error: "归档失败" }, { status: 500 }); } }
