import { listPublishedEvents } from "@/lib/events";

export async function GET() {
  try {
    const events = await listPublishedEvents();
    return Response.json({ events });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Unable to load events.";
    return Response.json({ error: message }, { status: 500 });
  }
}
