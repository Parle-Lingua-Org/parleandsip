import { createHmac, timingSafeEqual } from "node:crypto";
import { finalizePaystackPayment, isPaymentFulfillmentBusy, verifyPaystackCharge } from "@/lib/ticket-payments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return Response.json({ error: "Webhook is not configured." }, { status: 503 });

  const signature = request.headers.get("x-paystack-signature");
  if (!signature) return Response.json({ error: "Missing Paystack signature." }, { status: 401 });
  const rawBody = await request.text();
  const expected = createHmac("sha512", secret).update(rawBody).digest();
  let received: Buffer;
  try {
    received = Buffer.from(signature, "hex");
  } catch {
    return Response.json({ error: "Invalid Paystack signature." }, { status: 401 });
  }
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return Response.json({ error: "Invalid Paystack signature." }, { status: 401 });
  }

  let payload: { event?: string; data?: { reference?: string; amount?: number; currency?: string; status?: string } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid webhook payload." }, { status: 400 });
  }
  if (payload.event !== "charge.success" || !payload.data?.reference) return Response.json({ received: true });
  if (payload.data.status && payload.data.status !== "success") return Response.json({ received: true });

  try {
    const charge = await verifyPaystackCharge(payload.data.reference);
    if (charge.state === "pending") return Response.json({ error: "Paystack has not confirmed this charge." }, { status: 500 });

    const reportedAmount = Number(payload.data.amount);
    if (Number.isInteger(reportedAmount) && reportedAmount !== charge.amount) {
      return Response.json({ error: "Payment amount or currency does not match the order." }, { status: 409 });
    }
    const reportedCurrency = payload.data.currency?.toUpperCase();
    if (reportedCurrency && charge.currency && reportedCurrency !== charge.currency.toUpperCase()) {
      return Response.json({ error: "Payment amount or currency does not match the order." }, { status: 409 });
    }

    const result = await finalizePaystackPayment(charge);
    if (result.emailStatus === "failed") {
      return Response.json({ received: true, error: "Tickets are saved, but the ticket email was not delivered." }, { status: 500 });
    }
    return Response.json({ received: true, emailStatus: result.emailStatus });
  } catch (reason) {
    if (isPaymentFulfillmentBusy(reason)) {
      return Response.json({ error: reason.message }, { status: 503, headers: { "retry-after": "5" } });
    }
    const message = reason instanceof Error ? reason.message : "Payment fulfillment failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}