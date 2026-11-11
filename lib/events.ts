import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { mapDbEvent, slugify, type DbEventRow, type EventRecord, type EventSaveInput } from "@/lib/events-shared";

export type { EventSaveInput } from "@/lib/events-shared";

const eventSelect = `
  id, slug, title, summary, host_name, category, starts_at, venue_name, address, area,
  language_tags, main_image_url, listing_label, status,
  ticket_tiers (id, name, description, price_ngn, capacity, quantity_sold, is_active, sort_order),
  event_images (id, image_url, sort_order)
`;

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

export async function listPublishedEvents(): Promise<EventRecord[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("events")
    .select(eventSelect)
    .eq("status", "published")
    .order("starts_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as DbEventRow[]).map(mapDbEvent);
}

export async function listAdminEvents(): Promise<EventRecord[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("events")
    .select(eventSelect)
    .neq("status", "cancelled")
    .order("starts_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as DbEventRow[]).map(mapDbEvent);
}

export async function saveEvent(input: EventSaveInput, createdBy?: string | null): Promise<EventRecord> {
  const admin = createAdminClient();
  const startsAt = new Date(input.startsAt);
  if (Number.isNaN(startsAt.getTime())) throw new Error("Choose a valid event date and time.");
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
    starts_at: startsAt.toISOString(),
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
    const { error } = await admin.from("events").update(eventPayload).eq("id", eventId);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await admin
      .from("events")
      .insert({ ...eventPayload, created_by: createdBy ?? null })
      .select("id")
      .single();
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

  const staleTier = (existingTiers ?? []).map((tier) => tier.id).filter((id) => !keepIds.has(id));
  if (staleTiers.length) {
    const { error } = await admin.from("ticket_tiers").update({ is_active: false }).in("id", staleTiers);
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

  const { data, error } = await admin.from("events").select(eventSelect).eq("id", eventId).single();
  if (error || !data) throw new Error(error?.message || "Unable to reload saved event.");
  return mapDbEvent(data as DbEventRow);
}

export async function deleteEvent(eventId: string) {
  const admin = createAdminClient();
  const { error } = await admin.from("events").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", eventId);
  if (error) throw new Error(error.message);
}
