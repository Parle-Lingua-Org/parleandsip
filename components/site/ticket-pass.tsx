"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import LogoUse from "@/app/logo.webp";

export type TicketPassData = {
  buyerName: string;
  orderReference: string;
  eventTitle: string;
  startsAt: string;
  venueName: string;
  area: string;
  ticketNumber: number;
  ticketName: string;
  ticketCode: string;
  status?: string;
};

function formatParts(startsAt: string) {
  const date = new Date(startsAt);
  return {
    dateLabel: new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "2-digit", timeZone: "Africa/Lagos" }).format(date).toUpperCase(),
    timeLabel: new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Africa/Lagos" }).format(date).toUpperCase(),
    weekday: new Intl.DateTimeFormat("en-NG", { weekday: "long", timeZone: "Africa/Lagos" }).format(date),
  };
}

export function TicketPass({ ticket }: { ticket: TicketPassData }) {
  const [qrUrl, setQrUrl] = useState("");
  const { dateLabel, timeLabel, weekday } = formatParts(ticket.startsAt);
  const ticketNo = String(ticket.ticketNumber).padStart(2, "0");

  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(ticket.ticketCode, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 420,
      color: { dark: "#192637", light: "#FFFFFF" },
    }).then((url) => {
      if (active) setQrUrl(url);
    });
    return () => { active = false; };
  }, [ticket.ticketCode]);

  return (
    <article className="relative mx-auto w-full max-w-[380px] overflow-hidden rounded-[28px] bg-card shadow-[0_18px_50px_rgba(25,38,55,.18)]">
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
        <h1 className="text-[15px] font-bold leading-tight text-[#192637]">{ticket.eventTitle}</h1>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[12px]">
          <div><p className="text-[8px] font-semibold tracking-wide text-[#526173]">DATE</p><p className="mt-1 font-bold text-[#192637]">{dateLabel}</p></div>
          <div><p className="text-[8px] font-semibold tracking-wide text-[#526173]">DOORS</p><p className="mt-1 font-bold text-[#192637]">{timeLabel}</p></div>
          <div><p className="text-[8px] font-semibold tracking-wide text-[#526173]">VENUE</p><p className="mt-1 font-bold text-[#192637]">{ticket.venueName}{ticket.area ? `, ${ticket.area}` : ""}</p></div>
          <div><p className="text-[8px] font-semibold tracking-wide text-[#526173]">ORDER</p><p className="mt-1 font-bold text-[#192637]">{ticket.orderReference}</p></div>
          <div><p className="text-[8px] font-semibold tracking-wide text-[#526173]">PASS TYPE</p><p className="mt-1 font-bold text-[#192637]">{ticket.ticketName}</p></div>
          <div><p className="text-[8px] font-semibold tracking-wide text-[#526173]">DAY</p><p className="mt-1 text-[#192637]">{weekday}</p></div>
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

      <div className="space-y-3 px-6 pb-5 pt-3 text-center">
        <p className="text-[10px] font-bold tracking-[0.08em] text-[#192637]">SHOW THIS QR CODE AT THE DOOR</p>
        <div className="relative mx-auto size-[148px]">
          {qrUrl ? (
            <>
              <img src={qrUrl} alt="Ticket check-in QR code" className="size-full object-contain" />
              <span className="pointer-events-none absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center">
                <Image src={LogoUse} alt="" width={30} height={30} className="object-contain" />
              </span>
            </>
          ) : (
            <p className="grid size-full place-items-center text-[10px] text-[#526173]">Preparing QR…</p>
          )}
        </div>
        {ticket.status === "checked_in" ? (
          <p className="text-[10px] font-semibold text-dap-green">Already checked in</p>
        ) : (
          <p className="text-[10px] text-[#526173]">Parlez et profitez !</p>
        )}
      </div>

      <div className="flex items-center justify-between bg-[#192637] px-6 py-3.5 text-[10px] font-bold tracking-wide text-white">
        <span>GUEST: {ticket.buyerName.toUpperCase()}</span>
        <span>NO. {ticketNo}</span>
      </div>
    </article>
  );
}
