import { NextResponse } from "next/server";import { prisma } from "@/lib/prisma";
export async function GET(){return NextResponse.json(await prisma.notification.findMany({orderBy:{createdAt:"desc"},take:30}))}
export async function PATCH(request:Request){const body=await request.json();if(body.all)await prisma.notification.updateMany({where:{isRead:false},data:{isRead:true}});else if(Number.isInteger(body.id))await prisma.notification.update({where:{id:body.id},data:{isRead:true}});return NextResponse.json({ok:true})}
