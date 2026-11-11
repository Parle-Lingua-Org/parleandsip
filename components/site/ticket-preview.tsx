"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { sampleTicketPreview, type TicketPdfInput } from "@/lib/ticket-pdf-shared";
import LogoUse from "@/app/logo.webp";

function formatParts(startsAt: string) {
  const date = new Date(startsAt);
  return {
    dateLabel: new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "2-digit", timeZone: "Africa/Lagos" }).format(date).toUpperCase(),
    timeLabel: new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Africa/Lagos" }).format(date).toUpperCase(),
    weekday: new Intl.DateTimeFormat("en-NG", { weekday: "long", timeZone: "Africa/Lagos" }).format(date),
  };
}

export function TicketPreview() {
  const [draft, setDraft] = useState<TicketPdfInput>(sampleTicketPreview);
  const [revision, setRevision] = useState(0);
  const parts = formatParts(draft.startsAt);
  const ticketNo = String(draft.ticketNumber).padStart(2, "0");
  const pdfQuery = useMemo(() => {
    const params = new URLSearchParams({
      buyerName: draft.buyerName,
      orderReference: draft.orderReference,
      eventTitle: draft.eventTitle,
      startsAt: draft.startsAt,
      venueName: draft.venueName,
      area: draft.area,
      ticketNumber: String(draft.ticketNumber),
      ticketName: draft.ticketName,
      ticketCode: draft.ticketCode,
      v: String(revision),
    });
    return `/api/ticket-preview/pdf?${params.toString()}`;
  }, [draft, revision]);

  function update<K extends keyof TicketPdfInput>(key: K, value: TicketPdfInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="min-h-screen bg-[#e8ecf2] px-4 py-8 text-foreground sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="h-fit space-y-4 border-0 p-4 shadow-[0_12px_40px_rgba(25,38,55,.12)]">
          <div>
            <p className="font-mono text-[9px] tracking-wide text-muted-foreground">DESIGN ONLY</p>
            <h1 className="mt-1 text-2xl font-bold">Ticket preview</h1>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Boarding-pass shape with side notches and the Parle & Sip logo. Temporary page.</p>
          </div>
          <label className="grid gap-1 text-[10px] font-semibold">Guest name<Input value={draft.buyerName} onChange={(event) => update("buyerName", event.target.value)} /></label>
          <label className="grid gap-1 text-[10px] font-semibold">Event title<Input value={draft.eventTitle} onChange={(event) => update("eventTitle", event.target.value)} /></label>
          <label className="grid gap-1 text-[10px] font-semibold">Ticket type<Input value={draft.ticketName} onChange={(event) => update("ticketName", event.target.value)} /></label>
          <label className="grid gap-1 text-[10px] font-semibold">Venue<Input value={draft.venueName} onChange={(event) => update("venueName", event.target.value)} /></label>
          <label className="grid gap-1 text-[10px] font-semibold">Area<Input value={draft.area} onChange={(event) => update("area", event.target.value)} /></label>
          <label className="grid gap-1 text-[10px] font-semibold">Order reference<Input value={draft.orderReference} onChange={(event) => update("orderReference", event.target.value)} /></label>
          <label className="grid gap-1 text-[10px] font-semibold">Ticket number<Input type="number" min={1} value={draft.ticketNumber} onChange={(event) => update("ticketNumber", Number(event.target.value) || 1)} /></label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setRevision((value) => value + 1)}><RefreshCw size={14} /> Refresh PDF</Button>
            <Button asChild variant="outline"><a href={pdfQuery} target="_blank" rel="noreferrer"><Download size={14} /> Open PDF</a></Button>
          </div>
        </Card>

        <div className="space-y-8">
          <section className="mx-auto w-full max-w-[380px]">
            <p className="mb-4 font-mono text-[9px] tracking-wide text-muted-foreground">HTML TICKET SHAPE</p>
            <article className="relative overflow-hidden rounded-[28px] bg-card shadow-[0_18px_50px_rgba(25,38,55,.18)]">
              <div className="bg-[#192637] px-6 pb-6 pt-5 text-card">
                <div className="mx-auto grid size-12 place-items-center rounded-full bg-card p-1.5">
                  <Image src={LogoUse} alt="Parle & Sip" width={36} height={36} className="object-contain" />
                </div>
                <p className="mx-auto mt-3 w-fit rounded-full bg-card px-3 py-1 text-[9px] font-bold tracking-[0.14em] text-[#192637]">EVENT PASS</p>
                <div className="mt-8 flex flex-col items-center gap-3.5">
                  <p className="text-center text-[28px] font-bold leading-none tracking-[0.12em] text-white">PARLE & SIP</p>
                  <p className="rounded-full border border-[#be8f3f]/55 bg-[#be8f3f]/15 px-3.5 py-1 text-center text-[9px] font-semibold tracking-[0.08em] text-[#be8f3f]">
                    BIGGEST FRENCH GATHERING IN ABUJA
                  </p>
                </div>
              </div>

              <div className="space-y-4 px-6 py-5">
                <h2 className="text-[15px] font-bold leading-tight text-[#192637]">{draft.eventTitle}</h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[12px]">
                  <div><p className="text-[8px] font-semibold tracking-wide text-[#526173]">DATE</p><p className="mt-1 font-bold text-[#192637]">{parts.dateLabel}</p></div>
                  <div><p className="text-[8px] font-semibold tracking-wide text-[#526173]">DOORS</p><p className="mt-1 font-bold text-[#192637]">{parts.timeLabel}</p></div>
                  <div><p className="text-[8px] font-semibold tracking-wide text-[#526173]">VENUE</p><p className="mt-1 font-bold text-[#192637]">{draft.venueName}{draft.area ? `, ${draft.area}` : ""}</p></div>
                  <div><p className="text-[8px] font-semibold tracking-wide text-[#526173]">ORDER</p><p className="mt-1 font-bold text-[#192637]">{draft.orderReference}</p></div>
                  <div><p className="text-[8px] font-semibold tracking-wide text-[#526173]">PASS TYPE</p><p className="mt-1 font-bold text-[#192637]">{draft.ticketName}</p></div>
                  <div><p className="text-[8px] font-semibold tracking-wide text-[#526173]">DAY</p><p className="mt-1 text-[#192637]">{parts.weekday}</p></div>
                </div>
              </div>

              <div className="relative h-8">
                <span className="absolute -left-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-[#e8ecf2]" />
                <span className="absolute -right-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-[#e8ecf2]" />
                <span className="absolute inset-x-6 top-1/2 border-t border-dashed border-[#9aa6b5]" />
                <span className="absolute left-1/2 top-1/2 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#192637]">
                  <Image src={LogoUse} alt="" width={14} height={14} className="object-contain" />
                </span>
              </div>

              <div className="space-y-4 px-6 pb-5 pt-3 text-center">
                <p className="text-[10px] font-bold tracking-[0.08em] text-[#192637]">SHOW THIS QR CODE AT THE DOOR</p>
                <div className="relative mx-auto size-[148px]">
                  <div className="grid size-full place-items-center bg-[repeating-linear-gradient(45deg,#192637_0_2px,transparent_2px_8px)]">
                    <Image src={LogoUse} alt="Parle & Sip" width={30} height={30} className="object-contain" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-[#192637] px-6 py-3.5 text-[10px] font-bold tracking-wide text-white">
                <span>GUEST: {draft.buyerName.toUpperCase()}</span>
                <span>NO. {ticketNo}</span>
              </div>
            </article>
          </section>

          <section>
            <p className="mb-3 font-mono text-[9px] tracking-wide text-muted-foreground">ACTUAL PDF OUTPUT</p>
            <iframe title="Ticket PDF preview" src={pdfQuery} className="h-[760px] w-full rounded-2xl border-0 bg-white shadow-[0_18px_50px_rgba(25,38,55,.14)]" />
          </section>
        </div>
      </div>
    </main>
  );
}
