import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import sharp from "sharp";
import {
  defaultTicketTemplate,
  normalizeTicketTemplate,
  type TicketPdfInput,
  type TicketTemplate,
} from "@/lib/ticket-pdf-shared";
import { getTicketTemplate } from "@/lib/ticket-template";

export type { TicketPdfInput, TicketTemplate } from "@/lib/ticket-pdf-shared";
export { defaultTicketTemplate, normalizeTicketTemplate, sampleTicketPreview } from "@/lib/ticket-pdf-shared";

const navy = rgb(25 / 255, 38 / 255, 55 / 255);
const gold = rgb(190 / 255, 143 / 255, 63 / 255);
const muted = rgb(82 / 255, 97 / 255, 115 / 255);
const white = rgb(1, 1, 1);
const pageBg = rgb(245 / 255, 246 / 255, 248 / 255);

function fitText(value: string, max = 42) {
  const cleaned = value.normalize("NFKD").replace(/[^\x20-\x7E]/g, "").trim() || "Guest";
  return cleaned.length > max ? `${cleaned.slice(0, max - 1)}…` : cleaned;
}

function formatEventParts(startsAt: string) {
  const date = new Date(startsAt);
  return {
    dateLabel: new Intl.DateTimeFormat("en-NG", {
      day: "numeric",
      month: "short",
      year: "2-digit",
      timeZone: "Africa/Lagos",
    }).format(date).toUpperCase(),
    timeLabel: new Intl.DateTimeFormat("en-NG", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Africa/Lagos",
    }).format(date).toUpperCase(),
    weekday: new Intl.DateTimeFormat("en-NG", {
      weekday: "long",
      timeZone: "Africa/Lagos",
    }).format(date),
  };
}

function drawLabel(page: PDFPage, text: string, x: number, y: number, font: PDFFont) {
  page.drawText(text.toUpperCase(), { x, y, size: 7, font, color: muted });
}

function drawValue(page: PDFPage, text: string, x: number, y: number, font: PDFFont, size = 11) {
  page.drawText(fitText(text, 28), { x, y, size, font, color: navy });
}

async function loadLogoPng(size = 160) {
  const logoPath = join(process.cwd(), "app", "logo.webp");
  return sharp(await readFile(logoPath)).resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toBuffer();
}

async function createBrandedQrPng(ticketCode: string, template: TicketTemplate) {
  const size = 560;
  const qrPng = await QRCode.toBuffer(ticketCode, {
    type: "png",
    errorCorrectionLevel: "H",
    margin: 2,
    width: size,
    color: { dark: "#192637", light: "#FFFFFF" },
  });

  if (!template.showLogoInQr) return qrPng;

  const logoSize = Math.round(size * (template.logoInQrPercent / 100));
  const inset = Math.round((size - logoSize) / 2);
  const logoPng = await loadLogoPng(logoSize);
  return sharp(qrPng)
    .composite([{ input: logoPng, left: inset, top: inset }])
    .png()
    .toBuffer();
}

