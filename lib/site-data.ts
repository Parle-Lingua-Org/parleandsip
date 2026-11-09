export type EventItem = {
  id: string;
  title: string;
  host: string;
  category: string;
  date: string;
  dateShort: string;
  time: string;
  venue: string;
  area: string;
  languages: string[];
  ticketTiers: TicketTier[];
  image: string;
  gallery: string[];
  label: string;
};

export type TicketTier = {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
};

export type SiteContent = {
  brandName: string;
  logoImage: string;
  faviconImage: string;
  announcement: string;
  navExplore: string;
  navCommunity: string;
  navPros: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSecondLine: string;
  heroDescription: string;
  heroImage: string;
  featuredEventId: string;
  promptTitle: string;
  promptEmphasis: string;
  promptCaption: string;
  calendarTitle: string;
  communityTitle: string;
  communityCta: string;
  eventsEyebrow: string;
  eventsTitle: string;
  eventsEmphasis: string;
  proEyebrow: string;
  proTitle: string;
  proEmphasis: string;
  proDescription: string;
  proCta: string;
  footerText: string;
  footerLocation: string;
  footerCurrency: string;
};

export type SiteTheme = {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  ring: string;
  info: string;
};

export type TicketOrder = {
  id: string;
  eventId: string;
  eventTitle: string;
  buyerName: string;
  buyerEmail: string;
  ticketType: string;
  quantity: number;
  total: number;
  purchasedAt: string;
};

export type SiteData = {
  content: SiteContent;
  theme: SiteTheme;
  events: EventItem[];
  orders: TicketOrder[];
};

