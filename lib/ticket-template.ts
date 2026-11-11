import "server-only";

import { getSiteSettings, saveSiteSettings } from "@/lib/site-settings";
import { normalizeTicketTemplate, type TicketTemplate } from "@/lib/ticket-pdf-shared";

export async function getTicketTemplate(): Promise<TicketTemplate> {
  const settings = await getSiteSettings();
  return settings.ticketTemplate;
}

export async function saveTicketTemplate(template: TicketTemplate, updatedBy?: string | null) {
  const settings = await saveSiteSettings({ ticketTemplate: normalizeTicketTemplate(template) }, updatedBy);
  return settings.ticketTemplate;
}
