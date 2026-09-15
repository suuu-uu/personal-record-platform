"use client";
import { Pencil } from "lucide-react";import { AchievementDeleteButton } from "@/components/achievement-delete-button";import { AchievementDialog,type AchievementRecord } from "@/components/achievement-dialog";
export function AchievementDetailActions({item}:{item:AchievementRecord}){return <div className="detail-actions"><AchievementDialog initial={item} trigger={<button className="primary-button"><Pencil size={16}/>编辑</button>}/><AchievementDeleteButton id={item.id} title={item.title} afterDelete="list"/></div>}
