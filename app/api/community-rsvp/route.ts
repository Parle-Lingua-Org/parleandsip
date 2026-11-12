import { createAdminClient } from "@/lib/supabase/admin";
import { validateCommunityRsvp } from "@/lib/community-rsvp";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const validated = validateCommunityRsvp(body as Parameters<typeof validateCommunityRsvp>[0]);
  if ("error" in validated || !validated.data) {
    return Response.json({ error: validated.error ?? "Invalid RSVP." }, { status: 400 });
  }

  const input = validated.data;
  const admin = createAdminClient();
  const { error } = await admin.from("community_rsvps").insert({
    email: input.email,
    full_name: input.fullName,
    ticket_name: input.ticketName,
    whatsapp: input.whatsapp,
    learning_french: input.learningFrench,
    french_level: input.frenchLevel,
    motivations: input.motivations,
    motivations_other: input.motivationsOther ?? "",
    hoping_to_gain: input.hopingToGain,
    hoping_to_gain_other: input.hopingToGainOther ?? "",
    expecting_most: input.expectingMost,
    allergies: input.allergies,
    heard_from: input.heardFrom,
    heard_from_other: input.heardFromOther ?? "",
    following_social: input.followingSocial,
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
