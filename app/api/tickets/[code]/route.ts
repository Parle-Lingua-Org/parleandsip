import { createAdminClient } from "@/lib/supabase/admin";

type TicketRow = {
  ticket_number: number;
  ticket_code: string;
  ticket_name: string;
  status: string;
  events: { title: string; starts_at: string; venue_name: string; area: string } | { title: string; starts_at: string; venue_name: string; area: string }[] | null;
  ticket_orders: { public_reference: string; buyer_name: string; status: string } | { public_reference: string; buyer_name: string; status: string }[] | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function describeSupabaseError(error: { message?: string; details?: string } | null) {
  const message = error?.message?.trim() || "Unable to load this ticket.";
  const details = error?.details?.trim() || "";
  if (/unable to verify the first certificate|UNABLE_TO_VERIFY_LEAF_SIGNATURE/i.test(`${message}\n${details}`)) {
    return "Could not connect securely to the database from this machine (SSL certificate error). Check antivirus HTTPS scanning or system certificates, then restart the dev server.";
  }
  if (/fetch failed/i.test(message)) {
    return details || "Could not reach the database. Check your network connection and Supabase env keys, then restart the dev server.";
  }
  return message;
}

export async function GET(_request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await context.params;
    const ticketCode = decodeURIComponent(code ?? "").trim();
    if (!ticketCode || ticketCode.length > 200) return Response.json({ error: "A valid ticket code is required." }, { status: 400 });

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("ticket_codes")
      .select("ticket_number, ticket_code, ticket_name, status, events(title, starts_at, venue_name, area), ticket_orders(public_reference, buyer_name, status)")
      .eq("ticket_code", ticketCode)
      .maybeSingle();
    if (error) return Response.json({ error: describeSupabaseError(error) }, { status: 500 });
    if (!data) return Response.json({ error: "Ticket was not found." }, { status: 404 });

    const row = data as TicketRow;
    const order = one(row.ticket_orders);
    const event = one(row.events);
    if (!order || order.status !== "paid" || !event) {
      return Response.json({ error: "This ticket is not available." }, { status: 404 });
    }

    return Response.json({
      ticket: {
        buyerName: order.buyer_name,
        orderReference: order.public_reference,
        eventTitle: event.title,
        startsAt: event.starts_at,
        venueName: event.venue_name,
        area: event.area,
        ticketNumber: row.ticket_number,
        ticketName: row.ticket_name,
        ticketCode: row.ticket_code,
        status: row.status,
      },
    });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Unable to load this ticket.";
    return Response.json({ error: describeSupabaseError({ message }) }, { status: 500 });
  }
}
