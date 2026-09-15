import { NextResponse } from "next/server";import { runTodoCleanup } from "@/lib/todo-maintenance";
export async function POST(){try{const result=await runTodoCleanup({force:true});return NextResponse.json({count:result.count,nextRunAt:result.nextRunAt})}catch{return NextResponse.json({error:"清理失败，请稍后重试"},{status:500})}}
