import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

const take = 5;
const contains = (q: string) => ({ contains: q });
const text = (value: string | null | undefined, q: string) => { const s = (value ?? "").replace(/\s+/g, " ").trim(); const i = s.toLocaleLowerCase().indexOf(q.toLocaleLowerCase()); return i > 35 ? `…${s.slice(i - 35, i + 75)}${s.length > i + 75 ? "…" : ""}` : s.slice(0, 110); };
const order = (title: string, q: string) => { const a = title.toLocaleLowerCase(), b = q.toLocaleLowerCase(); return a === b ? 0 : a.includes(b) ? 1 : 2; };
const parseTags = (s: string) => { try { return JSON.parse(s) as string[]; } catch { return []; } };

export async function GET(request: Request) {
  const token = request.headers.get("cookie")?.split(";").map((x) => x.trim()).find((x) => x.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
  if (!(await verifySession(token))) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ achievements: [], todos: [], footprints: [], inspirations: [] });
  const c = contains(q);
  const [achievements, todos, footprints, inspirations] = await Promise.all([
    prisma.achievement.findMany({ where: { isDeleted: false, OR: [{ title: c }, { description: c }, { awardDetails: c }, { organization: c }, { role: c }, { tags: c }, { type: c }] }, select: { id: true, title: true, type: true, description: true, awardDetails: true, organization: true }, take: 5 }),
    prisma.todo.findMany({ where: { isDeleted: false, OR: [{ title: c }, { description: c }, { tags: c }] }, select: { id: true, title: true, status: true, priority: true, isArchived: true, description: true }, take: 5 }),
    prisma.footprint.findMany({ where: { isDeleted: false, OR: [{ countryNameZh: c }, { countryNameEn: c }, { provinceNameZh: c }, { provinceNameEn: c }] }, select: { id: true, key: true, countryNameZh: true, countryNameEn: true, provinceNameZh: true, provinceNameEn: true, visited: true, note: true }, take: 5 }),
    prisma.inspirationItem.findMany({ where: { isDeleted: false, OR: [{ title: c }, { summary: c }, { details: c }, { tags: c }, { category: c }, { subCategory: c }] }, select: { id: true, title: true, category: true, subCategory: true, summary: true, details: true }, take: 5 }),
  ]);
  return NextResponse.json({
    achievements: achievements.sort((a, b) => order(a.title, q) - order(b.title, q)).slice(0, take).map((x) => ({ id: x.id, title: x.title, type: x.type, snippet: text(x.description || x.awardDetails || x.organization, q), url: `/achievements?focus=${x.id}` })),
    todos: todos.sort((a, b) => order(a.title, q) - order(b.title, q)).slice(0, take).map((x) => ({ id: x.id, title: x.title, status: x.status, priority: x.priority, isArchived: x.isArchived, snippet: text(x.description, q), url: `/todos?focus=${x.id}` })),
    footprints: footprints.slice(0, take).map((x) => ({ id: x.id, title: x.provinceNameZh || x.countryNameZh || x.provinceNameEn || x.countryNameEn || x.key, subtitle: [x.countryNameEn, x.provinceNameEn].filter(Boolean).join(" · "), visited: x.visited, snippet: x.note || "足迹记录", url: "/footprints" })),
    inspirations: inspirations.sort((a, b) => order(a.title, q) - order(b.title, q)).slice(0, take).map((x) => ({ id: x.id, title: x.title, category: x.category, subCategory: x.subCategory, snippet: text(x.summary || x.details, q), url: `/inspiration?focus=${x.id}` })),
  });
}
