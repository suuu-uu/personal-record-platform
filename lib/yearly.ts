import { prisma } from "@/lib/prisma";

export async function buildYearlySummary(year: number, isAuto = false) {
  const start = new Date(`${year}-01-01T00:00:00+08:00`);
  const end = new Date(`${year + 1}-01-01T00:00:00+08:00`);
  const [achievements, todos, footprints, inspirations] = await Promise.all([
    prisma.achievement.findMany({ where: { startDate: { gte: start, lt: end }, isDeleted: false }, orderBy: { startDate: "desc" } }),
    prisma.todo.findMany({ where: { OR: [{ createdAt: { gte: start, lt: end } }, { completedAt: { gte: start, lt: end } }], isDeleted: false } }),
    prisma.footprint.findMany({ where: { visitedAt: { gte: start, lt: end }, isDeleted: false } }),
    prisma.inspirationItem.findMany({ where: { collectedAt: { gte: start, lt: end }, isDeleted: false }, orderBy: { collectedAt: "desc" } }),
  ]);
  const completed = todos.filter((todo) => todo.status === "done" || todo.completedAt);
  const overdue = completed.filter((todo) => todo.dueDate && todo.completedAt && todo.completedAt > todo.dueDate).length;
  const types = achievements.reduce<Record<string, number>>((a, x) => { a[x.type] = (a[x.type] || 0) + 1; return a; }, {});
  const keywords = Object.entries(types).sort((a,b) => b[1]-a[1]).map(([name,count]) => ({ name, count }));
  const data = { achievementsCount: achievements.length, todosCompleted: completed.length, todosTotal: todos.length, footprintsNew: footprints.length, inspirationsCount: inspirations.length, topAchievements: achievements.slice(0, 4), topInspirations: inspirations.slice(0, 4), keywords, summaryText: `${year} 年记录了 ${achievements.length} 项成就，完成 ${completed.length} 件待办，新增 ${footprints.length} 个足迹和 ${inspirations.length} 条灵感。`, overdue, typeDistribution: types };
  const stored = { achievementsCount: data.achievementsCount, todosCompleted: data.todosCompleted, todosTotal: data.todosTotal, footprintsNew: data.footprintsNew, inspirationsCount: data.inspirationsCount, topAchievements: JSON.stringify(data.topAchievements), topInspirations: JSON.stringify(data.topInspirations), keywords: JSON.stringify(keywords), summaryText: data.summaryText };
  const existing = await prisma.yearlySummary.findFirst({ where: { year } });
  const summary = existing
    ? await prisma.yearlySummary.update({ where: { id: existing.id }, data: { ...stored, generatedAt: new Date(), isAuto } })
    : await prisma.yearlySummary.create({ data: { year, ...stored, isAuto } });
  return { ...summary, ...data };
}
