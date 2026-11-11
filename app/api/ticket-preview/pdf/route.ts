import { createTicketPdf } from "@/lib/ticket-pdf";
import {
  defaultTicketTemplate,
  normalizeTicketTemplate,
  sampleTicketPreview,
  type TicketPdfInput,
  type TicketTemplate,
} from "@/lib/ticket-pdf-shared";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ error: "Ticket preview is disabled." }, { status: 404 });
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
