import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { defaultTicketTemplate, normalizeTicketTemplate, type TicketTemplate } from "@/lib/ticket-pdf-shared";

export async function getTicketTemplate(): Promise<TicketTemplate> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("site_settings")
      .select("content")
      .eq("setting_key", "main")
      .maybeSingle();
    if (error || !data?.content) return defaultTicketTemplate;
    const content = data.content as Record<string, unknown>;
    return normalizeTicketTemplate(content.ticketTemplate);
  } catch {
    return defaultTicketTemplate;
  }
}

export async function saveTicketTemplate(template: TicketTemplate, updatedBy?: string | null) {
  const admin = createAdminClient();
  const nextTemplate = normalizeTicketTemplate(template);
  const { data, error } = await admin
    .from("site_settings")
    .select("content")
    .eq("setting_key", "main")
    .maybeSingle();
  if (error) throw new Error(error.message);

  const currentContent = (data?.content && typeof data.content === "object" ? data.content : {}) as Record<string, unknown>;
  const payload = {
    setting_key: "main",
    content: { ...currentContent, ticketTemplate: nextTemplate },
    updated_by: updatedBy ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertError } = await admin.from("site_settings").upsert(payload, { onConflict: "setting_key" });
  if (upsertError) throw new Error(upsertError.message);
  return nextTemplate;
}
