"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check, RefreshCw, Save, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  defaultTicketTemplate,
  sampleTicketPreview,
  type TicketTemplate,
} from "@/lib/ticket-pdf-shared";

function NumberField({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1.5 text-[10px] font-semibold">
      <span className="flex items-center justify-between gap-2">
        <span>{label}</span>
        <span className="font-mono text-[9px] font-normal text-muted-foreground">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-8 w-full accent-[var(--foreground)]"
      />
      <span className="text-[9px] font-normal text-muted-foreground">{hint}</span>
    </label>
  );
}

export default function AdminTicketsPage() {
  const [template, setTemplate] = useState<TicketTemplate>(defaultTicketTemplate);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/admin/ticket-template", { cache: "no-store" });
        const result = await response.json() as { template?: TicketTemplate; error?: string };
        if (!response.ok) throw new Error(result.error || "Unable to load ticket template.");
        if (!active) return;
        setTemplate(result.template ?? defaultTicketTemplate);
      } catch (reason) {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "Unable to load ticket template.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (loading) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      setPreviewing(true);
      try {
        const response = await fetch("/api/ticket-preview/pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticket: sampleTicketPreview, template }),
        });
        if (!response.ok) throw new Error("Unable to render ticket preview.");
        const blob = await response.blob();
        if (!active) return;
        const nextUrl = URL.createObjectURL(blob);
        setPreviewUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return nextUrl;
        });
        setError("");
      } catch (reason) {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "Unable to render ticket preview.");
      } finally {
        if (active) setPreviewing(false);
      }
    }, 280);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [template, loading]);

  async function refreshPreview() {
    setPreviewing(true);
    try {
      const response = await fetch("/api/ticket-preview/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket: sampleTicketPreview, template }),
      });
      if (!response.ok) throw new Error("Unable to render ticket preview.");
      const blob = await response.blob();
      const nextUrl = URL.createObjectURL(blob);
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return nextUrl;
      });
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to render ticket preview.");
    } finally {
      setPreviewing(false);
    }
  }

  function updateField<K extends keyof TicketTemplate>(key: K, value: TicketTemplate[K]) {
    setTemplate((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function saveTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/ticket-template", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template }),
      });
      const result = await response.json() as { template?: TicketTemplate; error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to save ticket template.");
      setTemplate(result.template ?? template);
      setSaved(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save ticket template.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="font-mono text-xs text-muted-foreground">Loading ticket template…</p>;
  }

  return (
    <form className="space-y-6" onSubmit={saveTemplate}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] tracking-wide text-muted-foreground">BOARDING PASS PDF</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Ticket template</h1>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">
            Edit the copy and layout used for emailed ticket PDFs. Saved settings apply to every new booking email.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saved ? <span role="status" className="flex items-center gap-1 text-xs text-dap-green"><Check size={14} /> Saved</span> : null}
          <Button type="button" variant="outline" onClick={() => void refreshPreview()} disabled={previewing}>
            <RefreshCw size={14} /> {previewing ? "Rendering…" : "Refresh preview"}
          </Button>
          <Button type="submit" disabled={saving}><Save size={14} /> {saving ? "Saving…" : "Save template"}</Button>
        </div>
      </div>

      {error ? <p className="border-2 border-primary bg-card px-3 py-2 text-xs text-primary">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="space-y-4 p-4 shadow-[4px_4px_0_var(--foreground)] sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid size-9 place-items-center border-2 border-foreground bg-primary"><Ticket size={17} /></span>
              <div>
                <h2 className="font-bold">Header copy</h2>
                <p className="mt-1 text-[10px] text-muted-foreground">Brand, slug tag, and pass label on the navy header.</p>
              </div>
            </div>
            <label className="grid gap-1.5 text-[10px] font-semibold">Brand name
              <Input value={template.brandName} onChange={(event) => updateField("brandName", event.target.value)} />
            </label>
            <label className="grid gap-1.5 text-[10px] font-semibold">Slug tag
              <Input value={template.slugTag} onChange={(event) => updateField("slugTag", event.target.value)} />
            </label>
            <label className="grid gap-1.5 text-[10px] font-semibold">Pass label
              <Input value={template.passLabel} onChange={(event) => updateField("passLabel", event.target.value)} />
            </label>
            <label className="grid gap-1.5 text-[10px] font-semibold">QR instruction
              <Input value={template.qrInstruction} onChange={(event) => updateField("qrInstruction", event.target.value)} />
            </label>
          </Card>

          <Card className="space-y-4 p-4 shadow-[4px_4px_0_var(--foreground)] sm:p-6">
            <div>
              <h2 className="font-bold">Positions & scale</h2>
              <p className="mt-1 text-[10px] text-muted-foreground">Tune QR size, vertical placement, and tear-line height.</p>
            </div>
            <NumberField label="Brand size" hint="Header brand text size" value={template.brandSize} min={14} max={34} onChange={(value) => updateField("brandSize", value)} />
            <NumberField label="QR size" hint="Square QR edge length" value={template.qrSize} min={96} max={170} onChange={(value) => updateField("qrSize", value)} />
            <NumberField label="QR vertical position" hint="Higher moves the QR up the ticket" value={template.qrOffsetY} min={70} max={120} onChange={(value) => updateField("qrOffsetY", value)} />
            <NumberField label="Tear line position" hint="Dashed perforation height" value={template.notchY} min={210} max={290} onChange={(value) => updateField("notchY", value)} />
            <NumberField label="Logo in QR %" hint="Logo size relative to the QR" value={template.logoInQrPercent} min={10} max={24} onChange={(value) => updateField("logoInQrPercent", value)} />
            <label className="flex items-center gap-3 border-2 border-dap-border-muted bg-card px-3 py-3 text-[11px] font-semibold">
              <input
                type="checkbox"
                checked={template.showLogoInQr}
                onChange={(event) => updateField("showLogoInQr", event.target.checked)}
                className="size-4 accent-[var(--foreground)]"
              />
              Show logo in the centre of the QR
            </label>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setTemplate(defaultTicketTemplate); setSaved(false); }}>
              Reset to defaults
            </Button>
          </Card>
        </div>

        <Card className="overflow-hidden p-0 shadow-[4px_4px_0_var(--foreground)]">
          <div className="border-b-2 border-foreground px-4 py-3">
            <p className="font-mono text-[9px] tracking-wide text-muted-foreground">LIVE PDF PREVIEW</p>
            <p className="mt-1 text-xs text-muted-foreground">This is the same boarding-pass PDF attached to booking emails.</p>
          </div>
          {previewUrl ? (
            <iframe title="Ticket PDF preview" src={previewUrl} className="h-[820px] w-full bg-[#e8ecf2]" />
          ) : (
            <div className="grid h-[420px] place-items-center text-xs text-muted-foreground">Rendering preview…</div>
          )}
        </Card>
      </div>
    </form>
  );
}
