import { requireAdmin } from "@/lib/admin-auth";
import { apiError } from "@/lib/api-response";
import type { SiteContent, SiteTheme } from "@/lib/site-data";
import { getSiteSettings, saveSiteSettings } from "@/lib/site-settings";
import type { TicketTemplate } from "@/lib/ticket-pdf-shared";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  try {
    return Response.json(await getSiteSettings());
  } catch (reason) {
    return apiError(reason, 500, "Unable to load site settings.");
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

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
    return apiError(reason, 500, "Unable to save site settings.");
  }
}
