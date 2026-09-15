import { NextResponse } from "next/server";
import { buildYearlySummary } from "@/lib/yearly";
export async function GET(request: Request) { if (process.env.CRON_SECRET && request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const year = new Date().getFullYear() - 1; return NextResponse.json(await buildYearlySummary(year, true)); }
