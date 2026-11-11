import { createTicketPdf } from "@/lib/ticket-pdf";
import {
  defaultTicketTemplate,
  normalizeTicketTemplate,
  sampleTicketPreview,
  type TicketPdfInput,
  type TicketTemplate,
} from "@/lib/ticket-pdf-shared";
import { getTicketTemplate } from "@/lib/ticket-template";

export const runtime = "nodejs";

function readTicket(searchParams: URLSearchParams): TicketPdfInput {
  return {
    buyerName: searchParams.get("buyerName")?.trim() || sampleTicketPreview.buyerName,
    orderReference: searchParams.get("orderReference")?.trim() || sampleTicketPreview.orderReference,
    eventTitle: searchParams.get("eventTitle")?.trim() || sampleTicketPreview.eventTitle,
    startsAt: searchParams.get("startsAt")?.trim() || sampleTicketPreview.startsAt,
    venueName: searchParams.get("venueName")?.trim() || sampleTicketPreview.venueName,
    area: searchParams.get("area")?.trim() || sampleTicketPreview.area,
    ticketNumber: Number(searchParams.get("ticketNumber") || sampleTicketPreview.ticketNumber) || 1,
    ticketName: searchParams.get("ticketName")?.trim() || sampleTicketPreview.ticketName,
    ticketCode: searchParams.get("ticketCode")?.trim() || sampleTicketPreview.ticketCode,
  };
}

export async function GET(request: Request) {
  const ticket = readTicket(new URL(request.url).searchParams);
  const pdf = await createTicketPdf(ticket, await getTicketTemplate());
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="parle-sip-ticket-preview.pdf"`,
      "cache-control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  let body: { ticket?: Partial<TicketPdfInput>; template?: Partial<TicketTemplate> };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const ticket: TicketPdfInput = {
    ...sampleTicketPreview,
    ...body.ticket,
    ticketNumber: Number(body.ticket?.ticketNumber ?? sampleTicketPreview.ticketNumber) || 1,
  };
  const template = normalizeTicketTemplate(body.template ?? defaultTicketTemplate);
  const pdf = await createTicketPdf(ticket, template);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="parle-sip-ticket-preview.pdf"`,
      "cache-control": "no-store",
    },
  });
}
