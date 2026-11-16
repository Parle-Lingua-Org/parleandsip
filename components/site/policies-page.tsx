"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { SiteChrome } from "@/components/site/site-chrome";
import { useSiteSettingsQuery } from "@/hooks/use-site-data";
import { initialSiteData } from "@/lib/site-data";

function PolicyBlock({ id, title, body }: { id: string; title: string; body: string }) {
  const blocks = body
    .split(/\n\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <section id={id} className="scroll-mt-8 border-t-2 border-foreground pt-6">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">
        {blocks.map((block) => {
          const lines = block.split(/\n/).map((line) => line.trim()).filter(Boolean);
          const bulletLines = lines.filter((line) => /^[-•·]/.test(line));
          if (bulletLines.length === lines.length && lines.length > 0) {
            return (
              <ul key={block} className="list-disc space-y-2 pl-5">
                {lines.map((line) => (
                  <li key={line}>{line.replace(/^[-•·]\s*/, "")}</li>
                ))}
              </ul>
            );
          }
          if (bulletLines.length > 0) {
            const intro = lines.filter((line) => !/^[-•·]/.test(line));
            return (
              <div key={block} className="space-y-3">
                {intro.map((line) => <p key={line}>{line}</p>)}
                <ul className="list-disc space-y-2 pl-5">
                  {bulletLines.map((line) => (
                    <li key={line}>{line.replace(/^[-•·]\s*/, "")}</li>
                  ))}
                </ul>
              </div>
            );
          }
          return <p key={block}>{block}</p>;
        })}
      </div>
    </section>
  );
}

export function PoliciesPage() {
  const settingsQuery = useSiteSettingsQuery();
  const content = settingsQuery.data?.content ?? initialSiteData.content;

  const sections = [
    { id: "ticket-purchase", title: "1. Ticket purchases and registration", body: content.policiesTicketPurchase },
    { id: "payment-terms", title: "2. Payment terms", body: content.policiesPayment },
    { id: "refund-cancellation", title: "3. Refund policy", body: content.policiesRefund },
    { id: "ticket-transfer", title: "4. Ticket transfer policy", body: content.policiesTicketTransfer },
    { id: "event-changes", title: "5. Event changes and postponement", body: content.policiesEventChanges },
    { id: "participant-responsibilities", title: "6. Participant responsibilities", body: content.policiesParticipantResponsibilities },
    { id: "contact-enquiries", title: "7. Contact and enquiries", body: content.policiesContact },
  ];

  return (
    <SiteChrome content={content} active="policies">
      <div className="mx-auto max-w-[860px] px-4 sm:px-8">
        <section className="py-10 md:py-14">
          <p className="flex items-center gap-2 font-mono text-[9px] tracking-wider text-muted-foreground">
            <span className="size-2 border border-foreground bg-accent" />
            POLICIES
          </p>
          <h1 className="mt-4 text-[36px] font-bold leading-[1.02] tracking-[-1.5px] sm:text-[46px]">
            {settingsQuery.isLoading ? <Skeleton className="h-12 w-72" /> : "Ticketing, payment, refund & cancellation policy"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            {content.policiesIntro}
          </p>

          <nav className="mt-6 flex flex-wrap gap-2 text-[10px] font-semibold">
            {sections.map((section) => (
              <a
                key={section.id}
                className="border-2 border-foreground bg-card px-3 py-2 shadow-[2px_2px_0_var(--foreground)]"
                href={`#${section.id}`}
              >
                {section.title.replace(/^\d+\.\s*/, "")}
              </a>
            ))}
          </nav>

          <div className="mt-8 space-y-8">
            {settingsQuery.isLoading ? (
              Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="h-32 w-full" />)
            ) : (
              <>
                {sections.map((section) => (
                  <PolicyBlock key={section.id} id={section.id} title={section.title} body={section.body} />
                ))}
                {content.policiesClosing ? (
                  <p className="border-t-2 border-foreground pt-6 text-sm leading-7 text-muted-foreground">
                    {content.policiesClosing}
                  </p>
                ) : null}
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
