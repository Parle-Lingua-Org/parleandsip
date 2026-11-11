"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";

type View = "checking" | "paid" | "pending" | "error";

export function PaymentReturn() {
  const params = useSearchParams();
  const reference = (params.get("reference") || params.get("trxref") || "").trim();
  const [view, setView] = useState<View>(reference ? "checking" : "error");
  const [message, setMessage] = useState(reference ? "Confirming your payment with Paystack." : "This return link is missing a payment reference.");
  const [ticketCount, setTicketCount] = useState(0);

  useEffect(() => {
    if (!reference) return;
    let cancelled = false;

    async function confirm() {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const response = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`, { cache: "no-store" });
        const result = await response.json() as { status?: string; error?: string; ticketCount?: number; emailStatus?: string };
        if (cancelled) return;
        if (response.ok && result.status === "paid") {
          setTicketCount(result.ticketCount ?? 0);
          setView("paid");
          setMessage(result.emailStatus === "sent"
            ? "Your tickets are saved and the QR email is on its way."
            : "Your tickets are saved. If the QR email does not arrive, keep this reference and contact Parle & Sip.");
          return;
        }
        const stillWorking = response.status === 202 || result.error === "Ticket email is already being delivered.";
        if (!stillWorking) {
          setView("error");
          setMessage(result.error ?? "We could not confirm this payment.");
          return;
        }
        setMessage(response.status === 202 ? "Paystack is still confirming the charge." : "Saving your tickets. This page will check again.");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      if (!cancelled) {
        setView("pending");
        setMessage("Payment is still processing. Reopen this page from your Paystack receipt in a few minutes.");
      }
    }

    void confirm().catch(() => {
      if (!cancelled) {
        setView("error");
        setMessage("We could not reach the payment check. Refresh this page.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [reference]);

  const title = view === "paid" ? "Your place is confirmed." : view === "error" ? "Payment not confirmed." : "Checking your payment.";

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
      <section className="w-full max-w-md border-2 border-foreground bg-card p-6 text-center shadow-[4px_4px_0_var(--foreground)]">
        <span className="mx-auto grid size-11 place-items-center border-2 border-foreground bg-primary"><Ticket size={20} /></span>
        <p className="mt-4 font-mono text-[9px] tracking-wide text-muted-foreground">PAYSTACK</p>
        <h1 className="mt-1 text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{message}</p>
        {view === "paid" && <p className="mt-3 text-xs font-semibold">{ticketCount} ticket{ticketCount === 1 ? "" : "s"} issued · {reference}</p>}
        <div className="mt-5 flex flex-col items-center gap-3">
          {(view === "pending" || view === "error") && reference ? <Button variant="outline" onClick={() => window.location.reload()}>Check again</Button> : null}
          <Button asChild variant="outline"><a href="/">Back to experiences</a></Button>
        </div>
      </section>
    </main>
  );
}
