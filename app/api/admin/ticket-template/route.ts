import { createClient } from "@/lib/supabase/server";
import { normalizeTicketTemplate, type TicketTemplate } from "@/lib/ticket-pdf-shared";
import { getTicketTemplate, saveTicketTemplate } from "@/lib/ticket-template";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: Response.json({ error: "Not signed in." }, { status: 401 }) };

  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") {
    return { error: Response.json({ error: "Administrator access required." }, { status: 403 }) };
  }
  return { user };
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  return Response.json({ template: await getTicketTemplate() });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  let body: { template?: Partial<TicketTemplate> };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const template = await saveTicketTemplate(normalizeTicketTemplate(body.template), auth.user.id);
    return Response.json({ template });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Unable to save ticket template.";
    return Response.json({ error: message }, { status: 500 });
  }
}
