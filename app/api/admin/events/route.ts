import { requireAdmin } from "@/lib/admin-auth";
import { deleteEvent, listAdminEvents, saveEvent } from "@/lib/events";
import type { EventSaveInput } from "@/lib/events-shared";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  try {
    return Response.json({ events: await listAdminEvents() });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Unable to load events.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

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
    const message = reason instanceof Error ? reason.message : "Unable to save event.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const eventId = new URL(request.url).searchParams.get("id")?.trim();
  if (!eventId) return Response.json({ error: "Event id is required." }, { status: 400 });

  try {
    await deleteEvent(eventId);
    return Response.json({ ok: true });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Unable to delete event.";
    return Response.json({ error: message }, { status: 500 });
  }
}
