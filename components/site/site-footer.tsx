import { BrandLogo } from "@/components/site/brand-logo";
import type { SiteContent } from "@/lib/site-data";

export function SiteFooter({ content }: { content: SiteContent }) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
      <footer className="mt-10 border-t-2 border-foreground py-5">
        <div className="flex min-h-16 flex-wrap items-center gap-3">
          <a className="flex items-center gap-2 text-lg font-bold" href="/">
            <BrandLogo size={28} />
            {content.brandName}<span className="text-accent">.</span>
          </a>
          <p className="font-serif text-xs italic text-muted-foreground">{content.footerText}</p>
          <span className="ml-auto text-right font-mono text-[8px] tracking-wide text-muted-foreground">
            {content.footerLocation} <span className="px-1 text-accent">●</span> {content.footerCurrency}
          </span>
        </div>
        <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-dap-border-soft pt-4 text-[10px]" aria-label="Policies">
          <a className="font-semibold hover:underline" href="/policies#ticket-purchase">Ticket purchase</a>
          <a className="font-semibold hover:underline" href="/policies#refund-cancellation">Refund &amp; cancellation</a>
          <a className="font-semibold hover:underline" href="/policies#faq">FAQ</a>
          <a className="font-semibold hover:underline" href="/policies#ticket-transfer">Ticket transfer</a>
          <a className="text-muted-foreground hover:underline" href="/about#faq">About FAQ</a>
        </nav>
      </footer>
    </div>
  );
}
