"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CalendarDays, Check, ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImagePicker } from "@/components/ui/image-picker";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminEventsQuery,
  useDeleteEventMutation,
  useSaveEventMutation,
  useSiteSettingsQuery,
} from "@/hooks/use-site-data";
import type { EventRecord } from "@/lib/events-shared";
import { createTicketTiers, formatNaira, parseEventAreas, type TicketTier } from "@/lib/site-data";
import { imageFileToDataUrl } from "@/lib/image-upload";

type EventDraft = {
  id?: string;
  slug?: string;
  title: string;
  host: string;
  category: string;
  startsAt: string;
  venue: string;
  area: string;
  languages: string[];
  ticketTiers: TicketTier[];
  image: string;
  gallery: string[];
  label: string;
  status: "draft" | "published";
};

function toLocalInputValue(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function newEvent(cityName: string, defaultArea: string): EventDraft {
  const id = crypto.randomUUID();
  const starts = new Date();
  starts.setDate(starts.getDate() + 7);
  starts.setHours(16, 0, 0, 0);
  return {
    title: "New Parle & Sip experience",
    host: "Parle & Sip",
    category: "French conversation",
    startsAt: starts.toISOString(),
    venue: `Venue name, ${cityName}`,
    area: defaultArea,
    languages: ["French", "English"],
    ticketTiers: createTicketTiers(id, 5000),
    image: "",
    gallery: [],
    label: "",
    status: "published",
  };
}

function fromRecord(event: EventRecord): EventDraft {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    host: event.host,
    category: event.category,
    startsAt: event.startsAt,
    venue: event.venue,
    area: event.area,
    languages: [...event.languages],
    ticketTiers: event.ticketTiers.map((tier) => ({ ...tier })),
    image: event.image,
    gallery: [...event.gallery],
    label: event.label,
    status: event.status === "draft" ? "draft" : "published",
  };
}

