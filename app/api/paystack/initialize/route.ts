import { createAdminClient } from "@/lib/supabase/admin";

type CheckoutBody = {
  eventSlug?: string;
  buyerName?: string;
  buyerEmail?: string;
  items?: { name?: string; quantity?: number }[];
};

export async function POST(request: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const siteUrl = process.env.SITE_URL;
  if (!secretKey || !siteUrl) return Response.json({ error: "Paystack checkout is not configured on the server." }, { status: 503 });

  let body: CheckoutBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid checkout request." }, { status: 400 });
  }
  if (!body.eventSlug || !body.buyerName?.trim() || !body.buyerEmail?.trim() || !Array.isArray(body.items) || !body.items.length) {
    return Response.json({ error: "Complete your details and choose at least one ticket." }, { status: 400 });
  }
  const totalQuantity = body.items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
  if (totalQuantity < 1 || totalQuantity > 6 || body.items.some((item) => !item.name || !Number.isInteger(item.quantity) || Number(item.quantity) < 1)) {
    return Response.json({ error: "Choose between 1 and 6 tickets." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: event, error: eventError } = await admin.from("events").select("id, title").eq("slug", body.eventSlug).eq("status", "published").single();
    if (eventError || !event) return Response.json({ error: "This experience is not available for booking." }, { status: 404 });

    const names = [...new Set(body.items.map((item) => item.name as string))];
    const { data: tiers, error: tiersError } = await admin.from("ticket_tiers").select("id, name").eq("event_id", event.id).eq("is_active", true).in("name", names);
    if (tiersError) throw tiersError;
    if (!tiers || tiers.length !== names.length) return Response.json({ error: "One of the selected ticket types is no longer available." }, { status: 409 });
    const tierIds = new Map(tiers.map((tier) => [tier.name, tier.id]));
    const rpcItems = body.items.map((item) => ({ tier_id: tierIds.get(item.name as string), quantity: item.quantity }));

    const { data: createdOrder, error: orderError } = await admin.rpc("create_ticket_order", {
      p_event_id: event.id,
      p_buyer_name: body.buyerName.trim(),
      p_buyer_email: body.buyerEmail.trim(),
      p_items: rpcItems,
    });
    if (orderError) return Response.json({ error: orderError.message }, { status: 409 });
    const order = Array.isArray(createdOrder) ? createdOrder[0] : createdOrder;
    if (!order?.order_id || !order?.public_reference) throw new Error("Unable to create the ticket reservation.");

    const { error: referenceError } = await admin
      .from("ticket_orders")
      .update({ payment_reference: order.public_reference })
      .eq("id", order.order_id)
      .is("payment_reference", null);
    if (referenceError) throw referenceError;

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { authorization: `Bearer ${secretKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        email: body.buyerEmail.trim(),
        amount: Math.round(Number(order.subtotal_ngn) * 100),
        currency: "NGN",
        reference: order.public_reference,
        callback_url: `${siteUrl.replace(/\/$/, "")}/payment/return`,
        metadata: { order_id: order.order_id, event_title: event.title },
      }),
      cache: "no-store",
    });
    const paystack = await paystackResponse.json() as { status?: boolean; message?: string; data?: { authorization_url?: string; reference?: string } };
    if (!paystackResponse.ok || !paystack.status || !paystack.data?.authorization_url) {
      await admin.from("ticket_orders").update({ status: "cancelled" }).eq("id", order.order_id).eq("status", "pending");
      return Response.json({ error: paystack.message ?? "Paystack could not start checkout." }, { status: 502 });
    }

    return Response.json({ authorizationUrl: paystack.data.authorization_url, reference: order.public_reference });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Unable to start checkout.";
    return Response.json({ error: message }, { status: 500 });
  }
}