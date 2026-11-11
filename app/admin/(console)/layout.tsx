"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Eye, KeyRound, LayoutDashboard, LogOut, Palette, Ticket, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteStore } from "@/lib/site-store";

const navigation = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/content", label: "Site content", icon: Palette },
  { href: "/admin/events", label: "Events & tickets", icon: CalendarDays },
  { href: "/admin/orders", label: "Orders", icon: Ticket },
  { href: "/admin/password", label: "Change password", icon: KeyRound },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, ready } = useSiteStore();
  const [authorized, setAuthorized] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    let active = true;
    async function verifyAdmin() {
      try {
        const response = await fetch("/api/admin/session", { cache: "no-store" });
        const result = await response.json() as { email?: string; error?: string };
        if (!response.ok) {
          router.replace("/admin/login");
          return;
        }
        if (!active) return;
        setAdminEmail(result.email ?? "");
        setAuthorized(true);
      } catch {
        router.replace("/admin/login?error=auth-unavailable");
      }
    }
    void verifyAdmin();
    return () => { active = false; };
  }, [router]);

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  if (!authorized || !ready) return <main className="grid min-h-screen place-items-center bg-background"><p className="font-mono text-xs text-muted-foreground">Opening admin workspace…</p></main>;

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden min-h-screen flex-col border-r-2 border-foreground bg-card lg:flex">
        <Link href="/" className="flex min-h-[76px] items-center gap-2 border-b-2 border-foreground px-6 text-lg font-bold">
          {data.content.logoImage ? <img src={data.content.logoImage} alt="" className="size-9 border-2 border-foreground object-cover" /> : <span className="grid size-9 place-items-center border-2 border-foreground bg-primary"><UsersRound size={18} /></span>}
          {data.content.brandName}<span className="-ml-2 text-accent">.</span><span className="ml-auto font-mono text-[8px] font-normal text-muted-foreground">ADMIN</span>
        </Link>
        <p className="px-6 pb-2 pt-6 font-mono text-[8px] tracking-wider text-muted-foreground">WORKSPACE</p>
        <nav className="grid gap-1 px-3" aria-label="Admin sections">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return <Link key={href} href={href} className={`flex h-10 items-center gap-3 border-2 px-3 text-xs font-medium transition-colors ${active ? "border-foreground bg-secondary shadow-[2px_2px_0_var(--foreground)]" : "border-transparent text-muted-foreground hover:border-dap-border-soft hover:text-foreground"}`}><Icon size={16} />{label}</Link>;
          })}
        </nav>
        <div className="mt-auto border-t border-dap-border-muted p-4">
          <p className="font-mono text-[8px] text-muted-foreground">SIGNED IN</p>
          <p className="mt-1 break-all text-[10px] leading-4 text-muted-foreground">{adminEmail}</p>
          <Button variant="ghost" size="sm" className="mt-3 w-full justify-start" onClick={signOut}><LogOut size={14} /> Sign out</Button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex min-h-[68px] items-center justify-between gap-3 border-b-2 border-foreground px-4 sm:px-7">
          <div className="flex items-center gap-2 lg:hidden"><span className="grid size-8 place-items-center border-2 border-foreground bg-primary"><UsersRound size={16} /></span><span className="font-bold">{data.content.brandName}<span className="text-accent">.</span></span></div>
          <p className="hidden font-mono text-[9px] tracking-wide text-muted-foreground lg:block">PARLE & SIP / ADMIN / {navigation.find((item) => item.href === pathname)?.label.toUpperCase() ?? "WORKSPACE"}</p>
          <div className="ml-auto flex items-center gap-2"><Button asChild size="sm" variant="outline"><Link href="/"><Eye size={14} /><span className="hidden sm:inline">Preview site</span></Link></Button><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Sign out" onClick={signOut}><LogOut size={15} /></Button></div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-dap-border-muted px-3 py-2 lg:hidden" aria-label="Admin pages">
          {navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`flex shrink-0 items-center gap-1.5 border px-2.5 py-2 text-[10px] ${pathname === href ? "border-foreground bg-primary font-semibold" : "border-transparent text-muted-foreground"}`}><Icon size={13} />{label}</Link>)}
        </nav>
        <main className="mx-auto max-w-[1400px] p-4 sm:p-7 lg:p-9">{children}</main>
      </div>
    </div>
  );
}