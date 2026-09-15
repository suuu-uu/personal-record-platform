import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard-shell";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
export const metadata: Metadata = { title: "数据面板" };
export const dynamic = "force-dynamic";
export default function AnalyticsPage() { return <DashboardShell title="数据面板" subtitle="看看时间如何流动，也看看自己已经走了多远。"><AnalyticsDashboard /></DashboardShell>; }
