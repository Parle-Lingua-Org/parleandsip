"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, ClipboardList, Eye, KeyRound, LayoutDashboard, LockKeyhole, LogOut, Palette, ScanLine, Shield, Stamp, Ticket } from "lucide-react";
import { AdminPageLoading } from "@/components/admin/page-loading";
import { BrandLogo } from "@/components/site/brand-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSiteSettingsQuery } from "@/hooks/use-site-data";
import { PIN_COOKIE_TTL_MS } from "@/lib/admin-pin-client";
import { initialSiteData } from "@/lib/site-data";
import { notifyError } from "@/lib/notify";

const navigation = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/content", label: "Site content", icon: Palette },
  { href: "/admin/events", label: "Events & tickets", icon: CalendarDays },
  { href: "/admin/rsvps", label: "Community RSVPs", icon: ClipboardList },
  { href: "/admin/tickets", label: "Ticket template", icon: Stamp },
  { href: "/admin/orders", label: "Orders", icon: Ticket },
  { href: "/admin/check-in", label: "Scan tickets", icon: ScanLine },
  { href: "/admin/password", label: "Change password", icon: KeyRound },
  { href: "/admin/pin", label: "Change PIN", icon: Shield },
];

const PIN_TOUCH_THROTTLE_MS = 60_000;

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const settingsQuery = useSiteSettingsQuery();
  const content = settingsQuery.data?.content ?? initialSiteData.content;
  const [authorized, setAuthorized] = useState(false);
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [pinLockedByIdle, setPinLockedByIdle] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [pin, setPin] = useState("");
  const [pinBusy, setPinBusy] = useState(false);
  const lastTouchAt = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    async function verifyAdmin() {
      try {
        const response = await fetch("/api/admin/session", { cache: "no-store" });
        const result = await response.json() as { email?: string; pinUnlocked?: boolean; error?: string };
        if (!response.ok) {
          router.replace("/admin/login");
          return;
        }
        if (!active) return;
        setAdminEmail(result.email ?? "");
        setPinUnlocked(Boolean(result.pinUnlocked));
        setAuthorized(true);
      } catch {
        router.replace("/admin/login?error=auth-unavailable");
      }
    }
    void verifyAdmin();
    return () => { active = false; };
  }, [router]);

  useEffect(() => {
    if (!authorized || !pinUnlocked) return;

    async function lockForInactivity() {
      setPinUnlocked(false);
      setPinLockedByIdle(true);
      try {
        await fetch("/api/admin/pin/lock", { method: "POST" });
      } catch {
        // Cookie may already be expired; UI is locked either way.
      }
    }

    function scheduleIdleLock() {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        void lockForInactivity();
      }, PIN_COOKIE_TTL_MS);
    }

    async function noteActivity() {
      scheduleIdleLock();
      const now = Date.now();
      if (now - lastTouchAt.current < PIN_TOUCH_THROTTLE_MS) return;
      lastTouchAt.current = now;
      try {
        const response = await fetch("/api/admin/pin/touch", { method: "POST" });
        if (response.status === 403) {
          setPinUnlocked(false);
          setPinLockedByIdle(true);
        }
      } catch {
        // Keep local unlock; next idle lock or API call will re-check.
      }
    }

    scheduleIdleLock();
    const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "mousemove", "scroll", "touchstart"];
    const onActivity = () => {
      if (document.visibilityState === "hidden") return;
      void noteActivity();
    };
    for (const event of events) window.addEventListener(event, onActivity, { passive: true });
    document.addEventListener("visibilitychange", onActivity);
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      for (const event of events) window.removeEventListener(event, onActivity);
      document.removeEventListener("visibilitychange", onActivity);
    };
  }, [authorized, pinUnlocked]);

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  async function unlockWithPin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPinBusy(true);
    try {
      const response = await fetch("/api/admin/pin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Incorrect PIN.");
      setPin("");
      setPinLockedByIdle(false);
      setPinUnlocked(true);
      lastTouchAt.current = 0;
    } catch (reason) {
      notifyError(reason, "Incorrect PIN.");
    } finally {
      setPinBusy(false);
    }
  }

  if (!authorized) return <AdminPageLoading fullscreen />;

  if (!pinUnlocked) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
        <Card className="w-full max-w-sm space-y-5 p-5 shadow-[4px_4px_0_var(--foreground)] sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center border-2 border-foreground bg-primary"><LockKeyhole size={20} /></span>
            <div>
              <p className="font-mono text-[9px] tracking-wide text-muted-foreground">ADMIN PIN</p>
              <h1 className="text-xl font-bold">{pinLockedByIdle ? "PIN required again" : "Enter workspace PIN"}</h1>
            </div>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Signed in as <strong>{adminEmail}</strong>.{" "}
            {pinLockedByIdle
              ? "Locked after 10 minutes of inactivity — enter the PIN to continue (you are still signed in)."
              : "Enter the 6-digit PIN to open the admin console."}
          </p>
          <form className="grid gap-3" onSubmit={(event) => void unlockWithPin(event)}>
            <label className="grid gap-1.5 text-xs font-semibold">
              PIN
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                pattern="\d{6}"
                maxLength={6}
                required
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6 digits"
              />
            </label>
            <Button type="submit" disabled={pinBusy || pin.length !== 6}>{pinBusy ? "Checking…" : "Unlock admin"}</Button>
          </form>
          <Button type="button" variant="ghost" className="w-full" onClick={() => void signOut()}>
            <LogOut size={14} /> Sign out
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden min-h-screen flex-col border-r-2 border-foreground bg-card lg:flex">
        <Link href="/" className="flex min-h-[76px] items-center gap-2 border-b-2 border-foreground px-6 text-lg font-bold">
          <BrandLogo size={36} />
          {content.brandName}<span className="-ml-2 text-accent">.</span><span className="ml-auto font-mono text-[8px] font-normal text-muted-foreground">ADMIN</span>
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
          <div className="flex items-center gap-2 lg:hidden"><BrandLogo size={32} /><span className="font-bold">{content.brandName}<span className="text-accent">.</span></span></div>
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
