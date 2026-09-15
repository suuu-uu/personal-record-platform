import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveBackup, removeBackup } from "@/lib/backup";
export async function GET(request:Request){if(request.headers.get("authorization")!==`Bearer ${process.env.CRON_SECRET}`)return NextResponse.json({error:"未授权"},{status:401});const result=await saveBackup("auto","all");if(result.status==="success"){const old=await prisma.backupRecord.findMany({where:{type:"auto",status:"success"},orderBy:{createdAt:"desc"},skip:7});for(const item of old){await removeBackup(item.fileName);await prisma.backupRecord.delete({where:{id:item.id}})}}return NextResponse.json(result)}
