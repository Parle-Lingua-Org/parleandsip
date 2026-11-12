"use client";

import { useState, type ReactNode } from "react";
import { ArrowDownRight, ArrowRight, MapPin, Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/site/brand-logo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { SiteContent } from "@/lib/site-data";

const createWithFormUrl = "https://docs.google.com/forms/d/1LhlPUi_uVlC41u3JguE9TOTjKlaISiVqs1AbKIi3Q9k/viewform?embedded=true";

type SiteChromeProps = {
  content: SiteContent;
  children: ReactNode;
  active?: "home" | "events" | "about" | "contact";
};

export function SiteChrome({ content, children, active = "home" }: SiteChromeProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const eventsHref = active === "home" ? "#events" : "/#events";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-8 items-center justify-between gap-3 bg-foreground px-4 text-[9px] font-mono tracking-wider text-primary sm:px-8 lg:px-[max(2rem,calc((100vw-1200px)/2))]">
        <span className="truncate">{content.announcement}</span>
        <span className="flex shrink-0 items-center gap-1.5 text-card"><MapPin size={13} /> {content.footerLocation} <ArrowDownRight size={14} /></span>
      </div>

      <header className="relative z-20 flex h-[68px] items-center gap-8 border-b-2 border-foreground px-4 sm:px-8 lg:px-[max(2rem,calc((100vw-1200px)/2))]">
        <a className="flex shrink-0 items-center gap-2 text-xl font-bold tracking-tight" href="/" aria-label={`${content.brandName} home`}>
          <BrandLogo size={32} priority />
          {content.brandName}
          <span className="text-accent">.</span>
        </a>
        <button className="ml-auto grid size-9 place-items-center border-2 border-foreground bg-primary md:hidden" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
        <nav className={`${menuOpen ? "absolute left-0 right-0 top-[66px] flex border-b-2 border-foreground bg-background px-4 shadow-[0_5px_0_var(--foreground)] md:static md:h-full md:border-0 md:bg-transparent md:p-0 md:shadow-none" : "hidden md:flex"} flex-col items-stretch gap-0 md:ml-4 md:flex-row md:items-center md:gap-7`} aria-label="Main navigation">
          <a className={`border-b border-dap-border-soft py-3 text-xs md:border-0 md:py-0 ${active === "events" || active === "home" ? "font-semibold" : "text-muted-foreground"}`} href={eventsHref} onClick={() => setMenuOpen(false)}>{content.navExplore}</a>
          <a className={`border-b border-dap-border-soft py-3 text-xs md:border-0 md:py-0 ${active === "about" ? "font-semibold text-foreground" : "text-muted-foreground"}`} href="/about" onClick={() => setMenuOpen(false)}>{content.navAbout || "About us"}</a>
          <a className={`py-3 text-xs md:py-0 ${active === "contact" ? "font-semibold text-foreground" : "text-muted-foreground"}`} href="/contact" onClick={() => setMenuOpen(false)}>{content.navContact}</a>
        </nav>
        <Button type="button" size="sm" variant="outline" className="ml-auto hidden md:inline-flex" onClick={() => setCreateFormOpen(true)}>{content.proCta} <ArrowRight size={14} /></Button>
      </header>

      {children}

      <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
        <footer className="mt-10 flex min-h-20 flex-wrap items-center gap-3 border-t-2 border-foreground py-4">
          <a className="flex items-center gap-2 text-lg font-bold" href="/">
            <BrandLogo size={28} />
            {content.brandName}<span className="text-accent">.</span>
          </a>
          <p className="font-serif text-xs italic text-muted-foreground">{content.footerText}</p>
          <span className="ml-auto text-right font-mono text-[8px] tracking-wide text-muted-foreground">{content.footerLocation} <span className="px-1 text-accent">●</span> {content.footerCurrency}</span>
        </footer>
      </div>

      <Dialog open={createFormOpen} onOpenChange={setCreateFormOpen}>
        <DialogContent className="max-w-3xl overflow-hidden p-0">
          <div className="border-b-2 border-foreground px-5 py-4 pr-14">
            <p className="font-mono text-[9px] tracking-wide text-muted-foreground">RSVP · ABUJA PARLE FRANÇAIS</p>
            <DialogTitle className="mt-1 text-xl font-bold">{content.proCta}</DialogTitle>
            <DialogDescription className="mt-1 text-xs text-muted-foreground">Fill the form below. We&apos;ll use your answers for your place and ticket name.</DialogDescription>
          </div>
          <iframe title="Join our community form" src={createWithFormUrl} className="h-[min(70dvh,720px)] w-full border-0 bg-card" loading="lazy" />
        </DialogContent>
      </Dialog>
    </main>
  );
}
