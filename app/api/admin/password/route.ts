import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user?.email) return Response.json({ error: "Your session has expired. Sign in again." }, { status: 401 });

  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") return Response.json({ error: "Administrator access required." }, { status: 403 });

  let body: { currentPassword?: string; newPassword?: string; confirmPassword?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.currentPassword || !body.newPassword || !body.confirmPassword) return Response.json({ error: "Complete all password fields." }, { status: 400 });
  if (body.newPassword.length < 10) return Response.json({ error: "Use at least 10 characters for the new password." }, { status: 400 });
  if (body.newPassword !== body.confirmPassword) return Response.json({ error: "The new passwords do not match." }, { status: 400 });

  const { error: verifyError } = await supabase.auth.signInWithPassword({ email: user.email, password: body.currentPassword });
  if (verifyError) return Response.json({ error: "Current password is incorrect." }, { status: 400 });

  const { error: updateError } = await supabase.auth.updateUser({ password: body.newPassword });
  if (updateError) return Response.json({ error: updateError.message }, { status: 400 });
  return Response.json({ ok: true });
}