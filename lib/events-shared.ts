import type { EventItem, TicketTier } from "@/lib/site-data";

export type EventStatus = "draft" | "published" | "cancelled";

export type DbEventRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  host_name: string;
  category: string;
  starts_at: string;
  venue_name: string;
  address: string;
  area: string;
  language_tags: string[] | null;
  main_image_url: string;
  listing_label: string;
  status: EventStatus;
  ticket_tiers?: DbTierRow[] | null;
  event_images?: DbImageRow[] | null;
};

export type DbTierRow = {
  id: string;
  name: string;
  description: string;
  price_ngn: number | string;
  capacity: number | null;
  quantity_sold: number | null;
  is_active: boolean | null;
  sort_order: number | null;
};

export type DbImageRow = {
  id?: string;
  image_url: string;
  sort_order: number | null;
};

export type EventRecord = EventItem & {
  slug: string;
  startsAt: string;
  status: EventStatus;
  summary: string;
};

export type EventSaveInput = {
  id?: string;
  slug?: string;
  title: string;
  summary?: string;
  host: string;
  category: string;
  startsAt: string;
  venue: string;
  area: string;
  languages: string[];
  image: string;
  gallery: string[];
  label?: string;
  status?: EventStatus;
  ticketTiers: Array<{
    id?: string;
    name: string;
    description: string;
    price: number;
    capacity: number;
  }>;
};

function formatParts(startsAt: string) {
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) {
    return { date: startsAt, dateShort: "TBA", time: "" };
  }
  return {
    date: new Intl.DateTimeFormat("en-NG", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "Africa/Lagos",
    }).format(date),
    dateShort: new Intl.DateTimeFormat("en-NG", {
      month: "short",
      day: "2-digit",
      timeZone: "Africa/Lagos",
    }).format(date).replace(" ", " ").toUpperCase(),
    time: new Intl.DateTimeFormat("en-NG", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Africa/Lagos",
    }).format(date),
  };
}

export function slugify(value: string) {
  const base = value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `event-${Date.now()}`;
}

export function mapDbEvent(row: DbEventRow): EventRecord {
  const parts = formatParts(row.starts_at);
  const tiers = (row.ticket_tiers ?? [])
    .filter((tier) => tier.is_active !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((tier): TicketTier => ({
      id: tier.id,
      name: tier.name,
      description: tier.description || "",
      price: Number(tier.price_ngn) || 0,
      capacity: Number(tier.capacity ?? 0) || 0,
      quantitySold: Number(tier.quantity_sold ?? 0) || 0,
    }));
  const gallery = (row.event_images ?? [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((image) => image.image_url)
    .filter(Boolean);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    host: row.host_name || "Parle & Sip",
    category: row.category,
    startsAt: row.starts_at,
    status: row.status,
    summary: row.summary || "",
    date: parts.date,
    dateShort: parts.dateShort,
    time: parts.time,
    venue: row.venue_name || row.address || "",
    area: row.area || "",
    languages: row.language_tags ?? [],
    ticketTiers: tiers,
    image: row.main_image_url || gallery[0] || "",
    gallery,
    label: row.listing_label || "",
  };
}

export function remainingForTier(tier: TicketTier) {
  return Math.max(0, (tier.capacity || 0) - (tier.quantitySold || 0));
}
