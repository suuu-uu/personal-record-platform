import { NextResponse } from "next/server";
import { captureError } from "@/lib/error-monitor";
export async function POST(request: Request) { const body = await request.json().catch(() => ({})); await captureError(body.message ?? "Client error", { path: body.path, loggedIn: body.loggedIn }); return NextResponse.json({ ok: true }); }
