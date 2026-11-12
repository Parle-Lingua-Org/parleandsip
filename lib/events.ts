import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { mapDbEvent, slugify, type DbEventRow, type EventRecord, type EventSaveInput } from "@/lib/events-shared";

export type { EventSaveInput } from "@/lib/events-shared";

const eventSelectBase = `
  id, slug, title, summary, host_name, category, starts_at, venue_name, address, area,
  language_tags, main_image_url, listing_label, status,
  ticket_tiers (id, name, description, price_ngn, capacity, quantity_sold, is_active, sort_order),
  event_images (id, image_url, sort_order)
`;

const eventSelect = `
  id, slug, title, summary, host_name, category, starts_at, schedule_precision, venue_name, address, area,
  language_tags, main_image_url, listing_label, status,
  ticket_tiers (id, name, description, price_ngn, capacity, quantity_sold, is_active, sort_order),
  event_images (id, image_url, sort_order)
`;

function isMissingSchedulePrecision(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  return error.code === "42703" || /schedule_precision/i.test(error.message || "");
}

async function requireUniqueSlug(admin: ReturnType<typeof createAdminClient>, slug: string, excludeId?: string) {
  let candidate = slug;
  for (let index = 0; index < 20; index += 1) {
    const query = admin.from("events").select("id").eq("slug", candidate).maybeSingle();
    const { data } = await query;
    if (!data || data.id === excludeId) return candidate;
    candidate = `${slug}-${index + 2}`;
  }
  return `${slug}-${Date.now()}`;
}

async function selectEvents(filter: "published" | "admin") {
  const admin = createAdminClient();
  const base = admin.from("events").select(eventSelect);
  const query = filter === "published"
    ? base.eq("status", "published")
    : base.neq("status", "cancelled");
  const first = await query.order("starts_at", { ascending: true, nullsFirst: false });
  if (!first.error) return (first.data ?? []) as DbEventRow[];
  if (!isMissingSchedulePrecision(first.error)) throw new Error(first.error.message);

  const fallbackBase = admin.from("events").select(eventSelectBase);
  const fallbackQuery = filter === "published"
    ? fallbackBase.eq("status", "published")
    : fallbackBase.neq("status", "cancelled");
  const second = await fallbackQuery.order("starts_at", { ascending: true, nullsFirst: false });
  if (second.error) throw new Error(second.error.message);
  return (second.data ?? []) as DbEventRow[];
}

export async function listPublishedEvents(): Promise<EventRecord[]> {
  return (await selectEvents("published")).map(mapDbEvent);
}

export async function listAdminEvents(): Promise<EventRecord[]> {
  return (await selectEvents("admin")).map(mapDbEvent);
}

