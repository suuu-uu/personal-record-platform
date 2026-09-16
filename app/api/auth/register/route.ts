import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { scryptSync, randomBytes } from "node:crypto";
import { createSession, SESSION_COOKIE } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/security";
const schema=z.object({username:z.string().trim().min(2).max(32).regex(/^[\w-]+$/),email:z.string().trim().toLowerCase().email(),password:z.string().min(8).regex(/[A-Za-z]/).regex(/[0-9]/),confirmPassword:z.string()}).refine(v=>v.password===v.confirmPassword,{path:["confirmPassword"],message:"两次密码不一致"});
function hash(password:string){const salt=randomBytes(16).toString("hex");return `${salt}:${scryptSync(password,salt,64).toString("hex")}`;}
export async function POST(request:Request){const limited=rateLimit(`register:${clientKey(request)}`,5);if(!limited.ok)return NextResponse.json({error:"请求过于频繁，请稍后再试"},{status:429,headers:{"Retry-After":String(limited.retryAfter)}});const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message||"注册信息不正确"},{status:400});const {username,email,password}=parsed.data;const exists=await prisma.user.findFirst({where:{OR:[{username},{email}]}});if(exists)return NextResponse.json({error:"用户名或邮箱已被使用"},{status:409});const user=await prisma.user.create({data:{username,email,passwordHash:hash(password)}});const response=NextResponse.json({ok:true});response.cookies.set(SESSION_COOKIE,await createSession(user.id,user.username),{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:604800,path:"/"});return response;}
