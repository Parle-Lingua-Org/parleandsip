import { getSiteSettings } from "@/lib/site-settings";

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return Response.json(settings);
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Unable to load site settings.";
    return Response.json({ error: message }, { status: 500 });
  }
}
