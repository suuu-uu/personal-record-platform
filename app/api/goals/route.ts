import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(request: Request) { const year = Number(new URL(request.url).searchParams.get("year")) || new Date().getFullYear(); return NextResponse.json(await prisma.yearlyGoal.findMany({ where: { year }, orderBy: { createdAt: "asc" } })); }
export async function POST(request: Request) { const b = await request.json(); const item = await prisma.yearlyGoal.create({ data: { year: Number(b.year), title: b.title, targetValue: Number(b.targetValue), currentValue: Number(b.currentValue || 0), unit: b.unit || "", category: b.category || "其他", isCompleted: Number(b.currentValue || 0) >= Number(b.targetValue) } }); return NextResponse.json(item, { status: 201 }); }
