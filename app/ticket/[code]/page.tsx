"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TicketPass, type TicketPassData } from "@/components/site/ticket-pass";
import { Button } from "@/components/ui/button";
import { toUserMessage } from "@/lib/errors";
import { notifyError } from "@/lib/notify";

export default function TicketPage() {
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(params.code ?? "");
  const [ticket, setTicket] = useState<TicketPassData | null>(null);
  const [missing, setMissing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch(`/api/tickets/${encodeURIComponent(code)}`, { cache: "no-store" });
        const result = await response.json() as { ticket?: TicketPassData; error?: string };
        if (!active) return;
        if (!response.ok || !result.ticket) {
          setMissing(true);
          notifyError(result.error ?? "Ticket was not found.", "This ticket could not be opened.");
          return;
        }
        setTicket(result.ticket);
      } catch (reason) {
        if (active) {
          setMissing(true);
          notifyError(reason, "Unable to open this ticket.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    if (code) void load();
    else {
      setMissing(true);
      setLoading(false);
      notifyError("A valid ticket code is required.");
    }
    return () => { active = false; };
  }, [code]);

  return (
    <main className="min-h-screen bg-[#e8ecf2] px-4 py-8 text-foreground">
      <div className="mx-auto flex max-w-lg flex-col items-center gap-5">
        <div className="text-center">
          <p className="font-mono text-[9px] tracking-wide text-muted-foreground">PARLE & SIP</p>
          <h1 className="mt-1 text-2xl font-bold">Your event pass</h1>
          <p className="mt-2 text-xs text-muted-foreground">Show this screen or the PDF QR at the door.</p>
        </div>
        {loading ? <p className="font-mono text-xs text-muted-foreground">Opening your ticket…</p> : null}
        {!loading && missing ? (
          <p className="border-2 border-foreground bg-card px-4 py-3 text-center text-xs">
            {toUserMessage("Ticket was not found.", "This ticket is not available.")}
          </p>
        ) : null}
        {ticket ? <TicketPass ticket={ticket} /> : null}
        <Button asChild variant="outline"><a href="/">Back to experiences</a></Button>
      </div>
    </main>
  );
}
