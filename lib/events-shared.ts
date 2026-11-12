import type { EventItem, TicketTier } from "@/lib/site-data";

export type EventStatus = "draft" | "published" | "cancelled";
export type SchedulePrecision = "tbd" | "month" | "datetime";

export type DbEventRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  host_name: string;
  category: string;
  starts_at: string | null;
  schedule_precision?: SchedulePrecision | null;
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
  startsAt: string | null;
  status: EventStatus;
  summary: string;
  schedulePrecision: SchedulePrecision;
  dayLabel: string;
  monthLabel: string;
  weekdayLabel: string;
};

export type EventSaveInput = {
  id?: string;
  slug?: string;
  title: string;
  summary?: string;
  host: string;
  category: string;
  startsAt: string | null;
  schedulePrecision?: SchedulePrecision;
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

function formatParts(startsAt: string | null, precision: SchedulePrecision) {
  if (precision === "tbd" || !startsAt) {
    return {
      date: "Date to be announced",
      dateShort: "TBD",
      time: "",
      dayLabel: "TBD",
      monthLabel: "TBD",
      weekdayLabel: "",
    };
  }

  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) {
    return {
      date: "Date to be announced",
      dateShort: "TBD",
      time: "",
      dayLabel: "TBD",
      monthLabel: "TBD",
      weekdayLabel: "",
    };
  }

  const monthLabel = new Intl.DateTimeFormat("en-GB", {
    month: "short",
    timeZone: "Africa/Lagos",
  }).format(date).toUpperCase();

  if (precision === "month") {
    return {
      date: new Intl.DateTimeFormat("en-GB", {
        month: "long",
        year: "numeric",
        timeZone: "Africa/Lagos",
      }).format(date),
      dateShort: `${monthLabel} · TBD`,
      time: "",
      dayLabel: "TBD",
      monthLabel,
      weekdayLabel: "",
    };
  }

  const dayLabel = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(date);
  const weekdayLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    timeZone: "Africa/Lagos",
  }).format(date).toUpperCase();

  return {
    date: new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "Africa/Lagos",
    }).format(date),
    dateShort: `${monthLabel} ${dayLabel}`,
    time: new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Africa/Lagos",
    }).format(date),
    dayLabel,
    monthLabel,
    weekdayLabel,
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
  const schedulePrecision = row.schedule_precision ?? (row.starts_at ? "datetime" : "tbd");
  const parts = formatParts(row.starts_at, schedulePrecision);
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
    schedulePrecision,
    date: parts.date,
    dateShort: parts.dateShort,
    time: parts.time,
    dayLabel: parts.dayLabel,
    monthLabel: parts.monthLabel,
    weekdayLabel: parts.weekdayLabel,
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

export function upcomingEvents(events: EventRecord[], limit = 3) {
  const now = Date.now();
  return events
    .filter((event) => event.status === "published")
    .slice()
    .sort((a, b) => {
      if (!a.startsAt && !b.startsAt) return a.title.localeCompare(b.title);
      if (!a.startsAt) return 1;
      if (!b.startsAt) return -1;
      return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    })
    .filter((event) => {
      if (!event.startsAt || event.schedulePrecision === "tbd") return true;
      if (event.schedulePrecision === "month") {
        const date = new Date(event.startsAt);
        const endOfMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59));
        return endOfMonth.getTime() >= now;
      }
      return new Date(event.startsAt).getTime() >= now - 6 * 60 * 60 * 1000;
    })
    .slice(0, limit);
}
