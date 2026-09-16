"use client";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { HomeDueReminder } from "@/components/home-due-reminder";
export function HomeLiveRefresh({ children }: { children: ReactNode }) { const router = useRouter(); useEffect(() => { const refresh = () => router.refresh(); window.addEventListener("achievement:changed", refresh); window.addEventListener("todo:changed", refresh); return () => { window.removeEventListener("achievement:changed", refresh); window.removeEventListener("todo:changed", refresh); }; }, [router]); return <><HomeDueReminder/>{children}</>; }
