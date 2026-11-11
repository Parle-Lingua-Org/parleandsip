import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { initialSiteData, type SiteContent, type SiteTheme } from "@/lib/site-data";
import { defaultTicketTemplate, normalizeTicketTemplate, type TicketTemplate } from "@/lib/ticket-pdf-shared";

export type SiteSettingsPayload = {
  content: SiteContent;
  theme: SiteTheme;
  ticketTemplate: TicketTemplate;
};

function asObject(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function normalizeSiteContent(value: unknown): SiteContent {
  return { ...initialSiteData.content, ...asObject(value) } as SiteContent;
}

export function normalizeSiteTheme(value: unknown): SiteTheme {
  return { ...initialSiteData.theme, ...asObject(value) } as SiteTheme;
}

export async function getSiteSettings(): Promise<SiteSettingsPayload> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("site_settings")
      .select("content, theme, logo_url, favicon_url")
      .eq("setting_key", "main")
      .maybeSingle();
    if (error || !data) {
      return {
        content: initialSiteData.content,
        theme: initialSiteData.theme,
        ticketTemplate: defaultTicketTemplate,
      };
    }
    const content = normalizeSiteContent(data.content);
    if (data.logo_url && !content.logoImage) content.logoImage = data.logo_url;
    if (data.favicon_url && !content.faviconImage) content.faviconImage = data.favicon_url;
    const rawContent = asObject(data.content);
    return {
      content,
      theme: normalizeSiteTheme(data.theme),
      ticketTemplate: normalizeTicketTemplate(rawContent.ticketTemplate),
    };
  } catch {
    return {
      content: initialSiteData.content,
      theme: initialSiteData.theme,
      ticketTemplate: defaultTicketTemplate,
    };
  }
}

export async function saveSiteSettings(
  input: { content?: Partial<SiteContent>; theme?: Partial<SiteTheme>; ticketTemplate?: TicketTemplate },
  updatedBy?: string | null,
) {
  const admin = createAdminClient();
  const current = await getSiteSettings();
  const nextContent = normalizeSiteContent({ ...current.content, ...input.content });
  const nextTheme = normalizeSiteTheme({ ...current.theme, ...input.theme });
  const nextTemplate = normalizeTicketTemplate(input.ticketTemplate ?? current.ticketTemplate);

  const payload = {
    setting_key: "main",
    content: { ...nextContent, ticketTemplate: nextTemplate },
    theme: nextTheme,
    logo_url: nextContent.logoImage || "",
    favicon_url: nextContent.faviconImage || "",
    updated_by: updatedBy ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin.from("site_settings").upsert(payload, { onConflict: "setting_key" });
  if (error) throw new Error(error.message);
  return {
    content: nextContent,
    theme: nextTheme,
    ticketTemplate: nextTemplate,
  };
}
