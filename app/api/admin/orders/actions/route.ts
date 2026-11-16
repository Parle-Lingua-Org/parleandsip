import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { finalizePaystackPayment, isPaymentFulfillmentBusy, verifyPaystackCharge } from "@/lib/ticket-payments";

export const runtime = "nodejs";

type ActionBody = {
  action?: "verify" | "cancel" | "expire_stale";
  orderId?: string;
};

async function expireStalePending(admin: ReturnType<typeof createAdminClient>) {
  const { data, error } = await admin
    .from("ticket_orders")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("status", "pending")
    .lte("expires_at", new Date().toISOString())
    .select("id");
  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  let body: ActionBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const admin = createAdminClient();
  const action = body.action;

  try {
    if (action === "expire_stale") {
      const expiredCount = await expireStalePending(admin);
      return Response.json({ ok: true, expiredCount });
    }

    if (!body.orderId) return Response.json({ error: "Order id is required." }, { status: 400 });

    const { data: order, error: orderError } = await admin
      .from("ticket_orders")
      .select("id, public_reference, payment_reference, status, expires_at")
      .eq("id", body.orderId)
      .maybeSingle();
    if (orderError) throw new Error(orderError.message);
    if (!order) return Response.json({ error: "Order not found." }, { status: 404 });

    if (action === "cancel") {
      if (order.status !== "pending") {
        return Response.json({ error: `Only pending orders can be cancelled. Current status: ${order.status}.` }, { status: 409 });
      }
      const { error } = await admin
        .from("ticket_orders")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", order.id)
        .eq("status", "pending");
      if (error) throw new Error(error.message);
      return Response.json({ ok: true, status: "cancelled", inventoryReleased: true });
    }

    if (action === "verify") {
      if (order.status === "paid") {
        return Response.json({ ok: true, status: "paid", message: "Order is already paid." });
      }
      if (order.status !== "pending") {
        return Response.json({ error: `Only pending orders can be verified. Current status: ${order.status}.` }, { status: 409 });
      }

      const reference = (order.payment_reference || order.public_reference || "").trim();
      if (!reference) return Response.json({ error: "This order has no payment reference." }, { status: 400 });

      const charge = await verifyPaystackCharge(reference);
      if (charge.state === "paid") {
        const fulfilled = await finalizePaystackPayment(charge);
        return Response.json({
          ok: true,
          status: "paid",
          message: "Payment confirmed on Paystack. Tickets issued.",
          emailStatus: fulfilled.emailStatus,
        });
      }

      const paystackStatus = charge.status.toLowerCase();
      const failedLike = ["failed", "abandoned", "reversed", "cancelled"].includes(paystackStatus);
      if (failedLike || new Date(order.expires_at).getTime() <= Date.now()) {
        const nextStatus = failedLike ? "cancelled" : "expired";
        const { error } = await admin
          .from("ticket_orders")
          .update({ status: nextStatus, updated_at: new Date().toISOString() })
          .eq("id", order.id)
          .eq("status", "pending");
        if (error) throw new Error(error.message);
        return Response.json({
          ok: true,
          status: nextStatus,
          paystackStatus,
          inventoryReleased: true,
          message: failedLike
            ? `Paystack reports ${paystackStatus}. Order cancelled and tickets released.`
            : "Payment still unpaid and reservation expired. Tickets released.",
        });
      }

      return Response.json({
        ok: true,
        status: "pending",
        paystackStatus,
        message: `Paystack still shows ${paystackStatus}. Leave as pending or cancel to release tickets.`,
      });
    }

    return Response.json({ error: "Unknown action." }, { status: 400 });
  } catch (reason) {
    if (isPaymentFulfillmentBusy(reason)) {
      return Response.json({ error: reason.message }, { status: 503, headers: { "retry-after": "5" } });
    }
    const message = reason instanceof Error ? reason.message : "Unable to update order.";
    return Response.json({ error: message }, { status: 500 });
  }
}
