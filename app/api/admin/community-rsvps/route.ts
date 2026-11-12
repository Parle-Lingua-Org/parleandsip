import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CommunityRsvpRecord } from "@/lib/community-rsvp";

type DbRow = {
  id: string;
  email: string;
  full_name: string;
  ticket_name: string;
  whatsapp: string;
  learning_french: string;
  french_level: string;
  motivations: string[] | null;
  motivations_other: string | null;
  hoping_to_gain: string[] | null;
  hoping_to_gain_other: string | null;
  expecting_most: string | null;
  allergies: string | null;
  heard_from: string;
  heard_from_other: string | null;
  following_social: string;
  created_at: string;
};

function mapRow(row: DbRow): CommunityRsvpRecord {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    ticketName: row.ticket_name,
    whatsapp: row.whatsapp,
    learningFrench: row.learning_french,
    frenchLevel: row.french_level,
    motivations: row.motivations ?? [],
    motivationsOther: row.motivations_other ?? "",
    hopingToGain: row.hoping_to_gain ?? [],
    hopingToGainOther: row.hoping_to_gain_other ?? "",
    expectingMost: row.expecting_most ?? "",
    allergies: row.allergies ?? "",
    heardFrom: row.heard_from,
    heardFromOther: row.heard_from_other ?? "",
    followingSocial: row.following_social,
    createdAt: row.created_at,
  };
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("community_rsvps")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ rsvps: ((data ?? []) as DbRow[]).map(mapRow) });
}
