"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { SiteChrome } from "@/components/site/site-chrome";
import { useSiteSettingsQuery } from "@/hooks/use-site-data";
import { initialSiteData } from "@/lib/site-data";

export function AboutPage() {
  const settingsQuery = useSiteSettingsQuery();
  const content = settingsQuery.data?.content ?? initialSiteData.content;
  const paragraphs = (content.aboutBody || "").split(/\n+/).map((part) => part.trim()).filter(Boolean);
  const faq = content.aboutFaq?.length ? content.aboutFaq : initialSiteData.content.aboutFaq;

  return (
    <SiteChrome content={content} active="about">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
        <section className="grid gap-8 py-10 md:grid-cols-[minmax(0,1.1fr)_minmax(280px,.9fr)] md:py-14">
          <div>
            <p className="flex items-center gap-2 font-mono text-[9px] tracking-wider text-muted-foreground">
              <span className="size-2 border border-foreground bg-accent" />
              {settingsQuery.isLoading ? <Skeleton className="h-3 w-24" /> : content.aboutEyebrow}
            </p>
            <h1 className="mt-4 text-[36px] font-bold leading-[1.02] tracking-[-1.5px] sm:text-[46px]">
              {settingsQuery.isLoading ? <Skeleton className="h-12 w-80" /> : content.aboutTitle}
            </h1>
            <div className="mt-5 max-w-2xl space-y-4 text-sm leading-7 text-muted-foreground">
              {settingsQuery.isLoading
                ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-16 w-full" />)
                : paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </div>
          {(content.aboutImage || settingsQuery.isLoading) && (
            <div className="min-h-[280px] border-2 border-foreground bg-cover bg-center shadow-[4px_4px_0_var(--foreground)]" style={content.aboutImage ? { backgroundImage: `url("${content.aboutImage}")` } : undefined}>
              {settingsQuery.isLoading ? <Skeleton className="h-full min-h-[280px] w-full rounded-none" /> : null}
            </div>
          )}
        </section>

        <section id="faq" className="scroll-mt-8 border-t-2 border-foreground py-10 md:py-14">
          <p className="font-mono text-[9px] tracking-wider text-muted-foreground">FAQ</p>
          <h2 className="mt-2 text-[28px] font-bold tracking-tight">Questions we hear often.</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {settingsQuery.isLoading
              ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 w-full" />)
              : faq.map((item) => (
                <div key={item.question} className="border-2 border-foreground bg-card p-4 shadow-[3px_3px_0_var(--foreground)]">
                  <h3 className="text-sm font-bold">{item.question}</h3>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">{item.answer}</p>
                </div>
              ))}
          </div>
        </section>
      </div>
    </SiteChrome>
  );
}
