import { DashboardShell } from "@/components/dashboard-shell";
import { prisma } from "@/lib/prisma";
import { buildYearlySummary } from "@/lib/yearly";
import { YearlyView } from "@/components/yearly-view";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ year: string }> }) { const year = Number((await params).year); const saved = await prisma.yearlySummary.findFirst({ where: { year } }); const summary = saved ? { ...saved, topAchievements: JSON.parse(saved.topAchievements), topInspirations: JSON.parse(saved.topInspirations), keywords: JSON.parse(saved.keywords), overdue: 0, typeDistribution: {} } : await buildYearlySummary(year); const goals = await prisma.yearlyGoal.findMany({ where: { year }, orderBy: { createdAt: "asc" } }); return <DashboardShell title={`${year} 年度总结`} subtitle="把这一年的片段，收进一页纸里。"><YearlyView year={year} summary={summary as any} goals={goals}/></DashboardShell> }
