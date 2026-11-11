import { requireAdmin } from "@/lib/admin-auth";
import type { SiteContent, SiteTheme } from "@/lib/site-data";
import { getSiteSettings, saveSiteSettings } from "@/lib/site-settings";
import type { TicketTemplate } from "@/lib/ticket-pdf-shared";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  try {
    return Response.json(await getSiteSettings());
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Unable to load site settings.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  let body: { content?: Partial<SiteContent>; theme?: Partial<SiteTheme>; ticketTemplate?: TicketTemplate };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const settings = await saveSiteSettings(body, auth.user.id);
    return Response.json(settings);
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Unable to save site settings.";
    return Response.json({ error: message }, { status: 500 });
  }
}