export default function AdminEventsPage() {
  const settingsQuery = useSiteSettingsQuery();
  const eventsQuery = useAdminEventsQuery();
  const saveMutation = useSaveEventMutation();
  const deleteMutation = useDeleteEventMutation();
  const content = settingsQuery.data?.content;
  const areaOptions = parseEventAreas(content?.eventAreas || "");
  const cityName = content?.cityName || "Abuja";
  const defaultArea = areaOptions[0] || cityName;
  const events = eventsQuery.data ?? [];
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [galleryUrl, setGalleryUrl] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [formError, setFormError] = useState("");

  const saved = useMemo(() => saveMutation.isSuccess && !saveMutation.isPending, [saveMutation.isPending, saveMutation.isSuccess]);

  function updateDraft<K extends keyof EventDraft>(key: K, value: EventDraft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
    saveMutation.reset();
    setFormError("");
  }

  function updateTier(tierId: string, patch: Partial<TicketTier>) {
    setDraft((current) => current ? { ...current, ticketTiers: current.ticketTiers.map((tier) => tier.id === tierId ? { ...tier, ...patch } : tier) } : current);
    saveMutation.reset();
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setFormError("");
    try {
      const savedEvent = await saveMutation.mutateAsync({
        id: draft.id,
        slug: draft.slug,
        title: draft.title,
        host: draft.host,
        category: draft.category,
        startsAt: draft.startsAt,
        venue: draft.venue,
        area: draft.area,
        languages: draft.languages,
        image: draft.image,
        gallery: draft.gallery,
        label: draft.label,
        status: draft.status,
        ticketTiers: draft.ticketTiers,
      });
      setDraft(fromRecord(savedEvent));
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : "Unable to save event.");
    }
  }

  async function uploadGallery(files: FileList | null) {
    if (!files || !draft) return;
    setUploadError("");
    try {
      const images = await Promise.all(Array.from(files).slice(0, 5).map((file) => imageFileToDataUrl(file, 1200)));
      setDraft((current) => current ? { ...current, gallery: [...current.gallery, ...images] } : current);
      saveMutation.reset();
    } catch (reason) {
      setUploadError(reason instanceof Error ? reason.message : "Unable to read one of these images.");
    }
  }

  if (eventsQuery.isLoading || settingsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
          <Skeleton className="h-[420px] w-full" />
          <Skeleton className="h-[420px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] tracking-wide text-muted-foreground">SUPABASE · PUBLISH & SELL</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Events & tickets</h1>
          <p className="mt-2 text-xs text-muted-foreground">Events, tiers and galleries save to Supabase and power public checkout.</p>
        </div>
        <Button onClick={() => { setDraft(newEvent(cityName, defaultArea)); saveMutation.reset(); setFormError(""); }}><Plus size={14} /> Create event</Button>
      </div>

      {(eventsQuery.error || settingsQuery.error) && (
        <p role="alert" className="border-2 border-primary bg-card px-3 py-2 text-xs text-primary">
          {(eventsQuery.error as Error | null)?.message || (settingsQuery.error as Error | null)?.message || "Unable to load events."}
        </p>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(290px,.78fr)_minmax(0,1.22fr)]">
        <Card className="overflow-hidden shadow-[4px_4px_0_var(--foreground)]">
          <div className="border-b-2 border-foreground p-4">
            <h2 className="font-bold">Event list</h2>
            <p className="mt-1 text-[10px] text-muted-foreground">{events.length} experiences in the database</p>
          </div>
          <div className="divide-y divide-dap-border-muted">
            {events.map((event) => (
              <button key={event.id} type="button" onClick={() => { setDraft(fromRecord(event)); saveMutation.reset(); setFormError(""); }} className={`flex w-full items-center gap-3 p-3 text-left hover:bg-muted ${draft?.id === event.id ? "bg-secondary" : ""}`}>
                <span className="size-12 shrink-0 border border-foreground bg-cover bg-center" style={{ backgroundImage: event.image ? `url("${event.image}")` : undefined }} />
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-xs">{event.title}</strong>
                  <span className="mt-1 block truncate text-[9px] text-muted-foreground">{event.dateShort} · {event.area} · {event.status}</span>
                  <span className="mt-1 block text-[9px]">from {formatNaira(event.ticketTiers.length ? Math.min(...event.ticketTiers.map((tier) => tier.price)) : 0)}</span>
                </span>
              </button>
            ))}
          </div>
          {!events.length && <p className="p-5 text-xs text-muted-foreground">No events yet. Create your first meetup.</p>}
        </Card>

        <Card className="min-w-0 p-4 shadow-[4px_4px_0_var(--foreground)] sm:p-6">
          {draft ? (
            <form className="space-y-7" onSubmit={(event) => void saveDraft(event)}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-dap-border-muted pb-4">
                <div>
                  <Badge variant="secondary">{draft.id ? "EDIT EVENT" : "NEW EVENT"}</Badge>
                  <h2 className="mt-2 text-xl font-bold">Event details</h2>
                </div>
                <div className="flex items-center gap-2">
                  {saved && <span role="status" className="flex items-center gap-1 text-[10px] text-dap-green"><Check size={13} /> Saved</span>}
                  <Button type="submit" disabled={saveMutation.isPending}><Save size={14} /> {saveMutation.isPending ? "Saving…" : "Save event"}</Button>
                </div>
              </div>

              {formError ? <p role="alert" className="text-xs text-primary">{formError}</p> : null}

              <section className="space-y-3">
                <h3 className="text-xs font-bold">Basics</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-[10px] font-semibold sm:col-span-2">Experience title<Input required value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} /></label>
                  <label className="grid gap-1 text-[10px] font-semibold">Host<Input value={draft.host} onChange={(event) => updateDraft("host", event.target.value)} /></label>
                  <label className="grid gap-1 text-[10px] font-semibold">Experience type<select className="h-10 border-2 border-input bg-card px-2 text-xs" value={draft.category} onChange={(event) => updateDraft("category", event.target.value)}><option>French conversation</option><option>Francophone culture</option><option>Art & creativity</option><option>Food & gastronomy</option><option>Games & conversation</option></select></label>
                  <label className="grid gap-1 text-[10px] font-semibold">Starts at<Input type="datetime-local" required value={toLocalInputValue(draft.startsAt)} onChange={(event) => updateDraft("startsAt", new Date(event.target.value).toISOString())} /></label>
                  <label className="grid gap-1 text-[10px] font-semibold">Status<select className="h-10 border-2 border-input bg-card px-2 text-xs" value={draft.status} onChange={(event) => updateDraft("status", event.target.value as "draft" | "published")}><option value="published">Published</option><option value="draft">Draft</option></select></label>
                  <label className="grid gap-1 text-[10px] font-semibold">Area<select className="h-10 border-2 border-input bg-card px-2 text-xs" value={areaOptions.includes(draft.area) ? draft.area : defaultArea} onChange={(event) => updateDraft("area", event.target.value)}>{(areaOptions.includes(draft.area) ? areaOptions : [draft.area, ...areaOptions]).filter((area, index, list) => list.indexOf(area) === index).map((area) => <option key={area}>{area}</option>)}</select></label>
                  <label className="grid gap-1 text-[10px] font-semibold sm:col-span-2">Venue<Input value={draft.venue} onChange={(event) => updateDraft("venue", event.target.value)} /></label>
                  <label className="grid gap-1 text-[10px] font-semibold sm:col-span-2">Languages, separated by commas<Input value={draft.languages.join(", ")} onChange={(event) => updateDraft("languages", event.target.value.split(",").map((language) => language.trim()).filter(Boolean))} /></label>
                  <label className="grid gap-1 text-[10px] font-semibold">Listing tag<Input placeholder="Optional" value={draft.label} onChange={(event) => updateDraft("label", event.target.value)} /></label>
                </div>
              </section>

              <section className="space-y-4 border-t border-dap-border-muted pt-5">
                <div><h3 className="text-xs font-bold">Ticket types</h3><p className="mt-1 text-[10px] text-muted-foreground">Prices and capacities sync to Supabase ticket tiers.</p></div>
                <div className="grid gap-3">
                  {draft.ticketTiers.map((tier, index) => (
                    <div key={tier.id} className="grid gap-3 border border-dap-border-muted p-3 sm:grid-cols-[1fr_1fr_110px_100px_36px] sm:items-end">
                      <label className="grid gap-1 text-[9px] font-semibold">Ticket name<Input value={tier.name} onChange={(event) => updateTier(tier.id, { name: event.target.value })} /></label>
                      <label className="grid gap-1 text-[9px] font-semibold">Description<Input value={tier.description} onChange={(event) => updateTier(tier.id, { description: event.target.value })} /></label>
                      <label className="grid gap-1 text-[9px] font-semibold">Price (NGN)<Input type="number" min="0" value={tier.price} onChange={(event) => updateTier(tier.id, { price: Number(event.target.value) })} /></label>
                      <label className="grid gap-1 text-[9px] font-semibold">Capacity<Input type="number" min="0" value={tier.capacity} onChange={(event) => updateTier(tier.id, { capacity: Number(event.target.value) })} /></label>
                      <Button type="button" variant="ghost" size="icon" aria-label={`Remove ticket type ${tier.name}`} disabled={draft.ticketTiers.length <= 1} onClick={() => updateDraft("ticketTiers", draft.ticketTiers.filter((item) => item.id !== tier.id))}><Trash2 size={14} /></Button>
                      <span className="font-mono text-[8px] text-muted-foreground sm:col-span-5">TICKET TYPE {String(index + 1).padStart(2, "0")}{typeof tier.quantitySold === "number" ? ` · sold ${tier.quantitySold}` : ""}</span>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => updateDraft("ticketTiers", [...draft.ticketTiers, { id: crypto.randomUUID(), name: "New ticket", description: "Event entry", price: 5000, capacity: 20 }])}><Plus size={13} /> Add ticket type</Button>
              </section>

              <section className="space-y-4 border-t border-dap-border-muted pt-5">
                <div><h3 className="text-xs font-bold">Images</h3></div>
                <ImagePicker label="Main event image" value={draft.image} onChange={(image) => updateDraft("image", image)} />
                <div>
                  <p className="mb-2 text-[10px] font-semibold">Gallery images</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {draft.gallery.map((image, index) => (
                      <div key={`${image.slice(0, 32)}-${index}`} className="overflow-hidden border border-dap-border-muted">
                        <div className="aspect-[1.4] w-full bg-cover bg-center" style={{ backgroundImage: `url("${image}")` }} />
                        <div className="flex items-center justify-between gap-1 p-1.5">
                          <Button type="button" variant="ghost" size="sm" className="px-1 text-[8px]" onClick={() => {
                            setDraft((current) => {
                              if (!current) return current;
                              const nextGallery = current.gallery.filter((_, itemIndex) => itemIndex !== index);
                              if (current.image && current.image !== image) nextGallery.push(current.image);
                              return { ...current, image, gallery: nextGallery };
                            });
                            saveMutation.reset();
                          }}>Make main</Button>
                          <Button type="button" variant="ghost" size="icon" aria-label="Remove gallery image" onClick={() => updateDraft("gallery", draft.gallery.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={13} /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <label className="grid flex-1 gap-1 text-[9px] font-semibold">Add an image URL<Input placeholder="https://…" value={galleryUrl} onChange={(event) => setGalleryUrl(event.target.value)} /></label>
                    <Button type="button" variant="outline" size="sm" disabled={!galleryUrl.trim()} onClick={() => { updateDraft("gallery", [...draft.gallery, galleryUrl.trim()]); setGalleryUrl(""); }}><Plus size={13} /> Add URL</Button>
                    <label className="inline-flex h-9 cursor-pointer items-center gap-2 border-2 border-foreground bg-card px-3 text-[10px] font-semibold shadow-[2px_2px_0_var(--foreground)] hover:bg-secondary"><ImagePlus size={13} /> Upload photos<input className="sr-only" type="file" accept="image/*" multiple onChange={(event) => { void uploadGallery(event.target.files); event.currentTarget.value = ""; }} /></label>
                  </div>
                  {uploadError && <p role="alert" className="mt-2 text-[9px] text-accent-foreground">{uploadError}</p>}
                </div>
              </section>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dap-border-muted pt-4">
                <Button
                  variant="ghost"
                  type="button"
                  className="text-accent-foreground"
                  disabled={!draft.id || deleteMutation.isPending}
                  onClick={() => {
                    if (!draft.id) return;
                    if (!window.confirm(`Delete “${draft.title}”?`)) return;
                    void deleteMutation.mutateAsync(draft.id).then(() => setDraft(null)).catch((reason) => {
                      setFormError(reason instanceof Error ? reason.message : "Unable to delete event.");
                    });
                  }}
                >
                  <Trash2 size={14} /> Delete event
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}><Save size={14} /> {saveMutation.isPending ? "Saving…" : "Save event"}</Button>
              </div>
            </form>
          ) : (
            <div className="grid min-h-72 place-items-center text-center">
              <div>
                <CalendarDays className="mx-auto text-muted-foreground" />
                <p className="mt-3 text-xs font-semibold">Choose an event to edit</p>
                <p className="mt-1 text-[10px] text-muted-foreground">Or create a meetup for your community.</p>
                <Button className="mt-4" size="sm" onClick={() => setDraft(newEvent(cityName, defaultArea))}><Plus size={14} /> Create event</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
