import { clearPinUnlockCookie } from "@/lib/admin-pin";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  await clearPinUnlockCookie();
  const { error } = await supabase.auth.signOut();
  if (error) return Response.json({ error: "Unable to sign out." }, { status: 500 });
  return Response.json({ ok: true });
}