export async function createTicketPdf(input: TicketPdfInput, templateInput?: Partial<TicketTemplate> | TicketTemplate) {
  const template = normalizeTicketTemplate(templateInput ?? await getTicketTemplate());
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([420, 720]);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const { dateLabel, timeLabel, weekday } = formatEventParts(input.startsAt);
  const ticketNo = String(input.ticketNumber).padStart(2, "0");
  const notchY = template.notchY;
  const brand = fitText(template.brandName.toUpperCase(), 28);
  const brandSize = template.brandSize;
  const brandWidth = bold.widthOfTextAtSize(brand, brandSize);
  const slug = fitText(template.slugTag.toUpperCase(), 48);
  const slugSize = 7;
  const slugWidth = bold.widthOfTextAtSize(slug, slugSize);
  const slugPadX = 10;
  const slugPadY = 5;
  const slugBoxW = slugWidth + slugPadX * 2;
  const slugBoxH = slugSize + slugPadY * 2;
  const qrSize = template.qrSize;
  const qrX = 210 - qrSize / 2;
  const qrY = template.qrOffsetY;
  const passLabel = fitText(template.passLabel.toUpperCase(), 18);
  const passWidth = bold.widthOfTextAtSize(passLabel, 8);
  const instruction = fitText(template.qrInstruction.toUpperCase(), 42);
  const instructionWidth = bold.widthOfTextAtSize(instruction, 9);

  const qrImage = await pdf.embedPng(await createBrandedQrPng(input.ticketCode, template));
  const logoImage = await pdf.embedPng(await loadLogoPng());

  page.drawRectangle({ x: 0, y: 0, width: 420, height: 720, color: pageBg });
  page.drawRectangle({ x: 36, y: 48, width: 348, height: 624, color: white });

  page.drawCircle({ x: 36, y: 672, size: 18, color: pageBg });
  page.drawCircle({ x: 384, y: 672, size: 18, color: pageBg });
  page.drawCircle({ x: 36, y: 48, size: 18, color: pageBg });
  page.drawCircle({ x: 384, y: 48, size: 18, color: pageBg });

  page.drawRectangle({ x: 36, y: 488, width: 348, height: 184, color: navy });
  page.drawCircle({ x: 36, y: 672, size: 18, color: pageBg });
  page.drawCircle({ x: 384, y: 672, size: 18, color: pageBg });

  page.drawCircle({ x: 210, y: 638, size: 22, color: white });
  page.drawImage(logoImage, { x: 194, y: 622, width: 32, height: 32 });
  page.drawRectangle({ x: 210 - (passWidth + 24) / 2, y: 598, width: passWidth + 24, height: 16, color: white });
  page.drawText(passLabel, { x: 210 - passWidth / 2, y: 602, size: 8, font: bold, color: navy });

  page.drawText(brand, { x: 210 - brandWidth / 2, y: 548, size: brandSize, font: bold, color: white });
  page.drawRectangle({
    x: 210 - slugBoxW / 2,
    y: 516,
    width: slugBoxW,
    height: slugBoxH,
    borderColor: gold,
    borderWidth: 1,
    color: rgb(190 / 255, 143 / 255, 63 / 255),
    opacity: 0.18,
    borderOpacity: 0.7,
  });
  page.drawText(slug, {
    x: 210 - slugWidth / 2,
    y: 516 + slugPadY + 1,
    size: slugSize,
    font: bold,
    color: gold,
  });

  page.drawText(fitText(input.eventTitle, 36), { x: 56, y: 470, size: 12, font: bold, color: navy });
  drawLabel(page, "Date", 56, 442, bold);
  drawValue(page, dateLabel, 56, 426, bold, 12);
  drawLabel(page, "Doors", 220, 442, bold);
  drawValue(page, timeLabel, 220, 426, bold, 12);
  drawLabel(page, "Venue", 56, 398, bold);
  drawValue(page, `${input.venueName}${input.area ? `, ${input.area}` : ""}`, 56, 382, bold, 11);
  drawLabel(page, "Order", 220, 398, bold);
  drawValue(page, input.orderReference, 220, 382, bold, 10);
  drawLabel(page, "Pass type", 56, 354, bold);
  drawValue(page, input.ticketName, 56, 338, bold, 11);
  drawLabel(page, "Day", 220, 354, bold);
  drawValue(page, weekday, 220, 338, regular, 10);

  page.drawCircle({ x: 36, y: notchY, size: 14, color: pageBg });
  page.drawCircle({ x: 384, y: notchY, size: 14, color: pageBg });
  page.drawLine({ start: { x: 54, y: notchY }, end: { x: 366, y: notchY }, thickness: 1, color: muted, dashArray: [3, 4] });
  page.drawCircle({ x: 210, y: notchY, size: 12, color: navy });
  page.drawImage(logoImage, { x: 202, y: notchY - 8, width: 16, height: 16 });
  page.drawText(instruction, { x: 210 - instructionWidth / 2, y: notchY - 22, size: 9, font: bold, color: navy });
  page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });

  page.drawRectangle({ x: 36, y: 48, width: 348, height: 28, color: navy });
  page.drawCircle({ x: 36, y: 48, size: 18, color: pageBg });
  page.drawCircle({ x: 384, y: 48, size: 18, color: pageBg });
  page.drawText(`GUEST: ${fitText(input.buyerName.toUpperCase(), 24)}`, { x: 56, y: 58, size: 8, font: bold, color: white });
  page.drawText(`NO. ${ticketNo}`, { x: 320, y: 58, size: 8, font: bold, color: white });

  return Buffer.from(await pdf.save());
}
