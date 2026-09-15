import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import { collectWithRetry } from "@/lib/inspiration/collect";
import { isMonthKey, monthKeyInShanghai } from "@/lib/inspiration/schedule";
export async function POST(request: Request) { const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const body = await request.json().catch(() => ({})) as { monthKey?: string; force?: boolean; forcedReason?: string }; const monthKey = body.monthKey ?? monthKeyInShanghai(); if (!isMonthKey(monthKey)) return NextResponse.json({ error: "月份格式必须为 YYYY-MM" }, { status: 400 }); if (body.force && !body.forcedReason?.trim()) return NextResponse.json({ error: "强制重跑必须填写覆盖原因" }, { status: 400 }); try { return NextResponse.json(await collectWithRetry(monthKey, [], "manual", { force: body.force, forcedReason: body.forcedReason?.trim() })); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "采集失败" }, { status: 500 }); } }
