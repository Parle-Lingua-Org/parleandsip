import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.email || !body.password) return Response.json({ error: "Email and password are required." }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: body.email.trim(), password: body.password });
  if (error || !data.user) return Response.json({ error: "Email or password is incorrect." }, { status: 401 });

  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") {
    await supabase.auth.signOut();
    return Response.json({ error: "This account does not have administrator access." }, { status: 403 });
  }

  return Response.json({ email: data.user.email });
}