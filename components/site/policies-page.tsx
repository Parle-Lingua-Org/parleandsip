"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { SiteChrome } from "@/components/site/site-chrome";
import { useSiteSettingsQuery } from "@/hooks/use-site-data";
import { initialSiteData } from "@/lib/site-data";

function PolicyBlock({ id, title, body }: { id: string; title: string; body: string }) {
  const paragraphs = body.split(/\n+/).map((part) => part.trim()).filter(Boolean);
  return (
    <section id={id} className="scroll-mt-8 border-t-2 border-foreground pt-6">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">
        {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
    </section>
  );
}

export function PoliciesPage() {
  const settingsQuery = useSiteSettingsQuery();
  const content = settingsQuery.data?.content ?? initialSiteData.content;
  const faq = content.policiesFaq?.length ? content.policiesFaq : initialSiteData.content.policiesFaq;

  return (
    <SiteChrome content={content} active="policies">
      <div className="mx-auto max-w-[860px] px-4 sm:px-8">
        <section className="py-10 md:py-14">
          <p className="flex items-center gap-2 font-mono text-[9px] tracking-wider text-muted-foreground">
            <span className="size-2 border border-foreground bg-accent" />
            POLICIES
          </p>
          <h1 className="mt-4 text-[36px] font-bold leading-[1.02] tracking-[-1.5px] sm:text-[46px]">
            {settingsQuery.isLoading ? <Skeleton className="h-12 w-72" /> : "Ticket & community policies"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Ticket purchase, refunds, transfers and answers to common questions.
          </p>

          <nav className="mt-6 flex flex-wrap gap-2 text-[10px] font-semibold">
            <a className="border-2 border-foreground bg-card px-3 py-2 shadow-[2px_2px_0_var(--foreground)]" href="#ticket-purchase">Ticket purchase</a>
            <a className="border-2 border-foreground bg-card px-3 py-2 shadow-[2px_2px_0_var(--foreground)]" href="#refund-cancellation">Refund &amp; cancellation</a>
            <a className="border-2 border-foreground bg-card px-3 py-2 shadow-[2px_2px_0_var(--foreground)]" href="#faq">FAQ</a>
            <a className="border-2 border-foreground bg-card px-3 py-2 shadow-[2px_2px_0_var(--foreground)]" href="#ticket-transfer">Ticket transfer</a>
          </nav>

          <div className="mt-8 space-y-8">
            {settingsQuery.isLoading ? (
              Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 w-full" />)
            ) : (
              <>
                <PolicyBlock id="ticket-purchase" title="Ticket purchase" body={content.policiesTicketPurchase} />
                <PolicyBlock id="refund-cancellation" title="Refund & cancellation policy" body={content.policiesRefund} />
                <section id="faq" className="scroll-mt-8 border-t-2 border-foreground pt-6">
                  <h2 className="text-xl font-bold tracking-tight">FAQ</h2>
                  <div className="mt-4 space-y-4">
                    {faq.map((item) => (
                      <div key={item.question} className="border-2 border-foreground bg-card p-4 shadow-[3px_3px_0_var(--foreground)]">
                        <h3 className="text-sm font-bold">{item.question}</h3>
                        <p className="mt-2 text-xs leading-6 text-muted-foreground">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </section>
                <PolicyBlock id="ticket-transfer" title="Ticket transfer terms" body={content.policiesTicketTransfer} />
                {content.policiesDocumentUrl ? (
                  <p className="text-xs">
                    <a className="font-semibold underline" href={content.policiesDocumentUrl} target="_blank" rel="noreferrer">
                      Download full policy document
                    </a>
                  </p>
                ) : null}
              </>
            )}
          </div>
        </section>
      </div>
    </SiteChrome>
  );
}
