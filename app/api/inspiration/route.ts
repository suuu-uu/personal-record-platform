import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
export async function GET(request: Request) {
  const month = new URL(request.url).searchParams.get("month") ?? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit" }).format(new Date());
  const items = await prisma.inspirationItem.findMany({ where: { monthKey: month, reviewStatus: "approved", isDeleted: false }, orderBy: [{ heatScore: "desc" }, { createdAt: "asc" }] });
  const run = await prisma.inspirationRun.findFirst({ where: { monthKey: month }, orderBy: { startedAt: "desc" } });
  return NextResponse.json({ items: items.map(item => ({ ...item, typicalExamples: JSON.parse(item.typicalExamples), sourceLinks: JSON.parse(item.sourceLinks), tags: JSON.parse(item.tags) })), run });
}

export async function DELETE(request: Request) {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  await prisma.inspirationItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
