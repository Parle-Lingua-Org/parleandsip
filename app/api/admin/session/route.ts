import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return Response.json({ error: "Not signed in." }, { status: 401 });

  const { data: profile, error: profileError } = await supabase.from("profiles").select("role, username").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") return Response.json({ error: "Administrator access required." }, { status: 403 });

  return Response.json({ email: user.email, username: profile.username });
}