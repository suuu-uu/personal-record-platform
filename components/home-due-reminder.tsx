"use client";
import { X } from "lucide-react";import { useEffect,useState } from "react";
type Notice={id:number;title:string;message:string};
export function HomeDueReminder(){const[n,setN]=useState<Notice|null>(null);useEffect(()=>{fetch("/api/notifications").then(r=>r.json()).then((rows:Notice[])=>setN(rows.find(x=>x.title.startsWith("待办提醒"))||null))},[]);if(!n)return null;return <div className="due-reminder" role="alert"><button className="due-reminder-close" aria-label="关闭提醒" onClick={()=>setN(null)}><X size={17}/></button><strong>{n.title}</strong><p>{n.message}</p><button className="primary-button" onClick={async()=>{await fetch("/api/notifications",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:n.id})});setN(null)}}>知道了</button></div>}
