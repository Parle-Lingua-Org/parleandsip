import { TicketPass } from "@/components/site/ticket-pass";

const sample = {
  buyerName: "Jemima Ude",
  orderReference: "PAS-PREVIEW01",
  eventTitle: "Parle & Sip: French Culture Social",
  startsAt: "2026-11-14T15:00:00.000Z",
  venueName: "The Nest",
  area: "Maitama",
  ticketNumber: 1,
  ticketName: "Early bird",
  ticketCode: "preview-ticket-code-parle-sip",
  status: "issued",
};

export default function TicketPreviewPage() {
  return (
    <main className="min-h-screen bg-[#e8ecf2] px-4 py-8 text-foreground">
      <div className="mx-auto flex max-w-lg flex-col items-center gap-5">
        <div className="text-center">
          <p className="font-mono text-[9px] tracking-wide text-muted-foreground">PREVIEW</p>
          <h1 className="mt-1 text-2xl font-bold">Ticket pass UI</h1>
          <p className="mt-2 text-xs text-muted-foreground">Same boarding-pass layout as the emailed PDF.</p>
        </div>
        <TicketPass ticket={sample} />
      </div>
    </main>
  );
}
