import { finalizePaystackPayment, isPaymentFulfillmentBusy, verifyPaystackCharge } from "@/lib/ticket-payments";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference") ?? url.searchParams.get("trxref");
  if (!reference || reference.length > 120) return Response.json({ error: "A valid payment reference is required." }, { status: 400 });

  try {
    const charge = await verifyPaystackCharge(reference);
    if (charge.state === "pending") return Response.json({ status: charge.status }, { status: 202 });

    const order = await finalizePaystackPayment(charge);
    return Response.json({ status: "paid", ...order });
  } catch (reason) {
    if (isPaymentFulfillmentBusy(reason)) {
      return Response.json({ error: reason.message }, { status: 503, headers: { "retry-after": "5" } });
    }
    const message = reason instanceof Error ? reason.message : "Payment verification failed.";
    const status = message === "Payment verification is not configured." ? 503 : 500;
    return Response.json({ error: message }, { status });
  }
}
