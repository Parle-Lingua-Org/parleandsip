"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TicketPass, type TicketPassData } from "@/components/site/ticket-pass";
import { Button } from "@/components/ui/button";

export default function TicketPage() {
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(params.code ?? "");
  const [ticket, setTicket] = useState<TicketPassData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch(`/api/tickets/${encodeURIComponent(code)}`, { cache: "no-store" });
        const result = await response.json() as { ticket?: TicketPassData; error?: string };
        if (!active) return;
        if (!response.ok || !result.ticket) {
          setError(result.error ?? "Ticket was not found.");
          return;
        }
        setTicket(result.ticket);
      } catch (reason) {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Unable to open this ticket.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    if (code) void load();
    else {
      setError("A valid ticket code is required.");
      setLoading(false);
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
        {error ? <p role="alert" className="border-2 border-foreground bg-card px-4 py-3 text-center text-xs">{error}</p> : null}
        {ticket ? <TicketPass ticket={ticket} /> : null}
        <Button asChild variant="outline"><a href="/">Back to experiences</a></Button>
      </div>
    </main>
  );
}
