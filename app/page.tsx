import Link from "next/link";
import { Award, CalendarClock, CheckCircle2, Clock3, MapPinned, Pin, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard-shell";
import { PixelWelcome } from "@/components/pixel-welcome";
import { HomeActions } from "@/components/home-actions";
import { LazyFootprintsPicker } from "@/components/lazy-footprints-picker";
import { runTodoCleanup } from "@/lib/todo-maintenance";

export const dynamic = "force-dynamic";
const priorityWeight:Record<string,number>={high:0,medium:1,low:2};
function dateLabel(date:Date){return date.toLocaleDateString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit"})}

export default async function Home(){
  await runTodoCleanup();
  const now=new Date();const dueLimit=new Date(now);dueLimit.setDate(dueLimit.getDate()+7);
  const [achievementCount,todoCount,dueSoonCount,countryRows,inspirationCount,footprintItems,recentAchievements,openTodos,timeline,doneTodoCount,totalTodoCount]=await Promise.all([
    prisma.achievement.count(),
    prisma.todo.count({where:{isArchived:false,status:{not:"done"}}}),
    prisma.todo.count({where:{isArchived:false,status:{not:"done"},dueDate:{gte:now,lte:dueLimit}}}),
    prisma.footprint.findMany({where:{visited:true,scope:"country",countryCode:{not:null}},select:{countryCode:true},distinct:["countryCode"]}),
    prisma.inspirationItem.count({where:{isDeleted:false}}),
    prisma.footprint.findMany({where:{visited:true},select:{id:true,scope:true,countryCode:true,countryNameZh:true,countryNameEn:true,provinceCode:true,provinceNameZh:true,provinceNameEn:true,visited:true}}),
    prisma.achievement.findMany({orderBy:[{isPinned:"desc"},{startDate:"desc"}],take:4}),
    prisma.todo.findMany({where:{isArchived:false,status:{not:"done"}},take:30}),
    prisma.achievement.findMany({where:{isPublic:true},orderBy:{startDate:"desc"}}),
    prisma.todo.count({where:{isArchived:false,status:"done"}}),
    prisma.todo.count({where:{isArchived:false}}),
  ]);
  const recentTodos=openTodos.sort((a,b)=>{const da=a.dueDate?.getTime()??Number.MAX_SAFE_INTEGER;const db=b.dueDate?.getTime()??Number.MAX_SAFE_INTEGER;return da-db||(priorityWeight[a.priority]??9)-(priorityWeight[b.priority]??9)}).slice(0,4);
  return <DashboardShell><PixelWelcome/><section className="home-layout"><div className="home-content">
    <section className="profile-intro"><div><p className="eyebrow">ABOUT THIS SPACE</p><h1>你好，这里是我的个人档案。</h1><p>我在这里记录完成的项目、正在推进的计划，以及亲自去过的地方。每一条记录都保留时间，也保留当时为什么出发。</p></div><HomeActions/></section>
    <section className="home-stats" aria-label="个人统计"><article><Award/><span>成就数量</span><strong>{achievementCount}</strong></article><article><Clock3/><span>待办完成率</span><strong>{Math.round(doneTodoCount / Math.max(totalTodoCount,1) * 100)}%</strong></article><article><MapPinned/><span>去过国家数</span><strong>{countryRows.length}</strong></article><article><CalendarClock/><span>灵感条目</span><strong>{inspirationCount}</strong></article></section>
    <div className="home-lists"><section className="paper-card compact-card"><div className="section-heading"><div><span>ACHIEVEMENTS</span><h2>最近成就</h2></div><Link href="/achievements">查看全部</Link></div>{recentAchievements.length?<div className="record-list">{recentAchievements.map(item=><Link href={`/achievements/${item.id}`} className="record-row" key={item.id}><div className="record-mark">{item.isPinned?<Pin size={15}/>:<Trophy size={15}/>}</div><div><h3>{item.title}</h3><p>{item.type} · {item.organization||"未填写机构"}</p></div><time>{dateLabel(item.startDate)}</time></Link>)}</div>:<div className="empty-state">还没有成就记录。</div>}</section>
      <section className="paper-card compact-card"><div className="section-heading"><div><span>OPEN TASKS</span><h2>最近待办</h2></div><Link href="/todos">查看全部</Link></div>{recentTodos.length?<div className="record-list">{recentTodos.map(item=><Link href="/todos" className="record-row" key={item.id}><div className="record-mark"><CheckCircle2 size={15}/></div><div><h3>{item.title}</h3><p>{item.status==="doing"?"进行中":"待开始"} · {item.priority==="high"?"高优先级":item.priority==="medium"?"中优先级":"低优先级"}</p></div><time>{item.dueDate?dateLabel(item.dueDate):"未设日期"}</time></Link>)}</div>:<div className="empty-state">目前没有未完成待办。</div>}</section></div>
    <section className="footprint-preview"><div className="section-heading"><div><span>FOOTPRINTS</span><h2>足迹缩略图</h2></div><Link href="/footprints">打开足迹</Link></div><LazyFootprintsPicker initialItems={footprintItems} preview/></section>
  </div><aside className="timeline-panel"><div className="timeline-heading"><p className="eyebrow">PUBLIC TIMELINE</p><h2>成就时间轴</h2><span>{timeline.length} 条公开记录</span></div>{timeline.length?<div className="timeline-scroll">{timeline.map(item=><Link href={`/achievements/${item.id}`} className="timeline-item" key={item.id}><span className="timeline-dot"/><div><span className="badge">{item.type}</span><h3>{item.title}</h3><p>{dateLabel(item.startDate)} - {item.endDate?dateLabel(item.endDate):"至今"}</p></div></Link>)}</div>:<div className="timeline-empty"><Award/><p>暂无公开成就。将成就设为公开后会显示在这里。</p></div>}</aside></section></DashboardShell>;
}