export async function saveEvent(input: EventSaveInput, createdBy?: string | null): Promise<EventRecord> {
  const admin = createAdminClient();
  const precision = input.schedulePrecision ?? (input.startsAt ? "datetime" : "tbd");
  let startsAtIso: string | null = null;
  if (precision === "tbd") {
    startsAtIso = null;
  } else {
    if (!input.startsAt) throw new Error(precision === "month" ? "Choose a month for this event." : "Choose a valid event date and time.");
    const startsAt = new Date(input.startsAt);
    if (Number.isNaN(startsAt.getTime())) throw new Error("Choose a valid event date and time.");
    if (precision === "month") {
      startsAtIso = new Date(Date.UTC(startsAt.getUTCFullYear(), startsAt.getUTCMonth(), 1, 12, 0, 0)).toISOString();
    } else {
      startsAtIso = startsAt.toISOString();
    }
  }
  if (!input.title.trim()) throw new Error("Event title is required.");
  if (!input.ticketTiers.length) throw new Error("Add at least one ticket type.");

  const desiredSlug = slugify(input.slug || input.title);
  const slug = await requireUniqueSlug(admin, desiredSlug, input.id);
  const status = input.status ?? "published";
  const eventPayload = {
    slug,
    title: input.title.trim(),
    summary: (input.summary || "").trim(),
    host_name: input.host.trim() || "Parle & Sip",
    category: input.category.trim(),
    starts_at: startsAtIso,
    schedule_precision: precision,
    venue_name: input.venue.trim(),
    address: input.venue.trim(),
    area: input.area.trim(),
    language_tags: input.languages,
    main_image_url: input.image.trim(),
    listing_label: (input.label || "").trim(),
    status,
    updated_at: new Date().toISOString(),
  };

  let eventId = input.id;
  if (eventId) {
    let { error } = await admin.from("events").update(eventPayload).eq("id", eventId);
    if (isMissingSchedulePrecision(error)) {
      const { schedule_precision: _ignored, ...legacyPayload } = eventPayload;
      ({ error } = await admin.from("events").update(legacyPayload).eq("id", eventId));
    }
    if (error) throw new Error(error.message);
  } else {
    let { data, error } = await admin
      .from("events")
      .insert({ ...eventPayload, created_by: createdBy ?? null })
      .select("id")
      .single();
    if (isMissingSchedulePrecision(error)) {
      const { schedule_precision: _ignored, ...legacyPayload } = eventPayload;
      ({ data, error } = await admin
        .from("events")
        .insert({ ...legacyPayload, created_by: createdBy ?? null })
        .select("id")
        .single());
    }
    if (error || !data) throw new Error(error?.message || "Unable to create event.");
    eventId = data.id;
  }

  const { data: existingTiers, error: tiersReadError } = await admin
    .from("ticket_tiers")
    .select("id")
    .eq("event_id", eventId);
  if (tiersReadError) throw new Error(tiersReadError.message);
  const keepIds = new Set(input.ticketTiers.map((tier) => tier.id).filter(Boolean) as string[]);

  for (const [index, tier] of input.ticketTiers.entries()) {
    const tierPayload = {
      event_id: eventId,
      name: tier.name.trim(),
      description: tier.description.trim(),
      price_ngn: Math.max(0, Number(tier.price) || 0),
      capacity: Math.max(0, Number(tier.capacity) || 0),
      is_active: true,
      sort_order: index,
      updated_at: new Date().toISOString(),
    };
    if (tier.id && keepIds.has(tier.id)) {
      const { error } = await admin.from("ticket_tiers").update(tierPayload).eq("id", tier.id).eq("event_id", eventId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await admin.from("ticket_tiers").insert(tierPayload);
      if (error) throw new Error(error.message);
    }
  }

  const removedTier = (existingTiers ?? [])
    .map((tier) => tier.id as string)
    .filter((id) => !keepIds.has(id));
  if (removedTier.length) {
    const { error } = await admin.from("ticket_tiers").update({ is_active: false }).in("id", removedTier);
    if (error) throw new Error(error.message);
  }

  const { error: deleteImagesError } = await admin.from("event_images").delete().eq("event_id", eventId);
  if (deleteImagesError) throw new Error(deleteImagesError.message);
  const gallery = [input.image, ...input.gallery].filter((image, index, list) => Boolean(image.trim()) && list.indexOf(image) === index);
  if (gallery.length) {
    const { error } = await admin.from("event_images").insert(
      gallery.map((image_url, sort_order) => ({ event_id: eventId, image_url, sort_order, alt_text: input.title.trim() })),
    );
    if (error) throw new Error(error.message);
  }

  let { data, error } = await admin.from("events").select(eventSelect).eq("id", eventId).single();
  if (isMissingSchedulePrecision(error)) {
    ({ data, error } = await admin.from("events").select(eventSelectBase).eq("id", eventId).single());
  }
  if (error || !data) throw new Error(error?.message || "Unable to reload saved event.");
  return mapDbEvent({
    ...(data as DbEventRow),
    schedule_precision: (data as DbEventRow).schedule_precision ?? precision,
  });
}

export async function deleteEvent(eventId: string) {
  const admin = createAdminClient();
  const { error } = await admin.from("events").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", eventId);
  if (error) throw new Error(error.message);
}
