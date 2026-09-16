import { PrismaClient } from "@prisma/client";
import { AsyncLocalStorage } from "node:async_hooks";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

async function cookieUserId() { try { const token=(await cookies()).get("personal_site_session")?.value; if(!token)return undefined; const secret=new TextEncoder().encode(process.env.AUTH_SECRET ?? "local-development-secret-change-before-deployment"); const {payload}=await jwtVerify(token,secret); const id=Number(payload.userId); return Number.isInteger(id)?id:undefined; } catch { return undefined; } }

const userScope = new AsyncLocalStorage<number>();
export function setUserScope(userId: number) { userScope.enterWith(userId); }

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const scopedModels = new Set(["achievement","achievementAttachment","todo","notification","footprint","inspirationItem","inspirationRun","backupRecord","operationLog","yearlySummary","yearlyGoal","shareLink"]);
const base = globalForPrisma.prisma ?? new PrismaClient();
export const prisma = base.$extends({ query: { $allModels: { async $allOperations({ model, operation, args, query }: any) { const userId=userScope.getStore() ?? await cookieUserId(); if(userId && model && scopedModels.has(model)){ const a=args as {where?:Record<string,unknown>;data?:Record<string,unknown>}; if(["findMany","findFirst","findUnique","count","aggregate","groupBy","updateMany","deleteMany"].includes(operation)) a.where={...(a.where||{}),userId}; if(["create","createMany","upsert"].includes(operation)&&a.data) a.data={...a.data,userId}; if(["update","delete"].includes(operation)) a.where={...(a.where||{}),userId}; } return query(args); } } } });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = base;
