import { PrismaClient } from "@prisma/client";
import { scryptSync, randomBytes } from "node:crypto";
const prisma=new PrismaClient();
const hash=(p:string)=>{const salt=randomBytes(16).toString("hex");return `${salt}:${scryptSync(p,salt,64).toString("hex")}`};
async function main(){const username=process.env.LEGACY_USERNAME||process.env.ADMIN_USERNAME||"legacy-owner";const email=process.env.LEGACY_EMAIL||`${username}@local.invalid`;const user=await prisma.user.upsert({where:{username},update:{},create:{username,email,passwordHash:hash(process.env.LEGACY_PASSWORD||randomBytes(24).toString("hex")),role:"admin"}});for(const model of ["achievement","achievementAttachment","todo","notification","footprint","inspirationItem","inspirationRun","backupRecord","operationLog","yearlySummary","yearlyGoal"] as const)await (prisma as any)[model].updateMany({where:{userId:null},data:{userId:user.id}});console.log(`Legacy records assigned to ${user.username} (${user.id})`)}
main().finally(()=>prisma.$disconnect());
