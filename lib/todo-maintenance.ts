import { prisma } from "@/lib/prisma";

const CLEANUP_KEY = "todo-auto-cleanup";

function addTwoMonths(date: Date) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 2);
  return result;
}

export async function runTodoCleanup(options: { force?: boolean } = {}) {
  const now = new Date();
  const state = await prisma.maintenanceState.upsert({
    where: { key: CLEANUP_KEY },
    update: {},
    create: { key: CLEANUP_KEY, nextRunAt: addTwoMonths(now) },
  });
  if (!options.force && state.nextRunAt > now) return { count: 0, ran: false, nextRunAt: state.nextRunAt };
  const nextRunAt = addTwoMonths(now);
  const [result] = await prisma.$transaction([
    prisma.todo.updateMany({ where: { status: "done", isArchived: false }, data: { isArchived: true, archivedAt: now } }),
    prisma.maintenanceState.update({ where: { key: CLEANUP_KEY }, data: { lastRunAt: now, nextRunAt } }),
  ]);
  return { count: result.count, ran: true, nextRunAt };
}
