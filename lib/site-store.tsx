"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createTicketTiers, initialSiteData, type EventItem, type SiteContent, type SiteData, type SiteTheme, type TicketOrder } from "@/lib/site-data";

const STORAGE_KEY = "dap-site-data-v1";

type SiteStore = {
  data: SiteData;
  ready: boolean;
  updateContent: (patch: Partial<SiteContent>) => void;
  updateTheme: (patch: Partial<SiteTheme>) => void;
  saveEvent: (event: EventItem) => void;
  deleteEvent: (eventId: string) => void;
  addOrder: (order: TicketOrder) => void;
  reset: () => void;
};

const SiteStoreContext = createContext<SiteStore | null>(null);

function readSavedData(): SiteData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialSiteData;
    const parsed = JSON.parse(saved) as Partial<SiteData> & { events?: Array<Partial<EventItem> & { price?: number }> };
    const savedEvents = (Array.isArray(parsed.events) ? parsed.events : initialSiteData.events) as Array<Partial<EventItem> & { price?: number }>;
    const content = { ...initialSiteData.content, ...parsed.content };
    const legacyContent: Partial<SiteContent> = {
      brandName: "dap",
      announcement: "GOOD PEOPLE. NEW WORDS. BIG LAGOS ENERGY.",
      navExplore: "Explore meetups",
      navPros: "For language pros",
      heroEyebrow: "THE LANGUAGE COMMUNITY, IRL",
      heroTitle: "Find your words.",
      heroSecondLine: "Find your people.",
      heroDescription: "Language learners, interpreters and translators. Meet up, practice together, and make Lagos a little more connected.",
      featuredEventId: "lagos-language-mixer",
      promptTitle: "Fluent is a feeling.",
      promptEmphasis: "Not a requirement.",
      promptCaption: "Come as you are. Speak what you know.",
      calendarTitle: "COMING UP IN LAGOS",
      communityTitle: "One city. So many ways to say hello.",
      eventsEyebrow: "MEET IN REAL LIFE",
      eventsTitle: "Make a little",
      eventsEmphasis: "conversation.",
      proEyebrow: "FOR INTERPRETERS & TRANSLATORS",
      proTitle: "Your words move people.",
      proEmphasis: "Find your next room.",
      proDescription: "Practice with peers, share your craft, and host a session of your own.",
      proCta: "Bring an event to Dap",
      footerText: "Different words. Same wavelength.",
      footerLocation: "LAGOS, NIGERIA",
    };
    for (const key of Object.keys(legacyContent) as Array<keyof SiteContent>) {
      if (parsed.content?.[key] === legacyContent[key]) content[key] = initialSiteData.content[key];
    }
    if (!content.cityName || /lagos/i.test(content.cityName)) content.cityName = initialSiteData.content.cityName;
    if (!content.areaFilterAll || /lagos/i.test(content.areaFilterAll)) content.areaFilterAll = initialSiteData.content.areaFilterAll;
    if (!content.eventAreas || /yaba|victoria island|ikoyi|lekki|ikeja/i.test(content.eventAreas)) {
      content.eventAreas = initialSiteData.content.eventAreas;
    }
    if (!content.footerLocation || /lagos/i.test(content.footerLocation)) {
      content.footerLocation = initialSiteData.content.footerLocation;
    }
    const legacyEventTitles: Record<string, string> = {
      "lagos-language-mixer": "Lagos Language Mixer",
      "french-table": "French Table: Speak Without Notes",
      "interpretation-practice-lab": "Interpretation Practice Lab",
      "yoruba-diaspora": "Yoruba for the Diaspora",
      "translation-jam": "Translation Jam: Music & Meaning",
      "igbo-conversation": "Igbo Conversation Corner",
    };
    const theme = { ...initialSiteData.theme, ...parsed.theme };
    const previousDefaultTheme: SiteTheme = {
      background: "#f3f1e8",
      foreground: "#171815",
      primary: "#c8f36b",
      secondary: "#e4e9d8",
      muted: "#e7e5db",
      mutedForeground: "#686c63",
      accent: "#ff8064",
      ring: "#4a6828",
      info: "#d9e3fa",
    };
    for (const key of Object.keys(previousDefaultTheme) as Array<keyof SiteTheme>) {
      if (parsed.theme?.[key] === previousDefaultTheme[key]) theme[key] = initialSiteData.theme[key];
    }
    return {
      content,
      theme,
      events: savedEvents.map((event, index) => {
        const fallback = initialSiteData.events.find((item) => item.id === event.id) ?? initialSiteData.events[index];
        const id = event.id ?? fallback?.id ?? `event-${index + 1}`;
        const image = event.image ?? fallback?.image ?? "";
        const tierPrice = event.price ?? fallback?.ticketTiers[0]?.price ?? 5000;
        const isOldSample = Boolean(fallback && event.title === legacyEventTitles[id]);
        const next = {
          ...fallback,
          ...event,
          ...(isOldSample ? fallback : {}),
          id: isOldSample && fallback ? fallback.id : id,
          image,
          gallery: isOldSample && fallback ? fallback.gallery : Array.isArray(event.gallery) ? event.gallery : [image],
          ticketTiers: isOldSample && fallback ? fallback.ticketTiers : Array.isArray(event.ticketTiers) && event.ticketTiers.length ? event.ticketTiers : createTicketTiers(id, tierPrice),
        } as EventItem;
        if (fallback && (next.area === event.area || !event.area) && /^(Yaba|Victoria Island|Ikoyi|Lekki|Ikeja)$/i.test(next.area)) {
          next.area = fallback.area;
          if (!event.venue || /Yaba|Victoria Island|Ikoyi|Lekki|Ikeja|Lagos/i.test(event.venue)) next.venue = fallback.venue;
        }
        return next;
      }),
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
    };
  } catch {
    return initialSiteData;
  }
}

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(initialSiteData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setData(readSavedData());
    setReady(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--background", data.theme.background);
    root.style.setProperty("--foreground", data.theme.foreground);
    root.style.setProperty("--primary", data.theme.primary);
    root.style.setProperty("--secondary", data.theme.secondary);
    root.style.setProperty("--muted", data.theme.muted);
    root.style.setProperty("--muted-foreground", data.theme.mutedForeground);
    root.style.setProperty("--accent", data.theme.accent);
    root.style.setProperty("--ring", data.theme.ring);
    root.style.setProperty("--info", data.theme.info);
    document.title = `${data.content.brandName} | French, culture & connection`;

    if (data.content.faviconImage) {
      let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!icon) {
        icon = document.createElement("link");
        icon.rel = "icon";
        document.head.appendChild(icon);
      }
      icon.href = data.content.faviconImage;
    }
  }, [data.content.brandName, data.content.faviconImage, data.theme]);

  function commit(update: (current: SiteData) => SiteData) {
    setData((current) => {
      const next = update(current);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        return current;
      }
      return next;
    });
  }

  const store: SiteStore = {
    data,
    ready,
    updateContent: (patch) => commit((current) => ({ ...current, content: { ...current.content, ...patch } })),
    updateTheme: (patch) => commit((current) => ({ ...current, theme: { ...current.theme, ...patch } })),
    saveEvent: (event) => commit((current) => {
      const exists = current.events.some((item) => item.id === event.id);
      return { ...current, events: exists ? current.events.map((item) => item.id === event.id ? event : item) : [...current.events, event] };
    }),
    deleteEvent: (eventId) => commit((current) => ({ ...current, events: current.events.filter((event) => event.id !== eventId) })),
    addOrder: (order) => commit((current) => ({ ...current, orders: [order, ...current.orders] })),
    reset: () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        return;
      }
      setData(initialSiteData);
    },
  };

  return <SiteStoreContext.Provider value={store}>{children}</SiteStoreContext.Provider>;
}

export function useSiteStore() {
  const store = useContext(SiteStoreContext);
  if (!store) throw new Error("useSiteStore must be used within SiteDataProvider");
  return store;
}