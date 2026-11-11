"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, QrCode, ScanLine, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type CheckInEvent = {
  id: string;
  title: string;
  startsAt: string;
  area: string;
  status: string;
};

type CheckInResult = {
  ticketId: string;
  eventTitle: string;
  buyerName: string;
  ticketName: string;
  status: string;
  checkedInAt: string;
};

export default function AdminCheckInPage() {
  const [events, setEvents] = useState<CheckInEvent[]>([]);
  const [eventId, setEventId] = useState("");
  const [eventsError, setEventsError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null);
  const [history, setHistory] = useState<CheckInResult[]>([]);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const scanningRef = useRef(false);
  const eventIdRef = useRef("");
  const readerId = "ticket-check-in-reader";
  const selectedEvent = events.find((event) => event.id === eventId) ?? null;

  useEffect(() => {
    eventIdRef.current = eventId;
  }, [eventId]);

  useEffect(() => {
    let active = true;
    async function loadEvents() {
      try {
        const response = await fetch("/api/admin/check-in", { cache: "no-store" });
        const result = await response.json() as { events?: CheckInEvent[]; error?: string };
        if (!active) return;
        if (!response.ok) {
          setEventsError(result.error ?? "Unable to load events.");
          return;
        }
        const list = result.events ?? [];
        setEvents(list);
        if (list.length === 1) setEventId(list[0].id);
      } catch {
        if (active) setEventsError("Unable to load events.");
      }
    }
    void loadEvents();
    return () => { active = false; };
  }, []);

  async function checkIn(ticketCode: string) {
    const code = ticketCode.trim();
    const selectedEventId = eventIdRef.current;
    if (!code || busy) return;
    if (!selectedEventId) {
      setError("Select the event before scanning tickets.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/check-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticketCode: code, eventId: selectedEventId }),
      });
      const result = await response.json() as CheckInResult & { error?: string };
      if (!response.ok) {
        setLastResult(null);
        setError(result.error ?? "Unable to check this ticket in.");
        return;
      }
      setLastResult(result);
      setHistory((current) => [result, ...current.filter((item) => item.ticketId !== result.ticketId)].slice(0, 12));
      setMessage(`${result.buyerName} is checked in.`);
      setManualCode("");
    } catch {
      setLastResult(null);
      setError("Unable to reach check-in.");
    } finally {
      setBusy(false);
    }
  }

  async function startCamera() {
    if (!eventIdRef.current) {
      setError("Select the event before scanning tickets.");
      return;
    }
    setCameraError("");
    setError("");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(readerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          if (scanningRef.current || busy) return;
          scanningRef.current = true;
          void checkIn(decodedText).finally(() => {
            window.setTimeout(() => {
              scanningRef.current = false;
            }, 2500);
          });
        },
        () => undefined,
      );
      setCameraOn(true);
    } catch (reason) {
      setCameraOn(false);
      setCameraError(reason instanceof Error ? reason.message : "Camera access was blocked.");
      scannerRef.current = null;
    }
  }

  async function stopCamera() {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setCameraOn(false);
    if (!scanner) return;
    try {
      await scanner.stop();
    } catch {
      // Camera may already be stopped.
    }
  }

  useEffect(() => () => {
    void stopCamera();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[9px] tracking-wide text-muted-foreground">DOOR CHECK-IN</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Scan tickets</h1>
        <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">Choose the event first, then scan. Check-in opens 2 hours before start and stays open until the next day. A ticket for another event is rejected.</p>
      </div>

      <Card className="p-4 shadow-[4px_4px_0_var(--foreground)]">
        <h2 className="font-bold">Select event</h2>
        <p className="mt-1 text-[10px] text-muted-foreground">Only tickets bought for this experience will be accepted at the door.</p>
        <label className="mt-4 grid gap-1 text-[10px] font-semibold">Event
          <select
            className="h-10 border-2 border-input bg-card px-2 text-xs"
            value={eventId}
            onChange={(event) => {
              setEventId(event.target.value);
              setError("");
              setMessage("");
              setLastResult(null);
            }}
          >
            <option value="">Choose the event you are checking in</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title} · {new Date(event.startsAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" })} · {event.area}
              </option>
            ))}
          </select>
        </label>
        {selectedEvent ? <p className="mt-3 text-[10px] text-muted-foreground">Scanning for <strong>{selectedEvent.title}</strong>.</p> : null}
        {eventsError ? <p role="alert" className="mt-3 text-[10px] text-accent-foreground">{eventsError}</p> : null}
      </Card>

      <div className="grid items-start gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Card className="overflow-hidden shadow-[4px_4px_0_var(--foreground)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-foreground p-4">
            <div>
              <h2 className="font-bold">Camera scanner</h2>
              <p className="mt-1 text-[10px] text-muted-foreground">Point the phone or laptop camera at the guest QR code.</p>
            </div>
            {cameraOn ? (
              <Button variant="outline" size="sm" onClick={() => void stopCamera()}><X size={14} /> Stop camera</Button>
            ) : (
              <Button size="sm" disabled={!eventId} onClick={() => void startCamera()}><Camera size={14} /> Start camera</Button>
            )}
          </div>
          <div className="space-y-3 p-4">
            {!cameraOn ? (
              <div className="grid min-h-64 place-items-center border-2 border-dashed border-dap-border-muted text-center">
                <div>
                  <ScanLine className="mx-auto text-muted-foreground" />
                  <p className="mt-3 text-xs font-semibold">{eventId ? "Camera is off" : "Select an event first"}</p>
                  <p className="mt-1 max-w-xs text-[10px] text-muted-foreground">{eventId ? "Start the camera on the event door, then scan each ticket QR." : "Choose which experience you are checking in before opening the camera."}</p>
                </div>
              </div>
            ) : null}
            <div id={readerId} className={cameraOn ? "min-h-64 overflow-hidden border-2 border-foreground bg-secondary" : "hidden"} />
            {cameraError ? <p role="alert" className="text-[10px] text-accent-foreground">{cameraError}</p> : null}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-4 shadow-[4px_4px_0_var(--foreground)]">
            <h2 className="font-bold">Manual code</h2>
            <p className="mt-1 text-[10px] text-muted-foreground">If the camera cannot read the QR, paste the ticket code from the email.</p>
            <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={(event) => { event.preventDefault(); void checkIn(manualCode); }}>
              <label className="grid flex-1 gap-1 text-[10px] font-semibold">Ticket code
                <Input value={manualCode} onChange={(event) => setManualCode(event.target.value)} placeholder="Paste ticket code" autoComplete="off" disabled={!eventId} />
              </label>
              <Button className="sm:mt-5" type="submit" disabled={busy || !eventId || !manualCode.trim()}><QrCode size={14} /> {busy ? "Checking…" : "Check in"}</Button>
            </form>
          </Card>

          <Card className="p-4 shadow-[4px_4px_0_var(--foreground)]">
            <h2 className="font-bold">Latest result</h2>
            {lastResult ? (
              <div className="mt-3 space-y-2 border-2 border-foreground bg-secondary p-3">
                <Badge variant="default"><Check size={12} /> {lastResult.status.replace("_", " ")}</Badge>
                <p className="text-sm font-bold">{lastResult.buyerName}</p>
                <p className="text-[10px] text-muted-foreground">{lastResult.eventTitle}</p>
                <p className="text-[10px]">{lastResult.ticketName}</p>
                <p className="font-mono text-[8px] text-muted-foreground">{new Date(lastResult.checkedInAt).toLocaleString("en-NG")}</p>
              </div>
            ) : (
              <p className="mt-3 text-[10px] text-muted-foreground">No successful check-in yet on this screen.</p>
            )}
            {message ? <p role="status" className="mt-3 text-xs font-semibold text-dap-green">{message}</p> : null}
            {error ? <p role="alert" className="mt-3 text-xs text-accent-foreground">{error}</p> : null}
          </Card>
        </div>
      </div>

      <Card className="overflow-hidden shadow-[4px_4px_0_var(--foreground)]">
        <div className="border-b-2 border-foreground p-4">
          <h2 className="font-bold">Checked in this session</h2>
          <p className="mt-1 text-[10px] text-muted-foreground">Recent successful scans from this browser tab.</p>
        </div>
        {history.length ? (
          <div className="divide-y divide-dap-border-muted">
            {history.map((item) => (
              <div key={item.ticketId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold">{item.buyerName}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{item.eventTitle} · {item.ticketName}</p>
                </div>
                <Badge variant="secondary">{new Date(item.checkedInAt).toLocaleTimeString("en-NG")}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="grid min-h-28 place-items-center text-[10px] text-muted-foreground">Checked-in guests will appear here.</p>
        )}
      </Card>
    </div>
  );
}
