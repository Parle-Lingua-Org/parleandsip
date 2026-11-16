import { requireAdmin } from "@/lib/admin-auth";
import { apiError } from "@/lib/api-response";
import { deleteEvent, listAdminEvents, saveEvent } from "@/lib/events";
import type { EventSaveInput } from "@/lib/events-shared";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  try {
    return Response.json({ events: await listAdminEvents() });
  } catch (reason) {
    return apiError(reason, 500, "Unable to load events.");
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  let body: { event?: EventSaveInput };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.event) return Response.json({ error: "Event details are required." }, { status: 400 });

  try {
    const event = await saveEvent(body.event, auth.user.id);
    return Response.json({ event });
  } catch (reason) {
    return apiError(reason, 500, "Unable to save event.");
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const eventId = new URL(request.url).searchParams.get("id")?.trim();
  if (!eventId) return Response.json({ error: "Event id is required." }, { status: 400 });

  try {
    await deleteEvent(eventId);
    return Response.json({ ok: true });
  } catch (reason) {
    return apiError(reason, 500, "Unable to delete event.");
  }
}
