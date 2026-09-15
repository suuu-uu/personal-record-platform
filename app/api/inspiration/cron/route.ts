import { NextResponse } from "next/server";
import { collectWithRetry } from "@/lib/inspiration/collect";
import { isShanghaiMonthEndMidnight, monthKeyInShanghai } from "@/lib/inspiration/schedule";
export async function GET(request: Request) {
  console.info("Inspiration cron invoked", { source: request.headers.get("user-agent") ?? "unknown", at: new Date().toISOString() });
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const now = new Date();
  if (!isShanghaiMonthEndMidnight(now)) return NextResponse.json({ skipped: true, reason: "not-last-day-midnight", monthKey: monthKeyInShanghai(now) });
  try { return NextResponse.json(await collectWithRetry(monthKeyInShanghai(now), [], "cron")); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "采集失败" }, { status: 500 }); }
}
