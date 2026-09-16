import type { Metadata } from "next"; import { RegisterForm } from "@/components/register-form";
export const metadata:Metadata={title:"注册"};
export default function RegisterPage(){return <main className="login-page"><section className="login-art"><p className="eyebrow">PERSONAL ARCHIVE</p><div className="pixel-welcome">WELCOME!</div><h1>Keep the moments that matter.</h1><p>把属于你的成就、计划和足迹收进来。</p></section><section className="login-panel"><RegisterForm/></section></main>}
