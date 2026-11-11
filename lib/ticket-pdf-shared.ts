export type TicketPdfInput = {
  buyerName: string;
  orderReference: string;
  eventTitle: string;
  startsAt: string;
  venueName: string;
  area: string;
  ticketNumber: number;
  ticketName: string;
  ticketCode: string;
};

export type TicketTemplate = {
  brandName: string;
  slugTag: string;
  passLabel: string;
  qrInstruction: string;
  brandSize: number;
  qrSize: number;
  qrOffsetY: number;
  notchY: number;
  showLogoInQr: boolean;
  logoInQrPercent: number;
};

export const defaultTicketTemplate: TicketTemplate = {
  brandName: "PARLE & SIP",
  slugTag: "BIGGEST FRENCH GATHERING IN ABUJA",
  passLabel: "EVENT PASS",
  qrInstruction: "SHOW THIS QR CODE AT THE DOOR",
  brandSize: 24,
  qrSize: 132,
  qrOffsetY: 84,
  notchY: 250,
  showLogoInQr: true,
  logoInQrPercent: 18,
};

export function normalizeTicketTemplate(value: unknown): TicketTemplate {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const numberOr = (key: keyof TicketTemplate, min: number, max: number, fallback: number) => {
    const next = Number(raw[key]);
    if (!Number.isFinite(next)) return fallback;
    return Math.min(max, Math.max(min, Math.round(next)));
  };
  const textOr = (key: keyof TicketTemplate, fallback: string, max = 48) => {
    const next = typeof raw[key] === "string" ? raw[key].trim() : "";
    return (next || fallback).slice(0, max);
  };

  return {
    brandName: textOr("brandName", defaultTicketTemplate.brandName, 28),
    slugTag: textOr("slugTag", defaultTicketTemplate.slugTag, 48),
    passLabel: textOr("passLabel", defaultTicketTemplate.passLabel, 24),
    qrInstruction: textOr("qrInstruction", defaultTicketTemplate.qrInstruction, 42),
    brandSize: numberOr("brandSize", 14, 34, defaultTicketTemplate.brandSize),
    qrSize: numberOr("qrSize", 96, 170, defaultTicketTemplate.qrSize),
    qrOffsetY: numberOr("qrOffsetY", 70, 120, defaultTicketTemplate.qrOffsetY),
    notchY: numberOr("notchY", 210, 290, defaultTicketTemplate.notchY),
    showLogoInQr: typeof raw.showLogoInQr === "boolean" ? raw.showLogoInQr : defaultTicketTemplate.showLogoInQr,
    logoInQrPercent: numberOr("logoInQrPercent", 10, 24, defaultTicketTemplate.logoInQrPercent),
  };
}

export const sampleTicketPreview: TicketPdfInput = {
  buyerName: "Jemima Ude",
  orderReference: "PAS-0104AF53EB",
  eventTitle: "Parle & Sip: French Culture Social",
  startsAt: "2026-11-14T15:00:00.000Z",
  venueName: "The Nest",
  area: "Maitama",
  ticketNumber: 1,
  ticketName: "Early bird",
  ticketCode: "preview-ticket-code-parle-sip",
};
