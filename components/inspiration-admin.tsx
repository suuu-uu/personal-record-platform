"use client";
import { useCallback, useEffect, useState } from "react";
import styles from "./inspiration-admin.module.css";
type Item = { id: number; monthKey: string; title: string; reviewStatus: string; sourceDomain: string };
type Run = { id: number; monthKey: string; status: string; missingCount: number; errorMessage: string | null };
const labels: Record<string, string> = { approved: "自动通过", pending: "待处理", rejected: "未通过", running: "采集中", partial: "部分完成", success: "完成", failed: "失败" };
export function InspirationAdmin({month,count,failed}:{month:string;count:number;failed?:string|null}) {
  const [items,setItems] = useState<Item[]>([]);
  const [runs,setRuns] = useState<Run[]>([]);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const load = useCallback(async () => {
    const response = await fetch("/api/inspiration/admin");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "读取灵感失败");
    setItems(data.items || []); setRuns(data.runs || []);
  }, []);
  useEffect(() => { load().catch(error => setMessage(error.message)); }, [load]);
  async function refresh(force = false) {
    const reason = force ? prompt("请输入强制重跑原因：") : null;
    if (force && !reason?.trim()) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/inspiration/refresh", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({monthKey:month,force,forcedReason:reason}) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "采集失败");
      setMessage(data.skipped ? "本月已完成采集。" : "本月采集已更新。"); await load();
    } catch(error) { setMessage(error instanceof Error ? error.message : "采集失败"); }
    finally { setBusy(false); }
  }
  async function remove(item: Item) {
    if (!confirm("确认删除这条灵感？")) return;
    try {
      const response = await fetch(`/api/inspiration/admin/${item.id}`, {method:"DELETE"});
      if (!response.ok) throw new Error("删除失败"); await load();
    } catch(error) { setMessage(error instanceof Error ? error.message : "删除失败"); }
  }
  const months = [...new Set([month,...items.map(item=>item.monthKey),...runs.map(run=>run.monthKey)])].sort().reverse();
  return <div className={styles.panel}>
    <div className={styles.toolbar}><span>按月查看灵感</span><button className="primary-button" onClick={()=>refresh()} disabled={busy}>{busy?"采集中…":"刷新本月"}</button><button className="ghost-button" onClick={()=>refresh(true)} disabled={busy}>强制重跑</button></div>
    {message && <p role="status">{message}</p>}
    {failed && <p className="admin-warning">上次任务失败：{failed}</p>}
    {months.map(key=>{
      const rows=items.filter(item=>item.monthKey===key);
      const run=runs.find(run=>run.monthKey===key);
      return <details className={styles.month} key={key}>
        <summary><strong>{key}</strong><span>{rows.length} 条</span>{run && <span>{labels[run.status] || run.status}{run.missingCount ? `，缺少 ${run.missingCount} 条` : ""}</span>}</summary>
        <div className={styles.content}>
          {run?.errorMessage && <p className="admin-warning">{run.errorMessage}</p>}
          {rows.length ? <ul className={styles.list}>{rows.map(item=><li key={item.id}><span className={styles.title} title={item.title}>{item.title}</span><small>{labels[item.reviewStatus] || item.reviewStatus} · {item.sourceDomain}</small><button className="danger-button" onClick={()=>remove(item)}>删除</button></li>)}</ul> : <p className="cell-note">该月暂无灵感条目。</p>}
        </div>
      </details>;
    })}
  </div>;
}
