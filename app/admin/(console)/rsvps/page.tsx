"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ClipboardList, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CommunityRsvpRecord } from "@/lib/community-rsvp";

const PAGE_SIZE = 10;

export default function AdminRsvpsPage() {
  const [rsvps, setRsvps] = useState<CommunityRsvpRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/community-rsvps", { cache: "no-store" });
      const result = await response.json() as { rsvps?: CommunityRsvpRecord[]; error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to load RSVPs.");
      setRsvps(result.rsvps ?? []);
      if (!selectedId && result.rsvps?.[0]) setSelectedId(result.rsvps[0].id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load RSVPs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(rsvps.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => rsvps.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page, rsvps],
  );
  const selected = rsvps.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] tracking-wide text-muted-foreground">SUPABASE · COMMUNITY RSVPS</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Join our community</h1>
          <p className="mt-2 text-xs text-muted-foreground">Responses from the public RSVP form.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {error ? <p role="alert" className="border-2 border-primary bg-card px-3 py-2 text-xs text-primary">{error}</p> : null}

      {loading ? (
        <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
          <Skeleton className="h-[420px] w-full" />
          <Skeleton className="h-[420px] w-full" />
        </div>
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(300px,.9fr)_minmax(0,1.1fr)]">
          <Card className="overflow-hidden shadow-[4px_4px_0_var(--foreground)]">
            <div className="border-b-2 border-foreground p-4">
              <h2 className="font-bold">Submissions</h2>
              <p className="mt-1 text-[10px] text-muted-foreground">{rsvps.length} total · page {page} of {totalPages}</p>
            </div>
            <div className="divide-y divide-dap-border-muted">
              {pageItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`flex w-full items-start gap-3 p-3 text-left hover:bg-muted ${selectedId === item.id ? "bg-secondary" : ""}`}
                >
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center border border-foreground bg-card"><ClipboardList size={16} /></span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-xs">{item.fullName}</strong>
                    <span className="mt-1 block truncate text-[9px] text-muted-foreground">{item.email} · {item.whatsapp}</span>
                    <span className="mt-1 block text-[9px] text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</span>
                  </span>
                </button>
              ))}
            </div>
            {!rsvps.length && <p className="p-5 text-xs text-muted-foreground">No RSVPs yet.</p>}
            {rsvps.length > PAGE_SIZE && (
              <div className="flex items-center justify-between gap-2 border-t-2 border-foreground p-3">
                <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                  <ChevronLeft size={14} /> Prev
                </Button>
                <span className="font-mono text-[9px] text-muted-foreground">{page} / {totalPages}</span>
                <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                  Next <ChevronRight size={14} />
                </Button>
              </div>
            )}
          </Card>

          <Card className="min-w-0 p-4 shadow-[4px_4px_0_var(--foreground)] sm:p-6">
            {selected ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-dap-border-muted pb-4">
                  <div>
                    <Badge variant="secondary">RSVP DETAIL</Badge>
                    <h2 className="mt-2 text-xl font-bold">{selected.fullName}</h2>
                    <p className="mt-1 text-[10px] text-muted-foreground">{new Date(selected.createdAt).toLocaleString()}</p>
                  </div>
                  <Badge variant="outline">Ticket: {selected.ticketName}</Badge>
                </div>
                <dl className="grid gap-3 text-xs sm:grid-cols-2">
                  <div><dt className="font-mono text-[8px] text-muted-foreground">EMAIL</dt><dd className="mt-1 break-all font-semibold">{selected.email}</dd></div>
                  <div><dt className="font-mono text-[8px] text-muted-foreground">WHATSAPP</dt><dd className="mt-1 font-semibold">{selected.whatsapp}</dd></div>
                  <div><dt className="font-mono text-[8px] text-muted-foreground">LEARNING FRENCH</dt><dd className="mt-1">{selected.learningFrench}</dd></div>
                  <div><dt className="font-mono text-[8px] text-muted-foreground">LEVEL</dt><dd className="mt-1">{selected.frenchLevel}</dd></div>
                  <div className="sm:col-span-2"><dt className="font-mono text-[8px] text-muted-foreground">MOTIVATIONS</dt><dd className="mt-1">{selected.motivations.join(", ")}{selected.motivationsOther ? ` — ${selected.motivationsOther}` : ""}</dd></div>
                  <div className="sm:col-span-2"><dt className="font-mono text-[8px] text-muted-foreground">HOPING TO GAIN</dt><dd className="mt-1">{selected.hopingToGain.join(", ")}{selected.hopingToGainOther ? ` — ${selected.hopingToGainOther}` : ""}</dd></div>
                  <div className="sm:col-span-2"><dt className="font-mono text-[8px] text-muted-foreground">EXPECTING MOST</dt><dd className="mt-1 whitespace-pre-wrap">{selected.expectingMost}</dd></div>
                  <div className="sm:col-span-2"><dt className="font-mono text-[8px] text-muted-foreground">ALLERGIES / DIETARY</dt><dd className="mt-1">{selected.allergies}</dd></div>
                  <div><dt className="font-mono text-[8px] text-muted-foreground">HEARD FROM</dt><dd className="mt-1">{selected.heardFrom}{selected.heardFromOther ? ` — ${selected.heardFromOther}` : ""}</dd></div>
                  <div><dt className="font-mono text-[8px] text-muted-foreground">FOLLOWING SOCIAL</dt><dd className="mt-1">{selected.followingSocial}</dd></div>
                </dl>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Select a submission to view details.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
