"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Search, Ticket, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatNaira } from "@/lib/site-data";

type AdminOrder = {
  id: string;
  reference: string;
  buyerName: string;
  buyerEmail: string;
  eventTitle: string;
  ticketSummary: string;
  quantity: number;
  total: number;
  status: string;
  emailStatus: string;
  createdAt: string;
  paidAt: string | null;
};

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function statusVariant(status: string) {
  if (status === "paid") return "default" as const;
  if (status === "pending") return "secondary" as const;
  return "outline" as const;
}

export default function AdminOrdersPage() {
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadOrders() {
      try {
        const response = await fetch("/api/admin/orders", { cache: "no-store" });
        const result = await response.json() as { orders?: AdminOrder[]; error?: string };
        if (!active) return;
        if (!response.ok) {
          setError(result.error ?? "Unable to load ticket orders.");
          return;
        }
        setOrders(result.orders ?? []);
      } catch {
        if (active) setError("Unable to load ticket orders.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadOrders();
    return () => { active = false; };
  }, []);

  const visibleOrders = useMemo(() => {
    const term = query.trim().toLowerCase();
    return orders.filter((order) => !term || `${order.buyerName} ${order.buyerEmail} ${order.eventTitle} ${order.ticketSummary} ${order.reference} ${order.status}`.toLowerCase().includes(term));
  }, [orders, query]);
  const paidOrders = visibleOrders.filter((order) => order.status === "paid");
  const tickets = visibleOrders.reduce((sum, order) => sum + order.quantity, 0);
  const paidRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);

  function exportCsv() {
    const headers = ["Reference", "Buyer", "Email", "Event", "Tickets", "Quantity", "Total NGN", "Status", "Email", "Created at", "Paid at"];
    const rows = visibleOrders.map((order) => [order.reference, order.buyerName, order.buyerEmail, order.eventTitle, order.ticketSummary, order.quantity, order.total, order.status, order.emailStatus, order.createdAt, order.paidAt ?? ""]);
    const blob = new Blob([[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "parle-and-sip-ticket-orders.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] tracking-wide text-muted-foreground">TICKET ORDERS</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Orders</h1>
          <p className="mt-2 text-xs text-muted-foreground">Paid and pending bookings from the ticket order table.</p>
        </div>
        <Button variant="outline" disabled={!visibleOrders.length} onClick={exportCsv}><Download size={14} /> Export CSV</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4 shadow-[3px_3px_0_var(--foreground)]"><p className="text-[10px] text-muted-foreground">Orders</p><p className="mt-2 text-2xl font-bold">{visibleOrders.length}</p></Card>
        <Card className="p-4 shadow-[3px_3px_0_var(--foreground)]"><p className="text-[10px] text-muted-foreground">Tickets</p><p className="mt-2 text-2xl font-bold">{tickets}</p></Card>
        <Card className="p-4 shadow-[3px_3px_0_var(--foreground)]"><p className="text-[10px] text-muted-foreground">Paid revenue</p><p className="mt-2 text-2xl font-bold">{formatNaira(paidRevenue)}</p></Card>
      </div>

      <Card className="overflow-hidden shadow-[4px_4px_0_var(--foreground)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-foreground p-4">
          <div>
            <h2 className="font-bold">Order list</h2>
            <p className="mt-1 text-[10px] text-muted-foreground">Buyer, experience, amount, payment status, and ticket email.</p>
          </div>
          <label className="flex h-9 w-full items-center gap-2 border-2 border-foreground bg-card px-2.5 sm:max-w-64">
            <Search size={14} />
            <Input className="h-8 border-0 px-0 shadow-none focus-visible:ring-0" placeholder="Search buyers, events, or reference" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
        </div>
        {loading ? <p className="grid min-h-64 place-items-center font-mono text-xs text-muted-foreground">Loading orders…</p> : error ? <p role="alert" className="grid min-h-64 place-items-center px-6 text-center text-xs">{error}</p> : visibleOrders.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-secondary font-mono text-[8px] tracking-wide">
                <tr>
                  <th className="px-4 py-3">BUYER</th>
                  <th className="px-4 py-3">EVENT</th>
                  <th className="px-4 py-3">TICKET</th>
                  <th className="px-4 py-3">QTY</th>
                  <th className="px-4 py-3">TOTAL</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3">DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dap-border-muted">
                {visibleOrders.map((order) => (
                  <tr key={order.id} className="text-[10px]">
                    <td className="px-4 py-3"><strong className="block">{order.buyerName}</strong><span className="mt-1 block text-muted-foreground">{order.buyerEmail}</span><span className="mt-1 block font-mono text-[8px] text-muted-foreground">{order.reference}</span></td>
                    <td className="px-4 py-3">{order.eventTitle}</td>
                    <td className="px-4 py-3">{order.ticketSummary}</td>
                    <td className="px-4 py-3">{order.quantity}</td>
                    <td className="px-4 py-3 font-semibold">{formatNaira(order.total)}</td>
                    <td className="px-4 py-3"><Badge variant={statusVariant(order.status)}>{order.status}</Badge>{order.status === "paid" ? <span className="mt-1 block text-muted-foreground">Email {order.emailStatus}</span> : null}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(order.paidAt ?? order.createdAt).toLocaleString("en-NG")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center p-8 text-center">
            <div>
              <span className="mx-auto grid size-11 place-items-center border-2 border-foreground bg-primary"><UsersRound size={20} /></span>
              <p className="mt-3 text-xs font-semibold">{query ? "No matching orders" : "No ticket orders yet"}</p>
              <p className="mt-1 max-w-xs text-[10px] leading-4 text-muted-foreground">{query ? "Try a different search term." : "Bookings created at checkout will appear here."}</p>
              {!query ? <Button asChild size="sm" variant="outline" className="mt-4"><a href="/#events"><Ticket size={13} /> View experiences</a></Button> : null}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
