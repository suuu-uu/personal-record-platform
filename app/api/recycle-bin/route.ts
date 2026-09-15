import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logOperation } from "@/lib/operation-log";
const models:any={achievements:"achievement",todos:"todo",footprints:"footprint",inspirations:"inspirationItem"};
export async function GET(){const out:any={};for(const [module,model] of Object.entries(models) as [string,string][])out[module]=await (prisma as any)[model].findMany({where:{isDeleted:true},orderBy:{deletedAt:"desc"}});return NextResponse.json(out)}
export async function POST(request:Request){const b=await request.json();const model=models[b.module];if(!model)return NextResponse.json({error:"模块无效"},{status:400});const ids=(b.ids??[b.id]).map(Number);for(const id of ids){if(b.action==="restore"){await (prisma as any)[model].update({where:{id},data:{isDeleted:false,deletedAt:null,deletedBy:null}});await logOperation({action:"restore",module:b.module,objectType:model,objectId:id})}else if(b.action==="purge"){await (prisma as any)[model].delete({where:{id}});await logOperation({action:"purge",module:b.module,objectType:model,objectId:id})}}return NextResponse.json({ok:true})}
