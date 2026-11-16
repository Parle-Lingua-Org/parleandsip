export type FaqItem = {
  question: string;
  answer: string;
};

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
  quantitySold?: number;
};

export type SiteContent = {
  brandName: string;
  logoImage: string;
  faviconImage: string;
  announcement: string;
  navExplore: string;
  navAbout: string;
  navCommunity: string;
  navPros: string;
  navContact: string;
  aboutEyebrow: string;
  aboutTitle: string;
  aboutBody: string;
  aboutImage: string;
  aboutFaq: FaqItem[];
  policiesIntro: string;
  policiesTicketPurchase: string;
  policiesPayment: string;
  policiesRefund: string;
  policiesTicketTransfer: string;
  policiesEventChanges: string;
  policiesParticipantResponsibilities: string;
  policiesContact: string;
  policiesClosing: string;
  policiesFaq: FaqItem[];
  policiesDocumentUrl: string;
  contactPageEyebrow: string;
  contactPageTitle: string;
  contactPageDescription: string;
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
  cityName: string;
  areaFilterAll: string;
  eventAreas: string;
  contactEmail: string;
  contactWhatsapp: string;
  instagramHandle: string;
  tiktokHandle: string;
};

export function parseEventAreas(value: string) {
  return value.split(",").map((area) => area.trim()).filter(Boolean);
}

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
    navAbout: "About us",
    navCommunity: "Our community",
    navPros: "Host with us",
    navContact: "Contact us",
    aboutEyebrow: "OUR STORY",
    aboutTitle: "French, culture & connection.",
    aboutBody: "Parle & Sip brings French learners, Francophones, Francophiles and culture enthusiasts together in Abuja to practice French, explore Francophone culture and make meaningful connections.\n\nWe gather around conversation, food, art, games and shared curiosity — so learning French feels like living it.",
    aboutImage: "",
    aboutFaq: [
      { question: "Who can join Parle & Sip?", answer: "Francophones, Francophiles and French learners of all levels are welcome." },
      { question: "Do I need to speak fluent French?", answer: "No. Come as you are — we create space for beginners through fluent speakers." },
      { question: "How do tickets work?", answer: "Choose an experience, pick a ticket type, and complete payment. Your QR ticket is emailed after confirmation." },
    ],
    policiesIntro: "Please read the following terms carefully before purchasing a ticket or registering for any of our events.",
    policiesTicketPurchase: "- All tickets must be purchased through the official Parle & Sip registration and payment platform.\n- A ticket is considered confirmed once payment has been successfully completed and payment confirmation has been issued.\n- Participants are encouraged to provide accurate personal and contact information during registration.\n- Each ticket grants admission to the specific event/programme for which it was purchased and is subject to the conditions stated.",
    policiesPayment: "- All ticket prices are displayed in Nigerian Naira (₦), unless otherwise stated.\n- Ticket prices vary depending on the event, experience and ticket category.\n- The applicable ticket price and available options will be clearly displayed on the relevant page before purchase.\n- Any applicable payment processing or service fees will be disclosed before checkout.\n- Payments must be completed through the official Parle & Sip payment platform.\n- Participants are advised to retain their payment confirmation as proof of purchase.",
    policiesRefund: "- All confirmed ticket purchases are generally non-refundable.\n- If a participant is unable to attend an event, they may request a ticket transfer in accordance with our Ticket Transfer Policy.\n- If Parle & Sip cancels an event, affected participants will be offered a full refund or the option to transfer their payment to a rescheduled event, as applicable.\n- Refunds approved by Parle & Sip will be processed through an appropriate payment method. Processing timelines may depend on the payment provider.",
    policiesTicketTransfer: "If you are unable to attend an event, you may transfer your ticket to another person, subject to approval by the Parle & Sip team.\n\n- All transfer requests must be submitted at least 48 hours before the event.\n- The original ticket holder must provide the new attendee's full name and contact information.\n- Each ticket may only be transferred once.\n- Transfers must be confirmed by the Parle & Sip team before the new attendee can use the ticket.\n- Ticket transfers are free of charge.",
    policiesEventChanges: "Parle & Sip reserves the right to make reasonable adjustments to an event's schedule, activities, speakers or venue change where necessary. In the event of a postponement or change, participants will be informed promptly and provided with relevant information regarding their existing registrations and available options.\n\nWhere an event is rescheduled, tickets may remain valid for the new date, subject to communication from the Parle & Sip team.",
    policiesParticipantResponsibilities: "Participants are expected to:\n\n- Provide accurate registration information.\n- Respect event guidelines and other attendees.\n- Arrive at the venue at the communicated time.\n- Follow any specific instructions or requirements communicated before the event.",
    policiesContact: "For questions regarding ticket purchases, payment confirmation, refunds, ticket transfers or event arrangements, please contact the Parle & Sip team through the contact details provided on our website.",
    policiesClosing: "By completing a ticket purchase, you acknowledge that you have read and agreed to these terms.\n\nParle & Sip – Learn. Connect. Experience.",
    policiesFaq: [],
    policiesDocumentUrl: "",
    contactPageEyebrow: "GET IN TOUCH",
    contactPageTitle: "Say hello.",
    contactPageDescription: "Questions about a seat, a collaboration, or the next gathering. Write, message, or find us on social.",
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
    proCta: "Join our community",
    footerText: "Learn. Connect. Experience. Parlez et profitez !",
    footerLocation: "ABUJA · NIGERIA",
    footerCurrency: "NGN · ₦ NAIRA",
    cityName: "Abuja",
    areaFilterAll: "All Abuja",
    eventAreas: "Maitama, Wuse, Garki, Asokoro, Jabi, Gwarinpa",
    contactEmail: "Parlelinguaservices@gmail.com",
    contactWhatsapp: "+2349162777004",
    instagramHandle: "parlesip",
    tiktokHandle: "parlesip",
  },
  theme: {
    background: "#f5f6f8",
    foreground: "#192637",
    primary: "#9a1f26",
    secondary: "#e5e9ef",
    muted: "#edf0f4",
    mutedForeground: "#526173",
    accent: "#be8f3f",
    ring: "#9a1f26",
    info: "#dce4ef",
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
      venue: "The Nest, Maitama",
      area: "Maitama",
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
      venue: "Cafe Neo, Wuse",
      area: "Wuse",
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
      venue: "Alliance Française, Maitama",
      area: "Maitama",
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
      venue: "The Borough, Asokoro",
      area: "Asokoro",
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
      venue: "Terra Kulture, Jabi",
      area: "Jabi",
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
      venue: "The Garden, Gwarinpa",
      area: "Gwarinpa",
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