import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
async function authorized(){return Boolean(await verifySession((await cookies()).get(SESSION_COOKIE)?.value));}
export async function GET(){if(!(await authorized()))return NextResponse.json({error:"未授权"},{status:401});return NextResponse.json(await prisma.shareLink.findFirst({where:{isActive:true},orderBy:{createdAt:"desc"}}));}
export async function POST(){if(!(await authorized()))return NextResponse.json({error:"未授权"},{status:401});await prisma.shareLink.updateMany({where:{isActive:true},data:{isActive:false,revokedAt:new Date()}});return NextResponse.json(await prisma.shareLink.create({data:{token:randomBytes(32).toString("hex")}}),{status:201});}
export async function DELETE(){if(!(await authorized()))return NextResponse.json({error:"未授权"},{status:401});await prisma.shareLink.updateMany({where:{isActive:true},data:{isActive:false,revokedAt:new Date()}});return NextResponse.json({ok:true});}
