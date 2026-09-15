import { DashboardShell } from "@/components/dashboard-shell";
import { InspirationBoard } from "@/components/inspiration-board";
export const dynamic = "force-dynamic";
export default function InspirationPage() { return <DashboardShell title="审美灵感" subtitle="每月收集潮流、设计与生活中的新鲜线索。"><InspirationBoard /></DashboardShell>; }