const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=85`;
export const createTicketTiers = (eventId: string, basePrice: number): TicketTier[] => [
  { id: `${eventId}-early`, name: "Early bird", description: "Limited first-release ticket", price: basePrice, capacity: 20 },
  { id: `${eventId}-general`, name: "General admission", description: "Standard event entry", price: basePrice + 2000, capacity: 80 },
  { id: `${eventId}-supporter`, name: "Community supporter", description: "Entry plus support for the host", price: basePrice + 7000, capacity: 20 },
];

export const initialSiteData: SiteData = {
  content: {
    brandName: "Parle & Sip",
    logoImage: "",
    faviconImage: "",
    announcement: "FRENCH, CULTURE, CREATIVITY & CONNECTION.",
    navExplore: "Explore experiences",
    navCommunity: "Our community",
    navPros: "Host with us",
    heroEyebrow: "LEARN. CONNECT. EXPERIENCE.",
    heroTitle: "A little French.",
    heroSecondLine: "A lot to share.",
    heroDescription: "Parle & Sip brings French learners, Francophones, Francophiles and culture enthusiasts together to practice French, explore Francophone culture and make meaningful connections.",
    heroImage: photo("photo-1528605248644-14dd04022da1"),
    featuredEventId: "french-culture-social",
    promptTitle: "Learning French",
    promptEmphasis: "should feel like living it.",
    promptCaption: "Art, food, games & good company.",
    calendarTitle: "NEXT PARLE & SIP EDITIONS",
    communityTitle: "Francophones, Francophiles, all levels welcome.",
    communityCta: "Find your people",
    eventsEyebrow: "CULTURE, WITH A LITTLE CONVERSATION",
    eventsTitle: "Come for the French.",
    eventsEmphasis: "Stay for everything.",
    proEyebrow: "FOR CULTURE LOVERS & COLLABORATORS",
    proTitle: "Bring your Francophone world.",
    proEmphasis: "Let us make a day of it.",
    proDescription: "Host a conversation, share an art practice, curate a tasting, or bring a new cultural idea to the community.",
    proCta: "Create with Parle & Sip",
    footerText: "Learn. Connect. Experience. Parlez et profitez !",
    footerLocation: "LAGOS · NIGERIA",
    footerCurrency: "NGN · ₦ NAIRA",
  },
  theme: {
    background: "#f3f1e8",
    foreground: "#171815",
    primary: "#c8f36b",
    secondary: "#e4e9d8",
    muted: "#e7e5db",
    mutedForeground: "#686c63",
    accent: "#ff8064",
    ring: "#4a6828",
    info: "#d9e3fa",
  },
  events: [
    {
      id: "french-culture-social",
      title: "Parle & Sip: French Culture Social",
      host: "Parle & Sip",
      category: "French conversation",
      date: "Saturday, November 14, 2026",
      dateShort: "NOV 14",
      time: "4:00 PM",
      venue: "The Nest, Yaba",
      area: "Yaba",
      languages: ["French", "English"],
      ticketTiers: createTicketTiers("french-culture-social", 5000),
      image: photo("photo-1528605248644-14dd04022da1"),
      gallery: [photo("photo-1528605248644-14dd04022da1"), photo("photo-1529156069898-49953e39b3ac"), photo("photo-1517248135467-4c7edcad34c4")],
      label: "A PARLE & SIP EDITION",
    },
    {
      id: "francophone-food-table",
      title: "À Table: Francophone Food & Conversation",
      host: "Parle & Sip",
      category: "Food & gastronomy",
      date: "Sunday, November 15, 2026",
      dateShort: "NOV 15",
      time: "2:00 PM",
      venue: "Cafe Neo, Victoria Island",
      area: "Victoria Island",
      languages: ["French", "English"],
      ticketTiers: createTicketTiers("francophone-food-table", 7000),
      image: photo("photo-1517248135467-4c7edcad34c4"),
      gallery: [photo("photo-1517248135467-4c7edcad34c4"), photo("photo-1528605248644-14dd04022da1")],
      label: "",
    },
    {
      id: "francophone-film-club",
      title: "Cinéma & Conversation: Francophone Film Club",
      host: "Parle & Sip",
      category: "Francophone culture",
      date: "Saturday, November 21, 2026",
      dateShort: "NOV 21",
      time: "10:00 AM",
      venue: "Alliance Française, Ikoyi",
      area: "Ikoyi",
      languages: ["French", "English"],
      ticketTiers: createTicketTiers("francophone-film-club", 8000),
      image: photo("photo-1521737711867-e3b97375f902"),
      gallery: [photo("photo-1521737711867-e3b97375f902"), photo("photo-1517248135467-4c7edcad34c4")],
      label: "FILM + DISCUSSION",
    },
    {
      id: "french-through-art",
      title: "French Through Art: A Creative Atelier",
      host: "Parle & Sip",
      category: "Art & creativity",
      date: "Sunday, November 22, 2026",
      dateShort: "NOV 22",
      time: "11:30 AM",
      venue: "The Borough, Ikoyi",
      area: "Ikoyi",
      languages: ["French", "English"],
      ticketTiers: createTicketTiers("french-through-art", 8500),
      image: photo("photo-1529156069898-49953e39b3ac"),
      gallery: [photo("photo-1529156069898-49953e39b3ac"), photo("photo-1528605248644-14dd04022da1")],
      label: "",
    },
    {
      id: "francophone-art-jam",
      title: "L’Atelier: Francophone Art & Ideas",
      host: "Parle & Sip",
      category: "Art & creativity",
      date: "Saturday, November 28, 2026",
      dateShort: "NOV 28",
      time: "3:00 PM",
      venue: "Terra Kulture, Victoria Island",
      area: "Victoria Island",
      languages: ["French", "English"],
      ticketTiers: createTicketTiers("francophone-art-jam", 10000),
      image: photo("photo-1516280440614-37939bbacd81"),
      gallery: [photo("photo-1516280440614-37939bbacd81"), photo("photo-1517248135467-4c7edcad34c4")],
      label: "SMALL GROUP",
    },
    {
      id: "jeux-en-francais",
      title: "Jeux en Français: Board Game Social",
      host: "Parle & Sip",
      category: "Games & conversation",
      date: "Sunday, November 29, 2026",
      dateShort: "NOV 29",
      time: "1:00 PM",
      venue: "The Garden, Lekki Phase 1",
      area: "Lekki",
      languages: ["French", "English"],
      ticketTiers: createTicketTiers("jeux-en-francais", 6000),
      image: photo("photo-1511632765486-a01980e01a18"),
      gallery: [photo("photo-1511632765486-a01980e01a18"), photo("photo-1529156069898-49953e39b3ac")],
      label: "",
    },
  ],
  orders: [],
};

export function formatNaira(amount: number) {
  return `₦${new Intl.NumberFormat("en-NG").format(amount)}`;
}