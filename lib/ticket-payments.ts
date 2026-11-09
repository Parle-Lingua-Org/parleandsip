import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import QRCode from "qrcode";
import { Resend } from "resend";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";

type PaystackPayment = {
  reference: string;
  amount: number;
  currency: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

async function createTicketQr(code: string) {
  const qrBuffer = await QRCode.toBuffer(code, {
    type: "png",
    errorCorrectionLevel: "H",
    margin: 3,
    width: 560,
    color: { dark: "#192637", light: "#FFFFFF" },
  });

  let mark: Buffer;
  try {
    mark = await readFile(join(process.cwd(), "app", "icon.svg"));
  } catch {
    mark = await readFile(join(process.cwd(), "app", "logo.webp"));
  }

  const badgeSize = 142;
  const badge = await sharp({
    create: { width: badgeSize, height: badgeSize, channels: 4, background: "#FFFFFF" },
  }).png().toBuffer();
  const logo = await sharp(mark).resize(104, 104, { fit: "contain" }).png().toBuffer();
  const offset = Math.round((560 - badgeSize) / 2);

  return sharp(qrBuffer)
    .composite([
      { input: badge, left: offset, top: offset },
      { input: logo, left: offset + 19, top: offset + 19 },
    ])
    .png()
    .toBuffer();
}

async function sendTicketEmail(order: any, event: any, ticketCodes: any[]) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("RESEND_API_KEY and RESEND_FROM_EMAIL must be configured on the server.");

  const resend = new Resend(apiKey);
  const attachments = await Promise.all(ticketCodes.map(async (ticket, index) => ({
    filename: `parle-sip-ticket-${ticket.ticket_number}.png`,
    content: await createTicketQr(ticket.ticket_code),
    contentId: `ticket-qr-${index + 1}`,
    contentType: "image/png",
  })));
  const eventTitle = escapeHtml(event.title);
  const venue = escapeHtml(`${event.venue_name}${event.area ? `, ${event.area}` : ""}`);
  const eventDate = new Intl.DateTimeFormat("en-NG", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(event.starts_at));
  const ticketSections = ticketCodes.map((ticket, index) => `
    <article style="margin:20px 0;padding:20px;border:2px solid #192637;background:#fff">
      <p style="margin:0;color:#9a1f26;font:700 11px Arial,sans-serif;letter-spacing:1px">TICKET ${String(ticket.ticket_number).padStart(2, "0")}</p>
      <h2 style="margin:8px 0;color:#192637;font:700 20px Arial,sans-serif">${escapeHtml(ticket.ticket_name)}</h2>
      <p style="margin:0 0 12px;color:#526173;font:13px Arial,sans-serif">${eventDate}<br>${venue}</p>
      <img src="cid:ticket-qr-${index + 1}" width="200" height="200" alt="Ticket check-in QR code" style="display:block;width:200px;height:200px;margin:12px auto">
      <p style="margin:0;color:#526173;text-align:center;font:11px Arial,sans-serif">Show this QR code at the door.</p>
    </article>`).join("");

  const { error } = await resend.emails.send({
    from,
    to: [order.buyer_email],
    subject: `Your Parle & Sip tickets: ${event.title}`,
    html: `<div style="max-width:620px;margin:0 auto;padding:24px;background:#f5f6f8;color:#192637;font-family:Arial,sans-serif"><header style="padding:16px;background:#192637;color:#fff;text-align:center"><p style="margin:0;color:#be8f3f;font-size:11px;letter-spacing:2px">PARLE & SIP</p><h1 style="margin:10px 0 0;font-size:24px">Your place is confirmed.</h1></header><p style="margin:22px 0 6px;font-size:14px">Bonjour ${escapeHtml(order.buyer_name)},</p><p style="margin:0;color:#526173;font-size:13px;line-height:1.6">Payment is confirmed for <strong>${eventTitle}</strong>. Bring the QR code for each ticket below.</p><p style="margin:14px 0;color:#192637;font-size:12px"><strong>Order:</strong> ${escapeHtml(order.public_reference)}<br><strong>Tickets:</strong> ${ticketCodes.length}</p>${ticketSections}<footer style="padding:16px 0;color:#526173;font-size:11px;line-height:1.5">Learn. Connect. Experience. Parlez et profitez !<br>If you did not make this purchase, reply to this email.</footer></div>`,
    attachments,
  });
  if (error) throw new Error(error.message);
}

