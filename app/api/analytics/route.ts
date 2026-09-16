import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const achievementTypes = ["项目", "比赛", "实习", "活动", "证书", "其他"];
const inspirationCategories = ["穿搭美学", "时尚前沿", "创意灵感"];

function startOfRange(range: string) {
  const now = new Date();
  if (range === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (range === "year") return new Date(now.getFullYear(), 0, 1);
  return new Date(2000, 0, 1);
}

export async function GET(request: NextRequest) {
  const range = request.nextUrl.searchParams.get("range") ?? "all";
  const since = startOfRange(range);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const [achievements, todos, footprints, inspirations] = await Promise.all([
    prisma.achievement.findMany({ where: { isDeleted: false, startDate: { gte: since } }, select: { type: true, startDate: true } }),
    prisma.todo.findMany({ where: { isDeleted: false, createdAt: { gte: since } }, select: { status: true, isArchived: true, createdAt: true, completedAt: true, dueDate: true } }),
    prisma.footprint.findMany({ where: { isDeleted: false, visited: true }, select: { scope: true, countryCode: true, provinceCode: true } }),
    prisma.inspirationItem.findMany({ where: { isDeleted: false, collectedAt: { gte: since } }, select: { category: true, subCategory: true, collectedAt: true } }),
  ]);

  const years = new Map<number, number>();
  achievements.forEach((item) => years.set(item.startDate.getFullYear(), (years.get(item.startDate.getFullYear()) ?? 0) + 1));
  const byType = achievementTypes.map((name) => ({ name, value: achievements.filter((item) => item.type === name).length }));
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const currentOverdue = todos.filter((item) => item.dueDate && item.dueDate < todayStart && item.status !== "done" && !item.isArchived).length;
  const buckets = Array.from({ length: 5 }, (_, index) => {
    const end = new Date(thirtyDaysAgo.getTime() + (index + 1) * 7 * 86400000);
    const start = new Date(thirtyDaysAgo.getTime() + index * 7 * 86400000);
    const created = todos.filter((item) => item.createdAt >= start && item.createdAt < end).length;
    const completed = todos.filter((item) => item.completedAt && item.completedAt >= start && item.completedAt < end).length;
    const overdue = index === 4 ? currentOverdue : 0;
    return { label: `${start.getMonth() + 1}/${start.getDate()}`, created, completed, overdue };
  });
  const done = todos.filter((item) => item.status === "done").length;
  const archived = todos.filter((item) => item.isArchived).length;
  const open = Math.max(todos.length - done - archived, 0);
  const countries = new Set(footprints.filter((item) => item.scope === "country" && item.countryCode).map((item) => item.countryCode));
  const provinces = new Set(footprints.filter((item) => item.scope === "china-province" && item.provinceCode).map((item) => item.provinceCode));
  const inspirationByCategory = inspirationCategories.map((name) => ({ name, value: inspirations.filter((item) => item.category === name).length }));
  const subCategories = [...new Set(inspirations.map((item) => item.subCategory).filter(Boolean))].map((name) => ({ name, value: inspirations.filter((item) => item.subCategory === name).length }));
  const monthMap = new Map<string, number>();
  inspirations.forEach((item) => { const key = `${item.collectedAt.getFullYear()}-${String(item.collectedAt.getMonth() + 1).padStart(2, "0")}`; monthMap.set(key, (monthMap.get(key) ?? 0) + 1); });
  return NextResponse.json({ range, achievements: { years: [...years.entries()].sort(([a], [b]) => a - b).map(([year, count]) => ({ year: String(year), count })), byType }, todos: { weeks: buckets, status: [{ name: "未完成", value: open }, { name: "已完成", value: done }, { name: "已归档", value: archived }], recentRate: todos.filter((item) => item.completedAt && item.completedAt >= thirtyDaysAgo).length / Math.max(todos.filter((item) => item.createdAt >= thirtyDaysAgo).length, 1) }, footprints: { countries: countries.size, provinces: provinces.size }, inspirations: { categories: inspirationByCategory, subCategories, months: [...monthMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count })) } });
}
