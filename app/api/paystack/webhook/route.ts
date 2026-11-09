import { createHmac, timingSafeEqual } from "node:crypto";
import { finalizePaystackPayment } from "@/lib/ticket-payments";

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

  try {
    const result = await finalizePaystackPayment({
      reference: payload.data.reference,
      amount: Number(payload.data.amount),
      currency: payload.data.currency ?? "",
    });
    return Response.json({ received: true, emailStatus: result.emailStatus });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Payment fulfillment failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}