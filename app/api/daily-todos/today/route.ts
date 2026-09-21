import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getTodayCard, shanghaiDate } from "@/lib/daily-todos";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const requested = new URL(request.url).searchParams.get("date");
  const cardDate = /^\d{4}-\d{2}-\d{2}$/.test(requested || "") ? requested! : shanghaiDate();
  return NextResponse.json(await getTodayCard(user.id, cardDate));
}
