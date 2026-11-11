import "server-only";

import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { createTicketPdf } from "@/lib/ticket-pdf";
import { getTicketTemplate } from "@/lib/ticket-template";

type PaystackPayment = {
  reference: string;
  amount: number;
  requested: number;
  fees: number;
  currency: string;
};

type PaystackVerifyData = {
  status?: string;
  reference?: string;
  amount?: number;
  requested_amount?: number;
  fees?: number;
  currency?: string;
};

export type VerifiedPaystackCharge =
  | { state: "pending"; status: string }
  | PaystackPayment & { state: "paid" };

type IssuedTicket = {
  ticket_number: number;
  ticket_code: string;
  ticket_name: string;
};

type FulfillmentResult = {
  order_id: string;
  public_reference: string;
  buyer_name: string;
  buyer_email: string;
  email_status: string;
  send_email: boolean;
  event_title: string;
  starts_at: string;
  venue_name: string;
  area: string;
  ticket_count: number;
  tickets: IssuedTicket[];
};

export class PaymentFulfillmentBusy extends Error {
  constructor() {
    super("Ticket email is already being delivered.");
    this.name = "PaymentFulfillmentBusy";
  }
}

export function isPaymentFulfillmentBusy(reason: unknown): reason is PaymentFulfillmentBusy {
  return reason instanceof PaymentFulfillmentBusy || (reason instanceof Error && reason.name === "PaymentFulfillmentBusy");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

async function sendTicketEmail(order: any, event: any, ticketCodes: any[]) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("RESEND_API_KEY and RESEND_FROM_EMAIL must be configured on the server.");

  const resend = new Resend(apiKey);
  const ticketTemplate = await getTicketTemplate();
  const attachments = await Promise.all(ticketCodes.map(async (ticket) => ({
    filename: `parle-sip-ticket-${String(ticket.ticket_number).padStart(2, "0")}.pdf`,
    content: await createTicketPdf({
      buyerName: order.buyer_name,
      orderReference: order.public_reference,
      eventTitle: event.title,
      startsAt: event.starts_at,
      venueName: event.venue_name,
      area: event.area,
      ticketNumber: ticket.ticket_number,
      ticketName: ticket.ticket_name,
      ticketCode: ticket.ticket_code,
    }, ticketTemplate),
    contentType: "application/pdf",
  })));
  const eventTitle = escapeHtml(event.title);
  const venue = escapeHtml(`${event.venue_name}${event.area ? `, ${event.area}` : ""}`);
  const eventDate = new Intl.DateTimeFormat("en-NG", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(event.starts_at));
  const ticketList = ticketCodes.map((ticket) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #dce4ef;color:#192637;font:700 13px Arial,sans-serif">Ticket ${String(ticket.ticket_number).padStart(2, "0")}</td>
      <td style="padding:10px 0;border-bottom:1px solid #dce4ef;color:#526173;font:13px Arial,sans-serif;text-align:right">${escapeHtml(ticket.ticket_name)} · PDF attached</td>
    </tr>`).join("");

  const { error } = await resend.emails.send({
    from,
    to: [order.buyer_email],
    subject: `Your Parle & Sip tickets: ${event.title}`,
    html: `<div style="max-width:620px;margin:0 auto;padding:24px;background:#f5f6f8;color:#192637;font-family:Arial,sans-serif"><header style="padding:18px;background:#192637;color:#fff;text-align:center"><p style="margin:0;color:#be8f3f;font-size:11px;letter-spacing:2px">PARLE & SIP</p><h1 style="margin:10px 0 0;font-size:24px">Your place is confirmed.</h1></header><p style="margin:22px 0 6px;font-size:14px">Bonjour ${escapeHtml(order.buyer_name)},</p><p style="margin:0;color:#526173;font-size:13px;line-height:1.6">Payment is confirmed for <strong>${eventTitle}</strong>. Each ticket is attached as its own boarding-pass style PDF with a unique QR code for the door.</p><p style="margin:14px 0;color:#192637;font-size:12px"><strong>Order:</strong> ${escapeHtml(order.public_reference)}<br><strong>When:</strong> ${eventDate}<br><strong>Where:</strong> ${venue}<br><strong>Tickets:</strong> ${ticketCodes.length}</p><table style="width:100%;border-collapse:collapse;margin:18px 0;padding:0;background:#fff;border:2px solid #192637">${ticketList}</table><p style="margin:0;color:#526173;font-size:12px;line-height:1.6">Open each PDF on your phone and show the QR code at check-in. One QR equals one entry.</p><footer style="padding:16px 0;color:#526173;font-size:11px;line-height:1.5">Learn. Connect. Experience. Parlez et profitez !<br>If you did not make this purchase, reply to this email.</footer></div>`,
    attachments,
  });
  if (error) throw new Error(error.message);
}

function paymentCoversOrder(amount: number, requested: number, fees: number) {
  return Number.isInteger(amount)
    && Number.isInteger(requested)
    && Number.isInteger(fees)
    && fees >= 0
    && requested > 0
    && amount >= requested
    && (amount === requested || amount === requested + fees);
}

export async function verifyPaystackCharge(reference: string): Promise<VerifiedPaystackCharge> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("Payment verification is not configured.");
  if (!reference || reference.length > 120) throw new Error("A valid payment reference is required.");

  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { authorization: `Bearer ${secret}` },
    cache: "no-store",
  });
  const result = await response.json() as { status?: boolean; message?: string; data?: PaystackVerifyData };
  if (!response.ok || !result.status || !result.data) throw new Error(result.message ?? "Unable to verify this payment.");
  if (result.data.status !== "success") return { state: "pending", status: result.data.status ?? "pending" };

  const amount = Number(result.data.amount);
  const fees = result.data.fees == null ? 0 : Number(result.data.fees);
  const requested = result.data.requested_amount == null ? amount : Number(result.data.requested_amount);
  const confirmedReference = result.data.reference ?? "";
  if (confirmedReference !== reference) throw new Error("Payment reference does not match an order.");
  if (!paymentCoversOrder(amount, requested, fees)) throw new Error("Payment amount or currency does not match the order.");

  return { state: "paid", reference: confirmedReference, amount, requested, fees, currency: result.data.currency ?? "" };
}

export async function finalizePaystackPayment(payment: PaystackPayment) {
  if (!payment.reference || payment.reference.length > 120 || !paymentCoversOrder(payment.amount, payment.requested, payment.fees)) {
    throw new Error("Payment amount or currency does not match the order.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("fulfill_paid_ticket_order", {
    p_reference: payment.reference,
    p_amount_kobo: payment.amount,
    p_requested_kobo: payment.requested,
    p_fees_kobo: payment.fees,
    p_currency: payment.currency,
  });
  if (error) throw new Error(error.message);
  const order = (typeof data === "string" ? JSON.parse(data) : data) as FulfillmentResult | null;
  if (!order?.order_id || !order.tickets?.length) throw new Error("Unable to issue tickets for this order.");

  if (!order.send_email) {
    if (order.email_status === "sending") throw new PaymentFulfillmentBusy();
    return { orderReference: order.public_reference, ticketCount: order.ticket_count, emailStatus: order.email_status };
  }

  let delivered = false;
  try {
    await sendTicketEmail(
      order,
      { title: order.event_title, starts_at: order.starts_at, venue_name: order.venue_name, area: order.area },
      order.tickets,
    );
    delivered = true;
    const { error: sentError } = await admin.rpc("complete_ticket_email", {
      p_order_id: order.order_id,
      p_status: "sent",
      p_error: null,
    });
    if (sentError) throw new Error(sentError.message);
    return { orderReference: order.public_reference, ticketCount: order.ticket_count, emailStatus: "sent" };
  } catch (reason) {
    if (!delivered) {
      const message = reason instanceof Error ? reason.message : "Unable to deliver ticket email.";
      const { error: failedError } = await admin.rpc("complete_ticket_email", {
        p_order_id: order.order_id,
        p_status: "failed",
        p_error: message.slice(0, 500),
      });
      if (failedError) throw new Error(failedError.message);
      return { orderReference: order.public_reference, ticketCount: order.ticket_count, emailStatus: "failed" };
    }
    throw reason;
  }
}