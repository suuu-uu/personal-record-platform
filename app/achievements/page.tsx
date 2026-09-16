import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard-shell";
import { AchievementsManager } from "@/components/achievements-manager";
export const metadata:Metadata={title:"成就"};export const dynamic="force-dynamic";
export default async function Page(){const items=await prisma.achievement.findMany({where:{isDeleted:false},include:{attachments:{where:{isDeleted:false},orderBy:{sortOrder:"asc"}}},orderBy:[{isPinned:"desc"},{startDate:"desc"}]});return <DashboardShell title="成就" subtitle="项目、比赛、实习和每一次认真完成的事。"><AchievementsManager initialItems={items.map(i=>({...i,startDate:i.startDate.toISOString(),endDate:i.endDate?.toISOString()||null,createdAt:i.createdAt.toISOString(),updatedAt:i.updatedAt.toISOString(),attachments:i.attachments}))}/></DashboardShell>}
