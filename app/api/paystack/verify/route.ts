import { finalizePaystackPayment } from "@/lib/ticket-payments";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return Response.json({ error: "Payment verification is not configured." }, { status: 503 });
  const reference = new URL(request.url).searchParams.get("reference");
  if (!reference || reference.length > 120) return Response.json({ error: "A valid payment reference is required." }, { status: 400 });

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    const result = await response.json() as { status?: boolean; message?: string; data?: { status?: string; reference?: string; amount?: number; currency?: string } };
    if (!response.ok || !result.status || !result.data) return Response.json({ error: result.message ?? "Unable to verify this payment." }, { status: 502 });
    if (result.data.status !== "success") return Response.json({ status: result.data.status ?? "pending" }, { status: 202 });

    const order = await finalizePaystackPayment({
      reference: result.data.reference ?? reference,
      amount: Number(result.data.amount),
      currency: result.data.currency ?? "",
    });
    return Response.json({ status: "paid", ...order });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Payment verification failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}