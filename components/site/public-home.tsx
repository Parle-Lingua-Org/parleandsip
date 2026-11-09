"use client";

import { useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  CalendarDays,
  Clock3,
  Globe2,
  Languages,
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
import { formatNaira, type EventItem } from "@/lib/site-data";
import { useSiteStore } from "@/lib/site-store";

const categoryOptions = ["All experiences", "French conversation", "Francophone culture", "Art & creativity", "Food & gastronomy", "Games & conversation"];
const areaOptions = ["All Lagos", "Yaba", "Victoria Island", "Ikeja", "Ikoyi", "Lekki"];

export function PublicHome() {
  const { data, addOrder } = useSiteStore();
  const { content } = data;
  const [category, setCategory] = useState("All experiences");
  const [area, setArea] = useState("All Lagos");
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedTierId, setSelectedTierId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderError, setOrderError] = useState("");

  const featuredEvent = data.events.find((event) => event.id === content.featuredEventId) ?? data.events[0];
  const visibleEvents = data.events.filter((event) => {
    const categoryMatch = category === "All experiences" || event.category === category;
    const areaMatch = area === "All Lagos" || event.area === area;
    const searchMatch = !query.trim() || `${event.title} ${event.host} ${event.category} ${event.venue} ${event.area} ${event.languages.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase());
    return categoryMatch && areaMatch && searchMatch;
  });
  const selectedTier = selectedEvent?.ticketTiers.find((tier) => tier.id === selectedTierId) ?? selectedEvent?.ticketTiers[0];
  const eventImages = selectedEvent ? [selectedEvent.image, ...selectedEvent.gallery].filter((image, index, list) => Boolean(image) && list.indexOf(image) === index) : [];
  const remainingForTier = (event: EventItem, tierId: string) => {
    const tier = event.ticketTiers.find((item) => item.id === tierId);
    if (!tier) return 0;
    const reserved = data.orders.filter((order) => order.eventId === event.id && order.ticketType === tier.name).reduce((sum, order) => sum + order.quantity, 0);
    return Math.max(0, tier.capacity - reserved);
  };
  const selectedTierRemaining = selectedEvent && selectedTier ? remainingForTier(selectedEvent, selectedTier.id) : 0;
  const ticketPrice = selectedTier?.price ?? 0;

  function openTickets(event: EventItem) {
    setSelectedEvent(event);
    setSelectedImageIndex(0);
    setSelectedTierId(event.ticketTiers.find((tier) => remainingForTier(event, tier.id) > 0)?.id ?? event.ticketTiers[0]?.id ?? "");
    setQuantity(1);
    setBuyerName("");
    setBuyerEmail("");
    setOrderComplete(false);
    setOrderError("");
  }

  function submitDemoOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEvent) return;
    if (!selectedTier || quantity > selectedTierRemaining) {
      setOrderError("That ticket type has sold out. Choose another option.");
      return;
    }
    addOrder({
      id: crypto.randomUUID(),
      eventId: selectedEvent.id,
      eventTitle: selectedEvent.title,
      buyerName: buyerName.trim(),
      buyerEmail: buyerEmail.trim(),
      ticketType: selectedTier?.name ?? "General admission",
      quantity,
      total: ticketPrice * quantity,
      purchasedAt: new Date().toISOString(),
    });
    setOrderComplete(true);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-8 items-center justify-between gap-3 bg-foreground px-4 text-[9px] font-mono tracking-wider text-primary sm:px-8 lg:px-[max(2rem,calc((100vw-1200px)/2))]">
        <span className="truncate">{content.announcement}</span>
        <span className="flex shrink-0 items-center gap-1.5 text-card"><MapPin size={13} /> {content.footerLocation} <ArrowDownRight size={14} /></span>
      </div>

      <header className="relative z-20 flex h-[68px] items-center gap-8 border-b-2 border-foreground px-4 sm:px-8 lg:px-[max(2rem,calc((100vw-1200px)/2))]">
          <a className="flex shrink-0 items-center gap-2 text-xl font-bold tracking-tight" href="#top" aria-label={`${content.brandName} home`}>
          {content.logoImage ? <img src={content.logoImage} alt="" className="size-8 border-2 border-foreground object-cover" /> : <span className="grid size-8 place-items-center border-2 border-foreground bg-primary"><Languages size={19} /></span>}{content.brandName}<span className="text-accent">.</span>
        </a>
        <button className="ml-auto grid size-9 place-items-center border-2 border-foreground bg-primary md:hidden" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
        <nav className={`${menuOpen ? "absolute left-0 right-0 top-[66px] flex border-b-2 border-foreground bg-background px-4 shadow-[0_5px_0_var(--foreground)] md:static md:h-full md:border-0 md:bg-transparent md:p-0 md:shadow-none" : "hidden md:flex"} flex-col items-stretch gap-0 md:ml-4 md:flex-row md:items-center md:gap-7`} aria-label="Main navigation">
          <a className="border-b border-dap-border-soft py-3 text-xs font-semibold md:border-0 md:py-0" href="#events" onClick={() => setMenuOpen(false)}>{content.navExplore}</a>
          <a className="border-b border-dap-border-soft py-3 text-xs text-muted-foreground md:border-0 md:py-0" href="#community" onClick={() => setMenuOpen(false)}>{content.navCommunity}</a>
          <a className="py-3 text-xs text-muted-foreground md:py-0" href="#for-pros" onClick={() => setMenuOpen(false)}>{content.navPros}</a>
        </nav>
        <Button asChild size="sm" variant="outline" className="ml-auto hidden md:inline-flex"><a href="#for-pros">{content.proCta} <ArrowRight size={14} /></a></Button>
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
            {featuredEvent && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(180deg,rgb(var(--dap-overlay-rgb)/.04) 18%,rgb(var(--dap-overlay-rgb)/.78) 100%),url("${content.heroImage || featuredEvent.image}")` }} />}
            <Badge className="absolute left-4 top-4 gap-1.5"><Sparkles size={12} /> THIS WEEK&apos;S PICK</Badge>
            <div className="absolute inset-x-4 bottom-4 sm:inset-x-5 sm:bottom-5">
              <p className="font-mono text-[9px] uppercase tracking-wide text-dap-feature-copy">{featuredEvent?.category ?? "Community meetup"} <span className="px-1 text-primary">·</span> {featuredEvent?.area ?? "Lagos"}</p>
              <h2 className="mt-2 text-3xl font-bold leading-tight">{featuredEvent?.title ?? "Your next conversation starts here"}</h2>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 font-mono text-[9px]"><CalendarDays size={14} /> {featuredEvent?.dateShort ?? "LAGOS"} · {featuredEvent?.time ?? "SOON"}</span>
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
              {data.events.slice(0, 3).map((event) => <a key={event.id} className="grid grid-cols-[36px_35px_1fr] items-center gap-2 border-t border-dap-border-soft pt-2 first:border-0 first:pt-0" href="#events">
                <strong className="text-xl leading-none">{event.dateShort.slice(-2)}</strong><span className="font-mono text-[7px] leading-tight text-muted-foreground">{event.dateShort.slice(0, 3)}<br />{event.date.slice(0, 3).toUpperCase()}</span><small className="truncate text-[9px]">{event.title}</small>
              </a>)}
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
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filter by meetup type">{categoryOptions.map((option) => <Button key={option} variant={category === option ? "secondary" : "outline"} size="sm" className="shrink-0" aria-pressed={category === option} onClick={() => setCategory(option)}>{option}</Button>)}</div>
            <label className="flex min-h-9 shrink-0 items-center gap-2 border-2 border-foreground bg-card px-2 text-xs"><MapPin size={14} /><select className="max-w-36 bg-transparent outline-none" value={area} onChange={(event) => setArea(event.target.value)}>{areaOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          </div>
          {visibleEvents.length ? <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleEvents.map((event) => <Card key={event.id} className="overflow-hidden shadow-[4px_4px_0_var(--foreground)]">
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
            </Card>)}
          </div> : <div className="mt-4 flex min-h-48 flex-col items-center justify-center gap-3 border-2 border-dashed border-dap-text-soft text-center text-muted-foreground"><Search size={21} /><p className="text-xs">No experiences found. Try another activity or area.</p><Button variant="ghost" size="sm" onClick={() => { setQuery(""); setCategory("All experiences"); setArea("All Lagos"); }}>Clear filters</Button></div>}
        </section>

        <section id="for-pros" className="mt-14 grid gap-4 border-2 border-foreground bg-secondary p-4 shadow-[4px_4px_0_var(--foreground)] sm:grid-cols-[48px_1fr_auto] sm:items-center sm:p-6">
          <span className="grid size-11 place-items-center border-2 border-foreground bg-primary"><Languages size={21} /></span>
          <div><p className="font-mono text-[8px] text-muted-foreground">{content.proEyebrow}</p><h2 className="mt-1 text-xl font-bold leading-tight">{content.proTitle}<br /><em className="font-serif font-semibold">{content.proEmphasis}</em></h2><p className="mt-1 text-[10px] text-muted-foreground">{content.proDescription}</p></div>
          <Button asChild variant="accent" size="sm"><a href="mailto:bonjour@parleandsip.com?subject=Create%20with%20Parle%20%26%20Sip">{content.proCta} <ArrowRight size={14} /></a></Button>
        </section>

        <footer className="mt-10 flex min-h-20 flex-wrap items-center gap-3 border-t-2 border-foreground py-4">
          <a className="flex items-center gap-2 text-lg font-bold" href="#top">{content.logoImage ? <img src={content.logoImage} alt="" className="size-7 border-2 border-foreground object-cover" /> : <span className="grid size-7 place-items-center border-2 border-foreground bg-primary"><Languages size={16} /></span>}{content.brandName}<span className="text-accent">.</span></a>
          <p className="font-serif text-xs italic text-muted-foreground">{content.footerText}</p>
          <span className="ml-auto text-right font-mono text-[8px] tracking-wide text-muted-foreground">{content.footerLocation} <span className="px-1 text-accent">●</span> {content.footerCurrency}</span>
        </footer>
      </div>

      <Dialog open={Boolean(selectedEvent)} onOpenChange={(open) => { if (!open) { setSelectedEvent(null); setOrderComplete(false); } }}>
        {selectedEvent && <DialogContent className="p-0">
          <div className="relative h-36 border-b-2 border-foreground bg-cover bg-center" style={{ backgroundImage: `linear-gradient(0deg,rgb(var(--dap-overlay-rgb)/.7),transparent 80%),url("${eventImages[selectedImageIndex] ?? selectedEvent.image}")` }}><p className="absolute bottom-3 left-4 font-mono text-[9px] text-card">{selectedEvent.date} · {selectedEvent.time}</p></div>
          {!orderComplete && eventImages.length > 1 && <div className="flex gap-2 overflow-x-auto border-b border-dap-border-muted p-3">{eventImages.map((image, index) => <button key={`${image.slice(0, 30)}-${index}`} type="button" aria-label={`View event photo ${index + 1}`} aria-pressed={selectedImageIndex === index} onClick={() => setSelectedImageIndex(index)} className={`size-14 shrink-0 border-2 bg-cover bg-center ${selectedImageIndex === index ? "border-foreground shadow-[2px_2px_0_var(--foreground)]" : "border-dap-border-muted"}`} style={{ backgroundImage: `url("${image}")` }} />)}</div>}
          {orderComplete ? <div className="p-5 text-center sm:p-6">
            <span className="mx-auto grid size-11 place-items-center border-2 border-foreground bg-primary"><Ticket size={21} /></span><p className="mt-4 font-mono text-[9px] text-muted-foreground">DEMO TICKET</p><DialogTitle className="mt-1 text-2xl font-bold">You&apos;re on the list.</DialogTitle><DialogDescription className="mx-auto mt-2 max-w-xs text-xs leading-5 text-muted-foreground">{quantity} {selectedTier?.name.toLowerCase() ?? "ticket"} {quantity === 1 ? "is" : "are"} saved for {selectedEvent.title}. No payment was collected.</DialogDescription>
            <div className="my-5 flex justify-between border-y border-dap-border-muted py-3 text-sm"><span>Demo total</span><strong>{formatNaira(ticketPrice * quantity)}</strong></div><Button className="w-full" onClick={() => { setSelectedEvent(null); setOrderComplete(false); }}>Done <ArrowRight size={15} /></Button>
          </div> : <form className="space-y-4 p-4 sm:p-5" onSubmit={submitDemoOrder}>
            <div><p className="font-mono text-[8px] uppercase text-muted-foreground">{selectedEvent.category} · {selectedEvent.area}</p><DialogTitle className="mt-1 pr-9 text-xl font-bold leading-tight">{selectedEvent.title}</DialogTitle><DialogDescription className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground"><MapPin size={13} />{selectedEvent.venue}</DialogDescription></div>
            <fieldset><legend className="mb-2 font-mono text-[8px] text-muted-foreground">PICK YOUR PASS</legend><div className="grid gap-2">
              {selectedEvent.ticketTiers.map((tier) => { const remaining = remainingForTier(selectedEvent, tier.id); return <button key={tier.id} type="button" disabled={remaining === 0} aria-pressed={selectedTier?.id === tier.id} onClick={() => { setSelectedTierId(tier.id); setQuantity((count) => Math.min(count, Math.max(remaining, 1))); setOrderError(""); }} className={`flex min-h-14 items-center gap-3 border-2 px-3 text-left disabled:cursor-not-allowed disabled:opacity-50 ${selectedTier?.id === tier.id ? "border-foreground bg-success shadow-[2px_2px_0_var(--foreground)]" : "border-dap-border-muted bg-card"}`}><span className="grid size-4 place-items-center rounded-full border border-foreground">{selectedTier?.id === tier.id && <span className="size-2 rounded-full bg-foreground" />}</span><span className="flex-1"><strong className="block text-[10px]">{tier.name}</strong><small className="text-[9px] text-muted-foreground">{tier.description} · {remaining ? `${remaining} left` : "Sold out"}</small></span><strong className="text-xs">{formatNaira(tier.price)}</strong></button>; })}
            </div></fieldset>
            <div className="flex items-center justify-between border-b border-dap-border-muted pb-3"><div><strong className="block text-[10px]">Tickets</strong><small className="text-[9px] text-muted-foreground">{selectedTierRemaining} available · max 6 per order</small></div><div className="flex items-center gap-3"><Button type="button" variant="outline" size="icon" aria-label="Remove one ticket" disabled={quantity <= 1} onClick={() => setQuantity((count) => Math.max(1, count - 1))}><Minus size={14} /></Button><span aria-live="polite" className="min-w-3 text-center text-xs">{quantity}</span><Button type="button" variant="outline" size="icon" aria-label="Add one ticket" disabled={quantity >= Math.min(6, selectedTierRemaining)} onClick={() => setQuantity((count) => Math.min(6, selectedTierRemaining, count + 1))}><Plus size={14} /></Button></div></div>
            <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-[10px] font-semibold">Your name <Input autoComplete="name" required value={buyerName} onChange={(event) => setBuyerName(event.target.value)} /></label><label className="grid gap-1 text-[10px] font-semibold">Email for your ticket <Input autoComplete="email" type="email" required value={buyerEmail} onChange={(event) => setBuyerEmail(event.target.value)} /></label></div>
            <div className="flex items-center justify-between text-xs"><span>Total <small className="text-[9px] text-muted-foreground"> · fees at checkout</small></span><strong className="text-base">{formatNaira(ticketPrice * quantity)}</strong></div>
            {orderError && <p role="alert" className="text-[10px] text-accent-foreground">{orderError}</p>}
            <Button className="w-full" type="submit" disabled={selectedTierRemaining === 0}>{selectedTierRemaining ? "Reserve tickets" : "Sold out"} <ArrowRight size={15} /></Button>
            <p className="text-center text-[8px] text-muted-foreground">Frontend demo only · no payment collected</p>
          </form>}
        </DialogContent>}
      </Dialog>
    </main>
  );
}