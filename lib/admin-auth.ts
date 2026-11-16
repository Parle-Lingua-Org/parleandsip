import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isAdminPinUnlocked } from "@/lib/admin-pin";

type AdminOk = {
  user: { id: string; email?: string | null };
  username: string | null;
  error?: undefined;
};

type AdminErr = {
  user?: undefined;
  username?: undefined;
  error: Response;
};

export async function requireAdmin(options?: { requirePin?: boolean }): Promise<AdminOk | AdminErr> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: Response.json({ error: "Not signed in." }, { status: 401 }) };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, username")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || profile?.role !== "admin") {
    return { error: Response.json({ error: "Administrator access required." }, { status: 403 }) };
  }

  if (options?.requirePin !== false) {
    const unlocked = await isAdminPinUnlocked(user.id);
    if (!unlocked) return { error: Response.json({ error: "Admin PIN required." }, { status: 403 }) };
  }

  return { user, username: profile.username ?? null };
}
