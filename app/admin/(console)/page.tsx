"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, CircleDollarSign, ClipboardList, Ticket, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatNaira } from "@/lib/site-data";
import { useSiteStore } from "@/lib/site-store";

export default function AdminOverviewPage() {
  const { data } = useSiteStore();
  const totalRevenue = data.orders.reduce((sum, order) => sum + order.total, 0);
  const ticketCount = data.orders.reduce((sum, order) => sum + order.quantity, 0);
  const metrics = [
    { label: "Listed events", value: data.events.length, icon: CalendarDays },
    { label: "Orders recorded", value: data.orders.length, icon: ClipboardList },
    { label: "Tickets reserved", value: ticketCount, icon: Ticket },
    { label: "Demo ticket value", value: formatNaira(totalRevenue), icon: CircleDollarSign },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-[9px] tracking-wide text-muted-foreground">YOUR COMMUNITY, AT A GLANCE</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Overview</h1></div><Badge variant="accent">LOCAL DEMO · NO BACKEND</Badge></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, icon: Icon }) => <Card key={label} className="p-4 shadow-[3px_3px_0_var(--foreground)]"><div className="flex items-center justify-between"><p className="text-[10px] text-muted-foreground">{label}</p><Icon size={16} className="text-dap-green" /></div><p className="mt-3 text-2xl font-bold">{value}</p></Card>)}</div>
      <div className="grid items-start gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Card className="overflow-hidden shadow-[4px_4px_0_var(--foreground)]"><div className="flex items-center justify-between gap-3 border-b-2 border-foreground p-4"><div><h2 className="font-bold">Recent ticket buyers</h2><p className="mt-1 text-[10px] text-muted-foreground">Captured from demo checkout on this device.</p></div><Button asChild size="sm" variant="outline"><Link href="/admin/orders">View all <ArrowRight size={13} /></Link></Button></div>
          {data.orders.length ? <div className="divide-y divide-dap-border-muted">{data.orders.slice(0, 5).map((order) => <div key={order.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"><div><p className="text-xs font-semibold">{order.buyerName}</p><p className="mt-1 text-[10px] text-muted-foreground">{order.eventTitle} · {order.ticketType} · {order.quantity} ticket{order.quantity === 1 ? "" : "s"}</p></div><Badge variant="secondary">{formatNaira(order.total)}</Badge></div>)}</div> : <div className="grid min-h-40 place-items-center p-5 text-center"><div><UsersRound className="mx-auto text-muted-foreground" /><p className="mt-3 text-xs font-semibold">No ticket buyers yet</p><p className="mt-1 text-[10px] text-muted-foreground">New demo orders will show here.</p></div></div>}
        </Card>
        <Card className="overflow-hidden shadow-[4px_4px_0_var(--foreground)]"><div className="flex items-center justify-between gap-3 border-b-2 border-foreground p-4"><div><h2 className="font-bold">Upcoming meetups</h2><p className="mt-1 text-[10px] text-muted-foreground">Currently published events.</p></div><Button asChild size="sm"><Link href="/admin/events">Manage <ArrowRight size={13} /></Link></Button></div>
          <div className="divide-y divide-dap-border-muted">{data.events.slice(0, 5).map((event) => <div key={event.id} className="flex items-center justify-between gap-3 px-4 py-3"><div className="min-w-0"><p className="truncate text-xs font-semibold">{event.title}</p><p className="mt-1 text-[10px] text-muted-foreground">{event.dateShort} · {event.area} · {event.ticketTiers.length} ticket types</p></div><span className="shrink-0 text-[10px] font-semibold">from {formatNaira(Math.min(...event.ticketTiers.map((tier) => tier.price)))}</span></div>)}</div>
        </Card>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex flex-wrap items-center justify-between gap-4 bg-secondary p-4"><div><p className="font-mono text-[8px] text-muted-foreground">QUICK ACTION</p><p className="mt-1 text-sm font-bold">Scan tickets at the door</p><p className="mt-1 text-[10px] text-muted-foreground">Use the camera or paste a ticket code from the QR email.</p></div><Button asChild variant="outline" size="sm"><Link href="/admin/check-in">Open scanner <ArrowRight size={14} /></Link></Button></Card>
        <Card className="flex flex-wrap items-center justify-between gap-4 bg-secondary p-4"><div><p className="font-mono text-[8px] text-muted-foreground">QUICK ACTION</p><p className="mt-1 text-sm font-bold">Refresh the look of Parle & Sip</p><p className="mt-1 text-[10px] text-muted-foreground">Update the brand, footer, favicon and shared palette.</p></div><Button asChild variant="outline" size="sm"><Link href="/admin/content">Edit site content <ArrowRight size={14} /></Link></Button></Card>
      </div>
    </div>
  );
}