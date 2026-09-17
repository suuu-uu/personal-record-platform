import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/security";

const MAX_SIZE = 20 * 1024 * 1024;
const MAX_FILES = 20;
const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/zip", "application/x-rar-compressed", "application/vnd.rar"]);
const extensions = /\.(jpe?g|png|webp|gif|heic|heif|pdf|docx?|pptx?|zip|rar)$/i;

export async function POST(request: Request) {
  try {
  const limited = rateLimit(`upload:${clientKey(request)}`, 10);
  if (!limited.ok) return NextResponse.json({ error: "上传请求过于频繁，请稍后再试" }, { status: 429, headers: { "Retry-After": String(limited.retryAfter) } });
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "未登录", code: "UNAUTHORIZED" }, { status: 401 });
  const form = await request.formData();
  const files = form.getAll("files").filter((value): value is File => typeof value === "object" && value !== null && "arrayBuffer" in value && "size" in value && "name" in value);
  if (!files.length) return NextResponse.json({ error: "请选择文件", code: "NO_FILE" }, { status: 400 });
  if (files.length > MAX_FILES) return NextResponse.json({ error: "一次最多上传 20 个文件", code: "TOO_MANY_FILES" }, { status: 400 });
  const userId = Number(session.userId);
  if (!Number.isInteger(userId)) return NextResponse.json({ error: "会话无效" }, { status: 401 });
  const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const root = path.join(process.cwd(), "storage", "uploads", String(userId));
  if (!useBlob) await mkdir(root, { recursive: true });
  const result = [];
  for (const file of files) {
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "文件超过 20MB，请压缩后再上传。", code: "FILE_TOO_LARGE" }, { status: 413 });
    if (!allowed.has(file.type) || !extensions.test(file.name)) return NextResponse.json({ error: "不支持该文件类型", code: "INVALID_FILE_TYPE" }, { status: 415 });
    const safeName = `${randomUUID()}${path.extname(file.name).toLowerCase()}`;
    const fileUrl = useBlob ? (await put(`achievements/${userId}/${safeName}`, file, { access: "public", addRandomSuffix: false })).url : (await writeFile(path.join(root, safeName), Buffer.from(await file.arrayBuffer())), `/api/uploads/${userId}/${safeName}`);
    result.push({ fileName: file.name, fileUrl, fileType: file.type, fileSize: file.size });
  }
  return NextResponse.json({ files: result });
  } catch (error) {
    console.error("Upload failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "上传失败，请稍后重试", code: "UPLOAD_FAILED" }, { status: 500 });
  }
}
