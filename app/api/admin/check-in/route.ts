import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type CheckInRow = {
  ticket_code_id: string;
  event_title: string;
  buyer_name: string;
  ticket_name: string;
  ticket_status: string;
  checked_in_at: string;
};

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: Response.json({ error: "Not signed in." }, { status: 401 }) };

  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") {
    return { error: Response.json({ error: "Administrator access required." }, { status: 403 }) };
  }

  return { supabase };
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("events")
    .select("id, title, starts_at, area, status")
    .order("starts_at", { ascending: true });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({
    events: (data ?? []).map((event) => ({
      id: event.id,
      title: event.title,
      startsAt: event.starts_at,
      area: event.area,
      status: event.status,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  let body: { ticketCode?: string; eventId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid check-in request." }, { status: 400 });
  }

  const ticketCode = body.ticketCode?.trim() ?? "";
  const eventId = body.eventId?.trim() ?? "";
  if (!eventId) return Response.json({ error: "Select the event before scanning tickets." }, { status: 400 });
  if (!ticketCode || ticketCode.length > 200) return Response.json({ error: "Scan or enter a valid ticket code." }, { status: 400 });

  const { data, error: checkInError } = await auth.supabase.rpc("admin_check_in_ticket", {
    p_ticket_code: ticketCode,
    p_event_id: eventId,
  });
  if (checkInError) return Response.json({ error: checkInError.message }, { status: 409 });

  const row = (Array.isArray(data) ? data[0] : data) as CheckInRow | null;
  if (!row?.ticket_code_id) return Response.json({ error: "Unable to check this ticket in." }, { status: 500 });

  return Response.json({
    ticketId: row.ticket_code_id,
    eventTitle: row.event_title,
    buyerName: row.buyer_name,
    ticketName: row.ticket_name,
    status: row.ticket_status,
    checkedInAt: row.checked_in_at,
  });
}
