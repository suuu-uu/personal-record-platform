import { prisma } from "@/lib/prisma";
import { logOperation } from "@/lib/operation-log";

export function shanghaiDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export async function archiveExpiredDailyCards(userId?: number) {
  const now = new Date();
  const today = shanghaiDate(now);
  const where = { status: "active", cardDate: { lt: today }, ...(userId ? { userId } : {}) };
  const cards = await prisma.dailyTodoCard.findMany({ where, select: { id: true, userId: true, title: true } });
  if (!cards.length) return 0;
  await prisma.$transaction(async (tx) => {
    await tx.dailyTodoCard.updateMany({ where: { id: { in: cards.map((card) => card.id) } }, data: { status: "archived", archivedAt: now } });
    await tx.todo.updateMany({ where: { dailyCardId: { in: cards.map((card) => card.id) } }, data: { isDailyArchived: true, dailyArchivedAt: now } });
  });
  await Promise.all(cards.map((card) => logOperation({ action: "archive", module: "daily-todos", objectType: "DailyTodoCard", objectId: card.id, detail: `自动归档：${card.title}` })));
  return cards.length;
}

export async function getTodayCard(userId: number, cardDate: string) {
  await archiveExpiredDailyCards(userId);
  return prisma.dailyTodoCard.upsert({
    where: { userId_cardDate: { userId, cardDate } },
    update: {},
    create: { userId, cardDate, title: "今日待办" },
    include: { items: { where: { isDeleted: false }, orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }] } },
  });
}
