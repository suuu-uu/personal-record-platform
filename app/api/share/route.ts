import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
async function authorized(){return await verifySession((await cookies()).get(SESSION_COOKIE)?.value);}
export async function GET(){const s=await authorized();if(!s)return NextResponse.json({error:"未授权"},{status:401});return NextResponse.json(await prisma.shareLink.findFirst({where:{isActive:true,userId:Number(s.userId)},orderBy:{createdAt:"desc"}}));}
export async function POST(){const s=await authorized();if(!s)return NextResponse.json({error:"未授权"},{status:401});const userId=Number(s.userId);await prisma.shareLink.updateMany({where:{isActive:true,userId},data:{isActive:false,revokedAt:new Date()}});return NextResponse.json(await prisma.shareLink.create({data:{token:randomBytes(32).toString("hex"),userId}}),{status:201});}
export async function DELETE(){const s=await authorized();if(!s)return NextResponse.json({error:"未授权"},{status:401});const userId=Number(s.userId);await prisma.shareLink.updateMany({where:{isActive:true,userId},data:{isActive:false,revokedAt:new Date()}});return NextResponse.json({ok:true});}
