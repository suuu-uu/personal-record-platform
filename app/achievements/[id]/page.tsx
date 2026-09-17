import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Pin } from "lucide-react";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { AchievementDetailActions } from "@/components/achievement-detail-actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
function show(date: Date) { return date.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" }); }
function tags(value: string) { try { return JSON.parse(value) as string[]; } catch { return []; } }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.achievement.findUnique({ where: { id: Number(id) }, include: { attachments: { where: { isDeleted: false }, orderBy: { sortOrder: "asc" } } } });
  if (!item) notFound();
  const record = { ...item, startDate: item.startDate.toISOString(), endDate: item.endDate?.toISOString() || null, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() };
  const cover = item.coverImageUrl || item.imageUrl;
  return <DashboardShell title={item.title} subtitle={`${item.type} · ${show(item.startDate)} - ${item.endDate ? show(item.endDate) : "至今"}`} action={<AchievementDetailActions item={record} />}>
    <Link href="/achievements" className="back-link"><ArrowLeft size={17} />返回成就列表</Link>
    <article className="page-card achievement-detail-page">
      {cover && <Image className="detail-image" src={cover} alt={`${item.title}相关图片`} width={1000} height={480} unoptimized />}
      <div className="detail-flags"><span className="badge">{item.type}</span>{item.isPinned && <span><Pin size={14} />置顶</span>}<span>{item.isPublic ? "公开" : "仅自己可见"}</span></div>
      <div className="achievement-detail"><div><span>名称</span><strong>{item.title}</strong></div><div><span>时间段</span><strong>{show(item.startDate)} - {item.endDate ? show(item.endDate) : "至今"}</strong></div><div><span>角色</span><strong>{item.role || "未填写"}</strong></div><div><span>组织 / 主办方</span><strong>{item.organization || "未填写"}</strong></div><div className="full"><span>内容描述</span><p>{item.description || "暂无内容描述"}</p></div><div className="full"><span>奖项具体内容</span><p>{item.awardDetails || "暂无奖项内容"}</p></div>{tags(item.tags).length > 0 && <div className="full"><span>标签</span><div className="tag-row">{tags(item.tags).map(tag => <b key={tag}>#{tag}</b>)}</div></div>}{item.link && <a href={item.link} target="_blank" rel="noreferrer">查看相关链接 <ExternalLink size={15} /></a>}</div>
      {item.attachments.length > 0 && <div className="achievement-attachments"><h3>相关文件</h3>{item.attachments.map(attachment => <a key={attachment.id} href={attachment.fileUrl} target="_blank" rel="noreferrer">{attachment.fileName}</a>)}</div>}
    </article>
  </DashboardShell>;
}
