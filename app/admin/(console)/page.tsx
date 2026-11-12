"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, CircleDollarSign, ClipboardList, Ticket, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminEventsQuery } from "@/hooks/use-site-data";
import { formatNaira } from "@/lib/site-data";

type AdminOrder = {
  id: string;
  buyerName: string;
  eventTitle: string;
  ticketSummary: string;
  quantity: number;
  total: number;
  status: string;
};

export default function AdminOverviewPage() {
  const eventsQuery = useAdminEventsQuery();
  const events = eventsQuery.data ?? [];
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadOrders() {
      try {
        const response = await fetch("/api/admin/orders", { cache: "no-store" });
        const result = await response.json() as { orders?: AdminOrder[]; error?: string };
        if (!active) return;
        if (!response.ok) {
          setOrdersError(result.error ?? "Unable to load ticket orders.");
          return;
        }
        setOrders(result.orders ?? []);
      } catch {
        if (active) setOrdersError("Unable to load ticket orders.");
      } finally {
        if (active) setOrdersLoading(false);
      }
    }
    void loadOrders();
    return () => { active = false; };
  }, []);

  const paidOrders = orders.filter((order) => order.status === "paid");
  const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const ticketCount = paidOrders.reduce((sum, order) => sum + order.quantity, 0);
  const metrics = [
    { label: "Listed events", value: events.length, icon: CalendarDays, note: "Live" },
    { label: "Paid orders", value: paidOrders.length, icon: ClipboardList, note: "Live" },
    { label: "Tickets sold", value: ticketCount, icon: Ticket, note: "Live" },
    { label: "Ticket value", value: formatNaira(totalRevenue), icon: CircleDollarSign, note: "Paid only" },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] tracking-wide text-muted-foreground">YOUR COMMUNITY, AT A GLANCE</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Overview</h1>
        </div>
        <Badge variant="outline">LIVE SUPABASE DATA</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, note }) => (
          <Card key={label} className="p-4 shadow-[3px_3px_0_var(--foreground)]">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <Icon size={16} className="text-dap-green" />
            </div>
            {eventsQuery.isLoading || ordersLoading ? <Skeleton className="mt-3 h-8 w-20" /> : <p className="mt-3 text-2xl font-bold">{value}</p>}
            <p className="mt-1 text-[9px] text-muted-foreground">{note}</p>
          </Card>
        ))}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Card className="overflow-hidden shadow-[4px_4px_0_var(--foreground)]">
          <div className="flex items-center justify-between gap-3 border-b-2 border-foreground p-4">
            <div>
              <h2 className="font-bold">Recent ticket buyers</h2>
              <p className="mt-1 text-[10px] text-muted-foreground">Paid bookings Live ticket orders.</p>
            </div>
            <Button asChild size="sm" variant="outline"><Link href="/admin/orders">View all <ArrowRight size={13} /></Link></Button>
          </div>
          {ordersLoading ? (
            <div className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div>
          ) : ordersError ? (
            <p role="alert" className="grid min-h-40 place-items-center px-5 text-center text-xs">{ordersError}</p>
          ) : paidOrders.length ? (
            <div className="divide-y divide-dap-border-muted">
              {paidOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold">{order.buyerName}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{order.eventTitle} · {order.ticketSummary} · {order.quantity} ticket{order.quantity === 1 ? "" : "s"}</p>
                  </div>
                  <Badge variant="secondary">{formatNaira(order.total)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid min-h-40 place-items-center p-5 text-center">
              <div>
                <UsersRound className="mx-auto text-muted-foreground" />
                <p className="mt-3 text-xs font-semibold">No paid buyers yet</p>
                <p className="mt-1 text-[10px] text-muted-foreground">Completed Paystack bookings will show here.</p>
              </div>
            </div>
          )}
        </Card>

        <Card className="overflow-hidden shadow-[4px_4px_0_var(--foreground)]">
          <div className="flex items-center justify-between gap-3 border-b-2 border-foreground p-4">
            <div>
              <h2 className="font-bold">Upcoming meetups</h2>
              <p className="mt-1 text-[10px] text-muted-foreground">Events loaded Live.</p>
            </div>
            <Button asChild size="sm"><Link href="/admin/events">Manage <ArrowRight size={13} /></Link></Button>
          </div>
          {eventsQuery.isLoading ? (
            <div className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div>
          ) : (
            <div className="divide-y divide-dap-border-muted">
              {events.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{event.title}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{event.dateShort} · {event.area} · {event.ticketTiers.length} ticket types</p>
                  </div>
                  <span className="shrink-0 text-[10px] font-semibold">from {formatNaira(event.ticketTiers.length ? Math.min(...event.ticketTiers.map((tier) => tier.price)) : 0)}</span>
                </div>
              ))}
              {!events.length && <p className="p-5 text-xs text-muted-foreground">No events in Supabase yet.</p>}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
