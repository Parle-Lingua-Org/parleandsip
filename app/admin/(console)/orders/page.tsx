"use client";

import { useMemo, useState } from "react";
import { Download, Search, Ticket, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatNaira } from "@/lib/site-data";
import { useSiteStore } from "@/lib/site-store";

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export default function AdminOrdersPage() {
  const { data } = useSiteStore();
  const [query, setQuery] = useState("");
  const orders = useMemo(() => {
    const term = query.trim().toLowerCase();
    return data.orders.filter((order) => !term || `${order.buyerName} ${order.buyerEmail} ${order.eventTitle} ${order.ticketType}`.toLowerCase().includes(term));
  }, [data.orders, query]);
  const tickets = orders.reduce((sum, order) => sum + order.quantity, 0);
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);

  function exportCsv() {
    const headers = ["Buyer", "Email", "Event", "Ticket type", "Quantity", "Total NGN", "Ordered at"];
    const rows = orders.map((order) => [order.buyerName, order.buyerEmail, order.eventTitle, order.ticketType, order.quantity, order.total, order.purchasedAt]);
    const blob = new Blob([[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "parle-and-sip-ticket-buyers.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-[9px] tracking-wide text-muted-foreground">ATTENDEE RECORDS</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Ticket buyers</h1><p className="mt-2 text-xs text-muted-foreground">Buyer details recorded by the frontend checkout preview on this device.</p></div><Button variant="outline" disabled={!orders.length} onClick={exportCsv}><Download size={14} /> Export CSV</Button></div>

      <div className="grid gap-3 sm:grid-cols-3"><Card className="p-4 shadow-[3px_3px_0_var(--foreground)]"><p className="text-[10px] text-muted-foreground">Filtered orders</p><p className="mt-2 text-2xl font-bold">{orders.length}</p></Card><Card className="p-4 shadow-[3px_3px_0_var(--foreground)]"><p className="text-[10px] text-muted-foreground">Tickets reserved</p><p className="mt-2 text-2xl font-bold">{tickets}</p></Card><Card className="p-4 shadow-[3px_3px_0_var(--foreground)]"><p className="text-[10px] text-muted-foreground">Demo order value</p><p className="mt-2 text-2xl font-bold">{formatNaira(revenue)}</p></Card></div>

      <Card className="overflow-hidden shadow-[4px_4px_0_var(--foreground)]"><div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-foreground p-4"><div><h2 className="font-bold">Order list</h2><p className="mt-1 text-[10px] text-muted-foreground">Names, contact emails, ticket choices and quantities.</p></div><label className="flex h-9 w-full items-center gap-2 border-2 border-foreground bg-card px-2.5 sm:max-w-64"><Search size={14} /><Input className="h-8 border-0 px-0 shadow-none focus-visible:ring-0" placeholder="Search buyers or events" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
        {orders.length ? <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left"><thead className="bg-secondary font-mono text-[8px] tracking-wide"><tr><th className="px-4 py-3">BUYER</th><th className="px-4 py-3">EVENT</th><th className="px-4 py-3">TICKET</th><th className="px-4 py-3">QTY</th><th className="px-4 py-3">TOTAL</th><th className="px-4 py-3">DATE</th></tr></thead><tbody className="divide-y divide-dap-border-muted">{orders.map((order) => <tr key={order.id} className="text-[10px]"><td className="px-4 py-3"><strong className="block">{order.buyerName}</strong><span className="mt-1 block text-muted-foreground">{order.buyerEmail}</span></td><td className="px-4 py-3">{order.eventTitle}</td><td className="px-4 py-3"><Badge variant="secondary">{order.ticketType}</Badge></td><td className="px-4 py-3">{order.quantity}</td><td className="px-4 py-3 font-semibold">{formatNaira(order.total)}</td><td className="px-4 py-3 text-muted-foreground">{new Date(order.purchasedAt).toLocaleString("en-NG")}</td></tr>)}</tbody></table></div> : <div className="grid min-h-64 place-items-center p-8 text-center"><div><span className="mx-auto grid size-11 place-items-center border-2 border-foreground bg-primary"><UsersRound size={20} /></span><p className="mt-3 text-xs font-semibold">{query ? "No matching buyers" : "No ticket buyers yet"}</p><p className="mt-1 max-w-xs text-[10px] leading-4 text-muted-foreground">{query ? "Try a different search term." : "Demo checkouts on this browser will appear here. This does not receive orders from other devices."}</p><Button asChild size="sm" variant="outline" className="mt-4"><a href="/#events"><Ticket size={13} /> Preview ticket checkout</a></Button></div></div>}
      </Card>
      <p className="text-[9px] leading-4 text-muted-foreground">No real payments are collected. These frontend-only records are stored in localStorage and are not a secure customer database.</p>
    </div>
  );
}