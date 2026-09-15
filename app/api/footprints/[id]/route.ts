import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logOperation } from "@/lib/operation-log";
export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const item=await prisma.footprint.update({where:{id:Number(id)},data:{isDeleted:true,deletedAt:new Date()}});await logOperation({action:"delete",module:"footprints",objectType:"Footprint",objectId:item.id,detail:item.countryNameZh??item.provinceNameZh??item.key});return NextResponse.json({ok:true});}
