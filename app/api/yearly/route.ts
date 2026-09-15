import { NextResponse } from "next/server";
import { buildYearlySummary } from "@/lib/yearly";
export async function POST(request: Request) { const { year } = await request.json(); if (!Number.isInteger(year)) return NextResponse.json({ error: "年份无效" }, { status: 400 }); return NextResponse.json(await buildYearlySummary(year)); }
