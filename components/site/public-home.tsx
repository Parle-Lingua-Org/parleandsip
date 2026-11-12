"use client";

import { useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  CalendarDays,
  Clock3,
  Globe2,
  Languages,
  Mail,
  MapPin,
  Menu,
  Minus,
  Plus,
  Search,
  Sparkles,
  Ticket,
  UsersRound,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublishedEventsQuery, useSiteSettingsQuery } from "@/hooks/use-site-data";
import { remainingForTier, upcomingEvents, type EventRecord } from "@/lib/events-shared";
import { formatNaira, initialSiteData } from "@/lib/site-data";
import { BrandLogo } from "@/components/site/brand-logo";

const createWithFormUrl = "https://docs.google.com/forms/d/1LhlPUi_uVlC41u3JguE9TOTjKlaISiVqs1AbKIi3Q9k/viewform?embedded=true";

export function PublicHome() {
  const settingsQuery = useSiteSettingsQuery();
  const eventsQuery = usePublishedEventsQuery();
  const content = settingsQuery.data?.content ?? initialSiteData.content;
  const events = eventsQuery.data ?? [];
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackSubject, setFeedbackSubject] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedTierId, setSelectedTierId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  const featuredEvent = events.find((event) => event.slug === content.featuredEventId || event.id === content.featuredEventId) ?? upcomingEvents(events, 1)[0] ?? events[0];
  const nextEditions = upcomingEvents(events, 3);
  const visibleEvents = events.filter((event) => {
    if (!query.trim()) return true;
    return `${event.title} ${event.host} ${event.category} ${event.venue} ${event.area} ${event.languages.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase());
  });
  const selectedTier = selectedEvent?.ticketTiers.find((tier) => tier.id === selectedTierId) ?? selectedEvent?.ticketTiers[0];
  const eventImages = selectedEvent ? [selectedEvent.image, ...selectedEvent.gallery].filter((image, index, list) => Boolean(image) && list.indexOf(image) === index) : [];
  const tierRemaining = (event: EventRecord, tierId: string) => {
    const tier = event.ticketTiers.find((item) => item.id === tierId);
    return tier ? remainingForTier(tier) : 0;
  };
  const selectedTierRemaining = selectedEvent && selectedTier ? remainingForTier(selectedTier) : 0;
  const ticketPrice = selectedTier?.price ?? 0;
  const loadingHome = settingsQuery.isLoading || eventsQuery.isLoading;

  function openTickets(event: EventRecord) {
    setSelectedEvent(event);
    setSelectedImageIndex(0);
    setSelectedTierId(event.ticketTiers.find((tier) => remainingForTier(tier) > 0)?.id ?? event.ticketTiers[0]?.id ?? "");
    setQuantity(1);
    setBuyerName("");
    setBuyerEmail("");
    setOrderComplete(false);
    setOrderError("");
    setCheckoutUrl("");
  }

  async function submitCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEvent) return;
    if (!selectedTier || quantity > selectedTierRemaining) {
      setOrderError("That ticket type has sold out. Choose another option.");
      return;
    }
    setCheckoutBusy(true);
    setOrderError("");
    try {
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventSlug: selectedEvent.slug,
          buyerName: buyerName.trim(),
          buyerEmail: buyerEmail.trim(),
          items: [{ name: selectedTier.name, quantity }],
        }),
      });
      const result = await response.json() as { authorizationUrl?: string; error?: string };
      if (!response.ok || !result.authorizationUrl) throw new Error(result.error ?? "Unable to open Paystack checkout.");
      setCheckoutUrl(result.authorizationUrl);
      setOrderComplete(true);
      window.location.assign(result.authorizationUrl);
    } catch (reason) {
      setOrderError(reason instanceof Error ? reason.message : "Unable to start checkout. Please try again.");
    } finally {
      setCheckoutBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-8 items-center justify-between gap-3 bg-foreground px-4 text-[9px] font-mono tracking-wider text-primary sm:px-8 lg:px-[max(2rem,calc((100vw-1200px)/2))]">
        <span className="truncate">{content.announcement}</span>
        <span className="flex shrink-0 items-center gap-1.5 text-card"><MapPin size={13} /> {content.footerLocation} <ArrowDownRight size={14} /></span>
      </div>

      <header className="relative z-20 flex h-[68px] items-center gap-8 border-b-2 border-foreground px-4 sm:px-8 lg:px-[max(2rem,calc((100vw-1200px)/2))]">
        <a
          className="flex shrink-0 items-center gap-2 text-xl font-bold tracking-tight"
          href="#top"
          aria-label={`${content.brandName} home`}
        >
          <BrandLogo size={32} priority />
          {content.brandName}
          <span className="text-accent">.</span>
        </a>
        <button className="ml-auto grid size-9 place-items-center border-2 border-foreground bg-primary md:hidden" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
        <nav className={`${menuOpen ? "absolute left-0 right-0 top-[66px] flex border-b-2 border-foreground bg-background px-4 shadow-[0_5px_0_var(--foreground)] md:static md:h-full md:border-0 md:bg-transparent md:p-0 md:shadow-none" : "hidden md:flex"} flex-col items-stretch gap-0 md:ml-4 md:flex-row md:items-center md:gap-7`} aria-label="Main navigation">
          <a className="border-b border-dap-border-soft py-3 text-xs font-semibold md:border-0 md:py-0" href="#events" onClick={() => setMenuOpen(false)}>{content.navExplore}</a>
          <a className="border-b border-dap-border-soft py-3 text-xs text-muted-foreground md:border-0 md:py-0" href="/about" onClick={() => setMenuOpen(false)}>{content.navAbout || "About us"}</a>
          <a className="py-3 text-xs text-muted-foreground md:py-0" href="/contact" onClick={() => setMenuOpen(false)}>{content.navContact}</a>
        </nav>
        <Button type="button" size="sm" variant="outline" className="ml-auto hidden md:inline-flex" onClick={() => setCreateFormOpen(true)}>{content.proCta} <ArrowRight size={14} /></Button>
      </header>

      <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
        <section className="flex min-h-[225px] items-end justify-between gap-6 py-9 md:py-11">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 font-mono text-[9px] tracking-wider text-muted-foreground"><span className="size-2 border border-foreground bg-accent" />{content.heroEyebrow}</p>
            <h1 className="mt-4 text-[42px] font-bold leading-[.98] tracking-[-2px] sm:text-[52px]">{content.heroTitle}<br /><span className="text-dap-green">{content.heroSecondLine}</span></h1>
            <p className="mt-3 max-w-xl text-xs leading-6 text-muted-foreground">{content.heroDescription}</p>
          </div>
          <a className="mb-1 hidden shrink-0 items-center gap-2 font-mono text-[8px] tracking-wide text-muted-foreground lg:flex" href="#events">SCROLL TO FIND YOUR NEXT EXPERIENCE <ArrowDownRight size={16} className="text-foreground" /></a>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12" aria-label="Featured Parle & Sip experiences">
          <Card className="relative min-h-[390px] overflow-hidden bg-dap-hero text-card shadow-[4px_4px_0_var(--foreground)] md:row-span-2 xl:col-span-6">
            {featuredEvent && (featuredEvent.image || content.heroImage) && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(180deg,rgb(var(--dap-overlay-rgb)/.04) 18%,rgb(var(--dap-overlay-rgb)/.78) 100%),url("${featuredEvent.image || content.heroImage}")` }} />}
            <Badge className="absolute left-4 top-4 gap-1.5"><Sparkles size={12} /> THIS WEEK&apos;S PICK</Badge>
            <div className="absolute inset-x-4 bottom-4 sm:inset-x-5 sm:bottom-5">
              <p className="font-mono text-[9px] uppercase tracking-wide text-dap-feature-copy">{featuredEvent?.category ?? "Community meetup"} <span className="px-1 text-primary">·</span> {featuredEvent?.area ?? content.cityName}</p>
              <h2 className="mt-2 text-3xl font-bold leading-tight">{featuredEvent?.title ?? "Your next conversation starts here"}</h2>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 font-mono text-[9px]"><CalendarDays size={14} /> {featuredEvent ? (featuredEvent.time ? `${featuredEvent.dateShort} · ${featuredEvent.time}` : featuredEvent.dateShort) : "TBD"}</span>
                {featuredEvent && <Button size="sm" onClick={() => openTickets(featuredEvent)}>Get tickets <ArrowRight size={14} /></Button>}
              </div>
            </div>
          </Card>

          <Card className="flex min-h-[190px] flex-col justify-between bg-primary p-4 shadow-[4px_4px_0_var(--foreground)] xl:col-span-3">
            <span className="font-mono text-[8px] tracking-wide text-muted-foreground">01 / THE IDEA</span>
            <p className="text-2xl font-bold leading-tight tracking-tight">{content.promptTitle}<br /><em className="font-serif font-semibold">{content.promptEmphasis}</em></p>
            <span className="flex items-center gap-2 text-[10px]"><Globe2 size={16} /> {content.promptCaption}</span>
          </Card>

          <Card className="min-h-[190px] bg-card p-4 shadow-[4px_4px_0_var(--foreground)] xl:col-span-3">
            <span className="font-mono text-[8px] tracking-wide text-muted-foreground">{content.calendarTitle}</span>
            <div className="mt-3 grid gap-2">
              {loadingHome ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="grid grid-cols-[36px_35px_1fr] items-center gap-2 border-t border-dap-border-soft pt-2 first:border-0 first:pt-0"><Skeleton className="h-8 w-9" /><Skeleton className="h-4 w-8" /><Skeleton className="h-4 w-full" /></div>) : nextEditions.length ? nextEditions.map((event) => <a key={event.id} className="grid grid-cols-[40px_42px_1fr] items-center gap-2 border-t border-dap-border-soft pt-2 first:border-0 first:pt-0" href="#events">
                <strong className="text-xl leading-none tracking-tight">{event.dayLabel}</strong>
                <span className="font-mono text-[7px] leading-tight text-muted-foreground">{event.monthLabel}{event.weekdayLabel ? <><br />{event.weekdayLabel}</> : null}</span>
                <small className="truncate text-[9px]">{event.title}</small>
              </a>) : <p className="border-t border-dap-border-soft pt-2 text-[9px] text-muted-foreground">No upcoming editions yet.</p>}
            </div>
            <a className="mt-3 inline-flex items-center gap-1.5 text-[9px] font-semibold" href="#events">See all meetups <ArrowRight size={13} /></a>
          </Card>

          <Card id="community" className="flex min-h-[170px] flex-col items-start bg-primary p-4 text-primary-foreground shadow-[4px_4px_0_var(--foreground)] md:col-span-2 xl:col-span-6">
            <span className="font-mono text-[8px] tracking-wide">02 / YOUR KIND OF PEOPLE</span>
            <div className="mt-3 flex -space-x-1.5" aria-hidden="true"><span className="grid size-7 place-items-center rounded-full border border-foreground bg-dap-avatar text-[9px] font-bold">F</span><span className="grid size-7 place-items-center rounded-full border border-foreground bg-primary text-[9px] font-bold">C</span><span className="grid size-7 place-items-center rounded-full border border-foreground bg-dap-blue text-[9px] font-bold">A</span><span className="grid size-7 place-items-center rounded-full border border-foreground bg-foreground text-[9px] font-bold text-card">+</span></div>
            <strong className="mt-2 max-w-lg text-xl leading-tight">{content.communityTitle}</strong>
            <a className="mt-auto inline-flex items-center gap-1.5 pt-3 text-[9px] font-bold" href="#events">{content.communityCta} <ArrowRight size={13} /></a>
          </Card>
        </section>

        <section id="events" className="scroll-mt-5 pt-14" aria-labelledby="events-title">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div><p className="flex items-center gap-2 font-mono text-[9px] tracking-wider text-muted-foreground"><span className="size-2 border border-foreground bg-accent" />{content.eventsEyebrow}</p><h2 id="events-title" className="mt-2 text-[28px] font-bold leading-tight tracking-tight sm:text-3xl">{content.eventsTitle} <span className="text-dap-green">{content.eventsEmphasis}</span></h2></div>
            <label className="flex min-h-10 w-full items-center gap-2 border-2 border-foreground bg-card px-2.5 shadow-[3px_3px_0_var(--foreground)] md:max-w-[300px]" htmlFor="event-search"><Search size={16} /><Input id="event-search" className="h-9 border-0 px-0 shadow-none focus-visible:ring-0" placeholder="Try French, art, food, games..." value={query} onChange={(event) => setQuery(event.target.value)} /><kbd className="border border-dap-border-soft px-1 text-[9px] text-muted-foreground">/</kbd></label>
          </div>
          {loadingHome ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="overflow-hidden shadow-[4px_4px_0_var(--foreground)]">
                  <Skeleton className="aspect-[1.65] w-full rounded-none border-0 border-b-2 border-foreground" />
                  <div className="space-y-2 p-3">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </Card>
              ))}
            </div>
          ) : visibleEvents.length ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden shadow-[4px_4px_0_var(--foreground)]">
                  <button type="button" aria-label={`View tickets for ${event.title}`} onClick={() => openTickets(event)} className="relative block aspect-[1.65] w-full border-b-2 border-foreground bg-cover bg-center text-left" style={{ backgroundImage: `linear-gradient(180deg,rgb(var(--dap-overlay-rgb)/.03) 35%,rgb(var(--dap-overlay-rgb)/.58)),url("${event.image}")` }}>
                    <Badge className="absolute left-2.5 top-2.5">{event.dateShort}</Badge>{event.label && <Badge variant="outline" className="absolute right-2.5 top-2.5 bg-card">{event.label}</Badge>}
                  </button>
                  <div className="p-3">
                    <p className="font-mono text-[8px] uppercase text-muted-foreground">{event.category}</p>
                    <h3 className="mt-1 min-h-9 text-sm font-bold leading-tight">{event.title}</h3>
                    <p className="mt-1 flex items-start gap-1 text-[10px] text-muted-foreground"><MapPin size={13} className="mt-0.5 shrink-0" />{event.venue} <span className="text-dap-text-soft">· {event.host}</span></p>
                    <div className="flex min-h-9 flex-wrap content-center gap-1.5 py-2">{event.languages.map((language) => <Badge key={language} variant="outline" className="border-dap-border-soft px-1.5 py-0.5 text-[8px]">{language}</Badge>)}</div>
                    <div className="flex min-h-9 items-center justify-between gap-2 border-t border-dap-border-soft pt-2"><span className="flex items-center gap-1 text-[9px] text-muted-foreground"><Clock3 size={13} />{event.time}</span><Button variant="ghost" size="sm" onClick={() => openTickets(event)}>from {formatNaira(Math.min(...event.ticketTiers.map((tier) => tier.price)))} <ArrowRight size={13} /></Button></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex min-h-48 flex-col items-center justify-center gap-3 border-2 border-dashed border-dap-text-soft text-center text-muted-foreground"><Search size={21} /><p className="text-xs">No experiences found. Try another search.</p><Button variant="ghost" size="sm" onClick={() => setQuery("")}>Clear search</Button></div>
          )}
        </section>

        <section id="for-pros" className="mt-14 grid gap-4 border-2 border-foreground bg-secondary p-4 shadow-[4px_4px_0_var(--foreground)] sm:grid-cols-[48px_1fr_auto] sm:items-center sm:p-6">
          <span className="grid size-11 place-items-center border-2 border-foreground bg-primary"><Languages size={21} /></span>
          <div><p className="font-mono text-[8px] text-muted-foreground">{content.proEyebrow}</p><h2 className="mt-1 text-xl font-bold leading-tight">{content.proTitle}<br /><em className="font-serif font-semibold">{content.proEmphasis}</em></h2><p className="mt-1 text-[10px] text-muted-foreground">{content.proDescription}</p></div>
          <Button
            type="button"
            variant="accent"
            size="sm"
            onClick={() => {
              setFeedbackOpen(true);
              setFeedbackSent(false);
              setFeedbackError("");
            }}
          >
            Send feedback <ArrowRight size={14} />
          </Button>
        </section>

        <section id="contact" className="mt-14 scroll-mt-5" aria-labelledby="contact-title">
          <p className="flex items-center gap-2 font-mono text-[9px] tracking-wider text-muted-foreground"><span className="size-2 border border-foreground bg-accent" />CONTACT</p>
          <h2 id="contact-title" className="mt-2 text-[28px] font-bold leading-tight tracking-tight sm:text-3xl">Say hello.</h2>
          <p className="mt-2 max-w-xl text-xs leading-5 text-muted-foreground">Questions about a seat, a collaboration, or the next gathering. Write, message, or find us on social.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <a className="flex items-center gap-3 border-2 border-foreground bg-card p-4 shadow-[3px_3px_0_var(--foreground)]" href={`mailto:${content.contactEmail}`}>
              <span className="grid size-10 shrink-0 place-items-center border-2 border-foreground bg-primary"><Mail size={18} /></span>
              <span><span className="block font-mono text-[8px] tracking-wide text-muted-foreground">EMAIL</span><strong className="mt-1 block text-sm">{content.contactEmail}</strong></span>
            </a>
            <a className="flex items-center gap-3 border-2 border-foreground bg-card p-4 shadow-[3px_3px_0_var(--foreground)]" href={`https://wa.me/${content.contactWhatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
              <span className="grid size-10 shrink-0 place-items-center border-2 border-foreground bg-secondary text-xs font-bold">WA</span>
              <span><span className="block font-mono text-[8px] tracking-wide text-muted-foreground">WHATSAPP</span><strong className="mt-1 block text-sm">{content.contactWhatsapp}</strong></span>
            </a>
            <a className="flex items-center gap-3 border-2 border-foreground bg-card p-4 shadow-[3px_3px_0_var(--foreground)]" href={`https://www.instagram.com/${content.instagramHandle.replace(/^@/, "")}/`} target="_blank" rel="noreferrer">
              <span className="grid size-10 shrink-0 place-items-center border-2 border-foreground bg-accent text-[10px] font-bold">IG</span>
              <span><span className="block font-mono text-[8px] tracking-wide text-muted-foreground">INSTAGRAM</span><strong className="mt-1 block text-sm">@{content.instagramHandle.replace(/^@/, "")}</strong></span>
            </a>
            <a className="flex items-center gap-3 border-2 border-foreground bg-card p-4 shadow-[3px_3px_0_var(--foreground)]" href={`https://www.tiktok.com/@${encodeURIComponent(content.tiktokHandle.replace(/^@/, ""))}`} target="_blank" rel="noreferrer">
              <span className="grid size-10 shrink-0 place-items-center border-2 border-foreground bg-foreground text-[10px] font-bold text-card">TT</span>
              <span><span className="block font-mono text-[8px] tracking-wide text-muted-foreground">TIKTOK</span><strong className="mt-1 block text-sm">@{content.tiktokHandle.replace(/^@/, "")}</strong></span>
            </a>
          </div>
        </section>

        <footer className="mt-10 flex min-h-20 flex-wrap items-center gap-3 border-t-2 border-foreground py-4">
          <a className="flex items-center gap-2 text-lg font-bold" href="#top"><BrandLogo size={28} />{content.brandName}<span className="text-accent">.</span></a>
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
          <iframe
            title="Join our community form"
            src={createWithFormUrl}
            className="h-[min(70dvh,720px)] w-full border-0 bg-card"
            loading="lazy"
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={feedbackOpen}
        onOpenChange={(open) => {
          setFeedbackOpen(open);
          if (!open) {
            setFeedbackError("");
            setFeedbackBusy(false);
          }
        }}
      >
        <DialogContent className="p-0">
          {feedbackSent ? (
            <div className="p-5 text-center sm:p-6">
              <span className="mx-auto grid size-11 place-items-center border-2 border-foreground bg-primary"><Mail size={21} /></span>
              <p className="mt-4 font-mono text-[9px] text-muted-foreground">MESSAGE SENT</p>
              <DialogTitle className="mt-1 text-2xl font-bold">Merci.</DialogTitle>
              <DialogDescription className="mx-auto mt-2 max-w-xs text-xs leading-5 text-muted-foreground">
                Your feedback reached {content.contactEmail}. We&apos;ll reply if a response is needed.
              </DialogDescription>
              <Button type="button" className="mt-5 w-full" onClick={() => setFeedbackOpen(false)}>Close</Button>
            </div>
          ) : (
            <form
              className="space-y-4 p-4 sm:p-5"
              onSubmit={async (event) => {
                event.preventDefault();
                setFeedbackBusy(true);
                setFeedbackError("");
                try {
                  const response = await fetch("/api/contact", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: feedbackName.trim(),
                      email: feedbackEmail.trim(),
                      subject: feedbackSubject.trim(),
                      message: feedbackMessage.trim(),
                    }),
                  });
                  const result = await response.json() as { error?: string };
                  if (!response.ok) throw new Error(result.error || "Unable to send your message.");
                  setFeedbackSent(true);
                  setFeedbackName("");
                  setFeedbackEmail("");
                  setFeedbackSubject("");
                  setFeedbackMessage("");
                } catch (reason) {
                  setFeedbackError(reason instanceof Error ? reason.message : "Unable to send your message.");
                } finally {
                  setFeedbackBusy(false);
                }
              }}
            >
              <div className="pr-8">
                <p className="font-mono text-[8px] text-muted-foreground">FEEDBACK · SUGGESTIONS · INQUIRY</p>
                <DialogTitle className="mt-1 text-xl font-bold">Send us a message.</DialogTitle>
                <DialogDescription className="mt-1 text-xs text-muted-foreground">
                  Share feedback, a suggestion, or an inquiry. It goes straight to {content.contactEmail}.
                </DialogDescription>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-[10px] font-semibold">Your name
                  <Input autoComplete="name" required value={feedbackName} onChange={(event) => setFeedbackName(event.target.value)} />
                </label>
                <label className="grid gap-1 text-[10px] font-semibold">Email
                  <Input autoComplete="email" type="email" required value={feedbackEmail} onChange={(event) => setFeedbackEmail(event.target.value)} />
                </label>
              </div>
              <label className="grid gap-1 text-[10px] font-semibold">Subject
                <Input required maxLength={120} value={feedbackSubject} onChange={(event) => setFeedbackSubject(event.target.value)} placeholder="Feedback, suggestion, or inquiry" />
              </label>
              <label className="grid gap-1 text-[10px] font-semibold">Message
                <Textarea required rows={5} maxLength={4000} value={feedbackMessage} onChange={(event) => setFeedbackMessage(event.target.value)} placeholder="Tell us what’s on your mind…" />
              </label>
              {feedbackError ? <p role="alert" className="text-[10px] text-accent-foreground">{feedbackError}</p> : null}
              <Button className="w-full" type="submit" disabled={feedbackBusy}>
                {feedbackBusy ? "Sending…" : "Send message"} <ArrowRight size={15} />
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedEvent)} onOpenChange={(open) => { if (!open) { setSelectedEvent(null); setOrderComplete(false); setCheckoutUrl(""); } }}>
        {selectedEvent && <DialogContent className="p-0">
          <div className="relative h-36 border-b-2 border-foreground bg-cover bg-center" style={{ backgroundImage: `linear-gradient(0deg,rgb(var(--dap-overlay-rgb)/.7),transparent 80%),url("${eventImages[selectedImageIndex] ?? selectedEvent.image}")` }}><p className="absolute bottom-3 left-4 font-mono text-[9px] text-card">{selectedEvent.date} · {selectedEvent.time}</p></div>
          {!orderComplete && eventImages.length > 1 && <div className="flex gap-2 overflow-x-auto border-b border-dap-border-muted p-3">{eventImages.map((image, index) => <button key={`${image.slice(0, 30)}-${index}`} type="button" aria-label={`View event photo ${index + 1}`} aria-pressed={selectedImageIndex === index} onClick={() => setSelectedImageIndex(index)} className={`size-14 shrink-0 border-2 bg-cover bg-center ${selectedImageIndex === index ? "border-foreground shadow-[2px_2px_0_var(--foreground)]" : "border-dap-border-muted"}`} style={{ backgroundImage: `url("${image}")` }} />)}</div>}
          {orderComplete ? <div className="p-5 text-center sm:p-6">
            <span className="mx-auto grid size-11 place-items-center border-2 border-foreground bg-primary"><Ticket size={21} /></span><p className="mt-4 font-mono text-[9px] text-muted-foreground">SECURE PAYSTACK CHECKOUT</p><DialogTitle className="mt-1 text-2xl font-bold">Complete your booking.</DialogTitle><DialogDescription className="mx-auto mt-2 max-w-xs text-xs leading-5 text-muted-foreground">Your ticket is reserved while Paystack confirms payment. We&apos;ll email the QR ticket after confirmation.</DialogDescription>
            <div className="my-5 flex justify-between border-y border-dap-border-muted py-3 text-sm"><span>Order total</span><strong>{formatNaira(ticketPrice * quantity)}</strong></div><Button asChild className="w-full"><a href={checkoutUrl}>Continue to Paystack <ArrowRight size={15} /></a></Button>
          </div> : <form className="space-y-4 p-4 sm:p-5" onSubmit={submitCheckout}>
            <div><p className="font-mono text-[8px] uppercase text-muted-foreground">{selectedEvent.category} · {selectedEvent.area}</p><DialogTitle className="mt-1 pr-9 text-xl font-bold leading-tight">{selectedEvent.title}</DialogTitle><DialogDescription className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground"><MapPin size={13} />{selectedEvent.venue}</DialogDescription></div>
            <fieldset><legend className="mb-2 font-mono text-[8px] text-muted-foreground">PICK YOUR PASS</legend><div className="grid gap-2">
              {selectedEvent.ticketTiers.map((tier) => { const remaining = tierRemaining(selectedEvent, tier.id); return <button key={tier.id} type="button" disabled={remaining === 0} aria-pressed={selectedTier?.id === tier.id} onClick={() => { setSelectedTierId(tier.id); setQuantity((count) => Math.min(count, Math.max(remaining, 1))); setOrderError(""); }} className={`flex min-h-14 items-center gap-3 border-2 px-3 text-left disabled:cursor-not-allowed disabled:opacity-50 ${selectedTier?.id === tier.id ? "border-foreground bg-success shadow-[2px_2px_0_var(--foreground)]" : "border-dap-border-muted bg-card"}`}><span className="grid size-4 place-items-center rounded-full border border-foreground">{selectedTier?.id === tier.id && <span className="size-2 rounded-full bg-foreground" />}</span><span className="flex-1"><strong className="block text-[10px]">{tier.name}</strong><small className="text-[9px] text-muted-foreground">{tier.description} · {remaining ? `${remaining} left` : "Sold out"}</small></span><strong className="text-xs">{formatNaira(tier.price)}</strong></button>; })}
            </div></fieldset>
            <div className="flex items-center justify-between border-b border-dap-border-muted pb-3"><div><strong className="block text-[10px]">Tickets</strong><small className="text-[9px] text-muted-foreground">{selectedTierRemaining} available · max 6 per order</small></div><div className="flex items-center gap-3"><Button type="button" variant="outline" size="icon" aria-label="Remove one ticket" disabled={quantity <= 1} onClick={() => setQuantity((count) => Math.max(1, count - 1))}><Minus size={14} /></Button><span aria-live="polite" className="min-w-3 text-center text-xs">{quantity}</span><Button type="button" variant="outline" size="icon" aria-label="Add one ticket" disabled={quantity >= Math.min(6, selectedTierRemaining)} onClick={() => setQuantity((count) => Math.min(6, selectedTierRemaining, count + 1))}><Plus size={14} /></Button></div></div>
            <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-[10px] font-semibold">Your name <Input autoComplete="name" required value={buyerName} onChange={(event) => setBuyerName(event.target.value)} /></label><label className="grid gap-1 text-[10px] font-semibold">Email for your ticket <Input autoComplete="email" type="email" required value={buyerEmail} onChange={(event) => setBuyerEmail(event.target.value)} /></label></div>
            <div className="flex items-center justify-between text-xs"><span>Total <small className="text-[9px] text-muted-foreground"> · fees at checkout</small></span><strong className="text-base">{formatNaira(ticketPrice * quantity)}</strong></div>
            {orderError && <p role="alert" className="text-[10px] text-accent-foreground">{orderError}</p>}
            <Button className="w-full" type="submit" disabled={selectedTierRemaining === 0 || checkoutBusy}>{checkoutBusy ? "Opening Paystack…" : selectedTierRemaining ? "Continue to Paystack" : "Sold out"} <ArrowRight size={15} /></Button>
            <p className="text-center text-[8px] text-muted-foreground">Secure hosted payment · ticket QR emailed after confirmation</p>
          </form>}
        </DialogContent>}
      </Dialog>
    </main>
  );
}