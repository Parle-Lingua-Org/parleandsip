"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Languages, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSiteStore } from "@/lib/site-store";

const demoEmail = "admin@parleandsip.local";
const demoPassword = "parle-demo";

export default function AdminLoginPage() {
  const router = useRouter();
  const { data } = useSiteStore();
  const [email, setEmail] = useState(demoEmail);
  const [password, setPassword] = useState(demoPassword);
  const [error, setError] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem("dap-admin-session") === "active") router.replace("/admin");
  }, [router]);

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim().toLowerCase() !== demoEmail || password !== demoPassword) {
      setError("Those demo credentials did not match.");
      return;
    }
    sessionStorage.setItem("dap-admin-session", "active");
    router.replace("/admin");
  }

  return (
    <main className="grid min-h-screen bg-background text-foreground lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden border-r-2 border-foreground bg-primary p-10 lg:flex lg:flex-col lg:justify-between">
        <a className="flex w-fit items-center gap-2 text-xl font-bold" href="/">{data.content.logoImage ? <img src={data.content.logoImage} alt="" className="size-9 border-2 border-foreground object-cover" /> : <span className="grid size-9 place-items-center border-2 border-foreground bg-card"><Languages size={20} /></span>}{data.content.brandName}<span className="text-accent">.</span></a>
        <div className="max-w-xl"><p className="font-mono text-[10px] tracking-wide">PARLE & SIP · COMMUNITY CONTROL ROOM</p><h1 className="mt-5 text-6xl font-bold leading-[.95] tracking-[-3px]">French,<br />culture &<br /><span className="font-serif italic">connection.</span></h1><p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">Manage the experiences, update the welcome, and bring Francophone culture to life.</p></div>
        <p className="font-mono text-[9px] text-muted-foreground">LAGOS, NIGERIA · LOCAL DEMO</p>
      </section>
      <section className="flex min-h-screen flex-col justify-between p-5 sm:p-8 lg:p-12">
        <div className="flex items-center justify-between"><a className="flex items-center gap-2 text-lg font-bold lg:hidden" href="/">{data.content.logoImage ? <img src={data.content.logoImage} alt="" className="size-8 border-2 border-foreground object-cover" /> : <span className="grid size-8 place-items-center border-2 border-foreground bg-primary"><Languages size={18} /></span>}{data.content.brandName}<span className="text-accent">.</span></a><a className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" href="/"><ArrowLeft size={14} /> Back to site</a></div>
        <div className="mx-auto w-full max-w-sm py-12">
          <div className="mb-6 grid size-12 place-items-center border-2 border-foreground bg-secondary"><LockKeyhole size={21} /></div>
          <p className="font-mono text-[9px] tracking-wider text-muted-foreground">ADMIN ACCESS · DEMO ONLY</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">Welcome back.</h2>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">Sign in to manage Parle & Sip experiences and community.</p>
          <Card className="mt-7 p-5 shadow-[4px_4px_0_var(--foreground)]">
            <form className="grid gap-4" onSubmit={signIn}>
              <label className="grid gap-1.5 text-xs font-semibold">Email <Input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
              <label className="grid gap-1.5 text-xs font-semibold">Password <Input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
              {error && <p role="alert" className="border-2 border-accent bg-accent/20 p-2 text-xs">{error}</p>}
              <Button type="submit" className="mt-1 w-full">Sign in <ArrowRight size={15} /></Button>
            </form>
            <div className="mt-5 border-t border-dap-border-muted pt-4"><p className="font-mono text-[8px] text-muted-foreground">DEMO CREDENTIALS</p><p className="mt-1 text-[10px]">{demoEmail} <span className="px-1 text-muted-foreground">/</span> {demoPassword}</p></div>
          </Card>
          <p className="mt-5 text-center text-[9px] leading-4 text-muted-foreground">Frontend demo only. Authentication is stored in this browser session and is not secure for production.</p>
        </div>
        <p className="font-mono text-[8px] tracking-wide text-muted-foreground">PARLE & SIP ADMIN · V1.0</p>
      </section>
    </main>
  );
}