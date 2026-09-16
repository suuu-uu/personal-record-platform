import { createHash } from "node:crypto";
type Entry = { count: number; resetAt: number };
const buckets = new Map<string, Entry>();
export function rateLimit(key: string, limit: number, windowMs = 60_000) { const now=Date.now(); const e=buckets.get(key); if(!e||e.resetAt<=now){buckets.set(key,{count:1,resetAt:now+windowMs});return {ok:true,retryAfter:0};} e.count++; return {ok:e.count<=limit,retryAfter:Math.ceil((e.resetAt-now)/1000)}; }
export function clientKey(request: Request) { const ip=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||request.headers.get("x-real-ip")||"unknown"; return createHash("sha256").update(ip).digest("hex"); }
