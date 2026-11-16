import { clearPinUnlockCookie } from "@/lib/admin-pin";
import { requireAdmin } from "@/lib/admin-auth";

/** Clear PIN unlock after inactivity — keeps the Supabase login session. */
export async function POST() {
  const auth = await requireAdmin({ requirePin: false });
  if (auth.error) return auth.error;

  await clearPinUnlockCookie();
  return Response.json({ pinUnlocked: false });
}
