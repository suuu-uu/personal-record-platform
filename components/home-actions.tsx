"use client";
import { Award, MapPin, Plus } from "lucide-react";
import { Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle,DialogTrigger } from "@/components/ui/dialog";
import { AchievementDialog } from "@/components/achievement-dialog";
function PlaceholderDialog({kind,children}:{kind:"achievement"|"footprint";children:React.ReactNode}){const achievement=kind==="achievement";return <Dialog><DialogTrigger asChild>{children}</DialogTrigger><DialogContent><DialogHeader><DialogTitle>{achievement?"添加成就":"选择足迹"}</DialogTitle><DialogDescription>{achievement?"完整的成就记录表单将在第 3 段接入。你现在可以前往成就页添加记录。":"足迹选择器将在第 5 段接入。你现在可以前往足迹页添加地点。"}</DialogDescription></DialogHeader><a className="primary-button" href={achievement?"/achievements":"/footprints"}>{achievement?<Award size={17}/>:<MapPin size={17}/>}前往{achievement?"成就":"足迹"}页</a></DialogContent></Dialog>}
export function HomeActions(){return <div className="home-actions"><AchievementDialog trigger={<button className="primary-button"><Plus size={17}/>添加成就</button>}/><PlaceholderDialog kind="footprint"><button className="ghost-button"><MapPin size={17}/>选择足迹</button></PlaceholderDialog></div>}
