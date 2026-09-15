import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const achievement = await prisma.achievement.upsert({
    where: { id: 1 },
    update: { isPublic: true },
    create: {
      title: "个人网站平台上线",
      type: "项目",
      role: "全栈开发",
      organization: "个人项目",
      startDate: new Date("2026-09-01"),
      description: "完成个人成就、待办与足迹的统一记录。",
      tags: JSON.stringify(["Next.js", "TypeScript"]),
      isPinned: true,
      isPublic: true,
    },
  });

  await prisma.todo.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: "补充本月经历",
      description: "整理最近完成的项目与比赛记录。",
      dueDate: new Date("2026-09-20"),
      priority: "high",
      status: "doing",
      tags: JSON.stringify(["整理"]),
      relatedAchievementId: achievement.id,
    },
  });

  await prisma.footprint.upsert({
    where: { key: "country-CN" },
    update: {},
    create: {
      key: "country-CN",
      scope: "country",
      countryCode: "156",
      countryNameZh: "中国",
      countryNameEn: "China",
      visitedAt: new Date("2026-01-01"),
      note: "生活与出发的地方。",
    },
  });

  await prisma.achievement.upsert({ where: { id: 2 }, update: {}, create: { title: "城市数据可视化比赛", type: "比赛", role: "队员", organization: "校级赛事", startDate: new Date("2025-11-12"), endDate: new Date("2025-12-20"), description: "完成数据清洗、交互图表和展示页面。", tags: JSON.stringify(["数据可视化"]) } });
  await prisma.todo.upsert({ where: { id: 2 }, update: {}, create: { title: "整理作品集截图", description: "为公开成就补充图片和链接。", dueDate: new Date("2026-10-01"), priority: "medium", status: "todo", tags: JSON.stringify(["作品集"]) } });
  await prisma.footprint.upsert({ where: { key: "country-392" }, update: {}, create: { key: "country-392", scope: "country", countryCode: "392", countryNameZh: "日本", countryNameEn: "Japan", visitedAt: new Date("2025-08-15") } });
}

main().finally(() => prisma.$disconnect());
