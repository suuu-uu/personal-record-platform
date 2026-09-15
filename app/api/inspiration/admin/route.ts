import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
async function auth(){ return verifySession((await cookies()).get(SESSION_COOKIE)?.value); }
export async function GET(request: Request){ if(!(await auth())) return NextResponse.json({error:"Unauthorized"},{status:401}); const p=new URL(request.url).searchParams; const where={...(p.get("month")?{monthKey:p.get("month")!}:{}),...(p.get("category")?{category:p.get("category")!}:{}),...(p.get("subCategory")?{subCategory:p.get("subCategory")!}:{})}; const [items,runs]=await Promise.all([prisma.inspirationItem.findMany({where,orderBy:{createdAt:"desc"}}),prisma.inspirationRun.findMany({orderBy:{startedAt:"desc"},take:20})]); return NextResponse.json({items,runs}); }
