import { prisma } from "@/lib/prisma";
import { INSPIRATION_TIMEZONE, monthKeyInShanghai, scheduledForUtc } from "./schedule";

export const CATEGORIES = {
  outfit: { label: "穿搭美学", tags: { color: "配色趋势", style: "风格趋势", element: "元素与版型" } },
  fashion: { label: "时尚前沿", tags: { runway: "时装秀与秀场趋势", accessory: "配饰与配件", brand: "品牌与单品动态" } },
  creative: { label: "创意灵感", tags: { graphic: "平面设计", remake: "服饰 Remake", object: "物品创意用法" } },
} as const;

export type InspirationLink = { title: string; url: string };
export type InspirationInput = { monthKey: string; category: string; subCategory: string; title: string; summary: string; details: string; typicalExamples: string[]; sourceLinks: InspirationLink[]; tags: string[]; heatScore?: number };

// 外部采集器的安全边界：未配置内容源时只运行检查，不用猜测补数据。
function safeLinks(links: InspirationLink[]) {
  return links.filter(link => { try { const url = new URL(link.url); return ["http:", "https:"].includes(url.protocol); } catch { return false; } });
}

export async function collectInspiration(monthKey = monthKeyInShanghai(), input: InspirationInput[] = [], triggerType = "manual", options: { force?: boolean; forcedReason?: string } = {}) {
  const existing = await prisma.inspirationRun.findUnique({ where: { monthKey } });
  if (existing?.status === "success" && !options.force) return { monthKey, skipped: true, reason: "already-successful" };
  const started = existing
    ? await prisma.inspirationRun.update({ where: { monthKey }, data: { status: "running", triggerType, isForced: Boolean(options.force), forcedReason: options.force ? options.forcedReason : null, attemptCount: { increment: 1 }, startedAt: new Date(), finishedAt: null, errorMessage: null } })
    : await prisma.inspirationRun.create({ data: { monthKey, status: "running", triggerType, scheduledFor: scheduledForUtc(monthKey), timezone: INSPIRATION_TIMEZONE, isForced: Boolean(options.force), forcedReason: options.force ? options.forcedReason : null, attemptCount: 1 } });
  try {
    const unique = new Map(input.map(item => [`${item.category}:${item.title.trim().toLowerCase()}`, item]));
    for (const item of unique.values()) {
      const links = safeLinks(item.sourceLinks);
      if (!links.length) continue;
      const sourceDomain = new URL(links[0].url).hostname;
      await prisma.inspirationItem.upsert({ where: { monthKey_category_title: { monthKey, category: item.category, title: item.title } }, update: { ...item, sourceDomain, sourceLinks: JSON.stringify(links), typicalExamples: JSON.stringify(item.typicalExamples), tags: JSON.stringify(item.tags), reviewStatus: "pending", collectedAt: new Date() }, create: { ...item, monthKey, sourceDomain, sourceLinks: JSON.stringify(links), typicalExamples: JSON.stringify(item.typicalExamples), tags: JSON.stringify(item.tags), reviewStatus: "pending", collectedAt: new Date() } });
    }
    const count = await prisma.inspirationItem.count({ where: { monthKey } });
    const pendingCount = await prisma.inspirationItem.count({ where: { monthKey, reviewStatus: "pending" } });
    const missingCount = Object.values(CATEGORIES).reduce((n, category) => n + Object.keys(category.tags).reduce((m, subCategory) => m + Math.max(0, 5 - input.filter(item => item.subCategory === subCategory).length), 0), 0);
    await prisma.inspirationRun.update({ where: { id: started.id }, data: { status: missingCount ? "partial" : "success", itemCount: count, collectedCount: count, pendingCount, missingCount, finishedAt: new Date(), executedAt: new Date() } });
    return { monthKey, count, pendingCount, missingCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    await prisma.inspirationRun.update({ where: { id: started.id }, data: { status: "failed", errorMessage: message, finishedAt: new Date() } });
    throw error;
  }
}

export async function collectWithRetry(monthKey = monthKeyInShanghai(), input: InspirationInput[] = [], triggerType = "manual", options: { force?: boolean; forcedReason?: string } = {}) {
  let last: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { return await collectInspiration(monthKey, input, triggerType, options); }
    catch (error) { last = error; if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 1000)); }
  }
  throw last;
}