export async function finalizePaystackPayment(payment: PaystackPayment) {
  const admin = createAdminClient();
  const { data: order, error: orderError } = await admin
    .from("ticket_orders")
    .select("id, public_reference, event_id, buyer_name, buyer_email, status, subtotal_ngn, email_status, events(title, starts_at, venue_name, area), ticket_order_items(id, ticket_name, quantity)")
    .eq("payment_reference", payment.reference)
    .single();
  if (orderError || !order) throw new Error("Payment reference does not match an order.");
  if (payment.currency !== "NGN" || payment.amount !== Math.round(Number(order.subtotal_ngn) * 100)) {
    throw new Error("Payment amount or currency does not match the order.");
  }

  if (order.status === "pending") {
    const { data: paidOrder, error: updateError } = await admin
      .from("ticket_orders")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", order.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (updateError) throw new Error(updateError.message);
    if (!paidOrder) {
      const { data: refreshed } = await admin.from("ticket_orders").select("status").eq("id", order.id).single();
      if (refreshed?.status !== "paid") throw new Error("Order is not in a payable state.");
    }
  } else if (order.status !== "paid") {
    throw new Error("Order is not in a payable state.");
  }

  const { data: existingTickets, error: ticketsError } = await admin
    .from("ticket_codes")
    .select("ticket_number")
    .eq("order_id", order.id);
  if (ticketsError) throw new Error(ticketsError.message);
  const existingNumbers = new Set((existingTickets ?? []).map((ticket) => ticket.ticket_number));
  const ticketRows: { order_id: string; order_item_id: string; event_id: string; ticket_number: number; ticket_code: string; ticket_name: string }[] = [];
  let ticketNumber = 0;
  for (const item of order.ticket_order_items ?? []) {
    for (let itemNumber = 0; itemNumber < item.quantity; itemNumber += 1) {
      ticketNumber += 1;
      if (existingNumbers.has(ticketNumber)) continue;
      ticketRows.push({
        order_id: order.id,
        order_item_id: item.id,
        event_id: order.event_id,
        ticket_number: ticketNumber,
        ticket_code: randomBytes(32).toString("base64url"),
        ticket_name: item.ticket_name,
      });
    }
  }
  if (ticketRows.length) {
    const { error: insertError } = await admin.from("ticket_codes").upsert(ticketRows, { onConflict: "order_id,ticket_number", ignoreDuplicates: true });
    if (insertError) throw new Error(insertError.message);
  }

  const { data: allTickets, error: allTicketsError } = await admin
    .from("ticket_codes")
    .select("ticket_number, ticket_code, ticket_name")
    .eq("order_id", order.id)
    .order("ticket_number");
  if (allTicketsError || !allTickets?.length) throw new Error("Unable to issue tickets for this order.");

  const { data: emailClaim, error: claimError } = await admin
    .from("ticket_orders")
    .update({ email_status: "sending", email_error: null })
    .eq("id", order.id)
    .in("email_status", ["pending", "failed"])
    .select("id")
    .maybeSingle();
  if (claimError) throw new Error(claimError.message);
  if (!emailClaim) {
    const { data: current } = await admin.from("ticket_orders").select("email_status").eq("id", order.id).single();
    return { orderReference: order.public_reference, ticketCount: allTickets.length, emailStatus: current?.email_status ?? "sending" };
  }

  try {
    const event = Array.isArray(order.events) ? order.events[0] : order.events;
    if (!event) throw new Error("Event details are missing for this ticket order.");
    await sendTicketEmail(order, event, allTickets);
    const { error: sentError } = await admin.from("ticket_orders").update({ email_status: "sent", email_sent_at: new Date().toISOString(), email_error: null }).eq("id", order.id);
    if (sentError) throw new Error(sentError.message);
    return { orderReference: order.public_reference, ticketCount: allTickets.length, emailStatus: "sent" };
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Unable to deliver ticket email.";
    await admin.from("ticket_orders").update({ email_status: "failed", email_error: message.slice(0, 500) }).eq("id", order.id);
    throw reason;
  }
}