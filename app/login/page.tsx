import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "登录" };
export default function LoginPage() { return <main className="login-page"><section className="login-art"><div><p className="eyebrow">PERSONAL ARCHIVE</p><h1>把走过的路，认真收好。</h1></div><p>成就、计划和足迹，都有一个安静的位置。</p></section><section className="login-panel"><LoginForm/></section></main>; }
