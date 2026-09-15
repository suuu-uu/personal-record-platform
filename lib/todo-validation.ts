import { z } from "zod";

export const todoSchema = z.object({
  title: z.string().trim().min(1, "请输入待办标题").max(120, "标题不能超过 120 个字"),
  description: z.string().max(2000, "描述不能超过 2000 个字").default(""),
  dueDate: z.string().default(""),
  remindAt: z.string().default(""),
  reminderType: z.enum(["none", "inApp", "browser", "email"]).default("none"),
  repeatRule: z.enum(["none", "daily", "weekly", "monthly", "custom"]).default("none"),
  repeatInterval: z.coerce.number().int().positive().optional().nullable(),
  repeatEndDate: z.string().default(""),
  repeatCount: z.coerce.number().int().positive().optional().nullable(),
  priority: z.enum(["low", "medium", "high"]),
  tags: z.array(z.string().trim().min(1)).max(20, "标签不能超过 20 个"),
  isPublic: z.boolean().default(false),
});

export function todoData(value: z.infer<typeof todoSchema>) {
  return { title:value.title, description:value.description||null, dueDate:value.dueDate?new Date(`${value.dueDate}T00:00:00`):null, remindAt:value.remindAt?new Date(value.remindAt):null, reminderType:value.reminderType, repeatRule:value.repeatRule, repeatInterval:value.repeatInterval||null, repeatEndDate:value.repeatEndDate?new Date(`${value.repeatEndDate}T00:00:00`):null, repeatCount:value.repeatCount||null, priority:value.priority, tags:JSON.stringify(value.tags), isPublic:value.isPublic };
}
