import { NextResponse } from "next/server";
import { archiveExpiredDailyCards } from "@/lib/daily-todos";
import { logOperation } from "@/lib/operation-log";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "未授权" }, { status: 401 });
  try { const count = await archiveExpiredDailyCards(); await logOperation({ action: "run", module: "daily-todos-cron", objectType: "DailyTodoCard", result: "success", detail: `归档 ${count} 张卡片` }); return NextResponse.json({ ok: true, count }); } catch (error) { await logOperation({ action: "run", module: "daily-todos-cron", objectType: "DailyTodoCard", result: "failed", errorMessage: error instanceof Error ? error.message : "归档失败" }); return NextResponse.json({ error: "归档失败" }, { status: 500 }); }
}
