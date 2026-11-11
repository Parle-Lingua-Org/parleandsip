import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type OrderItem = { ticket_name: string; quantity: number };
type EventRelation = { title: string } | { title: string }[] | null;
type OrderRow = {
  id: string;
  public_reference: string;
  buyer_name: string;
  buyer_email: string;
  status: string;
  subtotal_ngn: number | string;
  created_at: string;
  paid_at: string | null;
  email_status: string;
  events: EventRelation;
  ticket_order_items: OrderItem[] | null;
};

function eventTitle(events: EventRelation) {
  if (Array.isArray(events)) return events[0]?.title ?? "Experience";
  return events?.title ?? "Experience";
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return Response.json({ error: "Not signed in." }, { status: 401 });

  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") return Response.json({ error: "Administrator access required." }, { status: 403 });

  const admin = createAdminClient();
  const { data, error: ordersError } = await admin
    .from("ticket_orders")
    .select("id, public_reference, buyer_name, buyer_email, status, subtotal_ngn, created_at, paid_at, email_status, events(title), ticket_order_items(ticket_name, quantity)")
    .order("created_at", { ascending: false });
  if (ordersError) return Response.json({ error: ordersError.message }, { status: 500 });

  const orders = ((data ?? []) as OrderRow[]).map((order) => {
    const items = order.ticket_order_items ?? [];
    return {
      id: order.id,
      reference: order.public_reference,
      buyerName: order.buyer_name,
      buyerEmail: order.buyer_email,
      eventTitle: eventTitle(order.events),
      ticketSummary: items.map((item) => `${item.ticket_name} × ${item.quantity}`).join(", ") || "Ticket",
      quantity: items.reduce((sum, item) => sum + item.quantity, 0),
      total: Number(order.subtotal_ngn),
      status: order.status,
      emailStatus: order.email_status,
      createdAt: order.created_at,
      paidAt: order.paid_at,
    };
  });

  return Response.json({ orders });
}
