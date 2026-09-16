import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logOperation } from "@/lib/operation-log";
import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){const session=await verifySession((await cookies()).get(SESSION_COOKIE)?.value);if(!session)return NextResponse.json({error:"未授权"},{status:401});const b=await request.json().catch(()=>({}));if(typeof b.isPublic!=="boolean")return NextResponse.json({error:"参数错误"},{status:400});return NextResponse.json(await prisma.footprint.update({where:{id:Number((await params).id)},data:{isPublic:b.isPublic}}));}
export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const item=await prisma.footprint.update({where:{id:Number(id)},data:{isDeleted:true,deletedAt:new Date()}});await logOperation({action:"delete",module:"footprints",objectType:"Footprint",objectId:item.id,detail:item.countryNameZh??item.provinceNameZh??item.key});return NextResponse.json({ok:true});}
