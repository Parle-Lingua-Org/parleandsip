import { createPinUnlockCookie, isAdminPinUnlocked } from "@/lib/admin-pin";
import { requireAdmin } from "@/lib/admin-auth";

/** Sliding refresh while the admin is active — extends PIN unlock without re-entering the PIN. */
export async function POST() {
  const auth = await requireAdmin({ requirePin: false });
  if (auth.error) return auth.error;

  const unlocked = await isAdminPinUnlocked(auth.user.id);
  if (!unlocked) {
    return Response.json({ pinUnlocked: false }, { status: 403 });
  }

  await createPinUnlockCookie(auth.user.id);
  return Response.json({ pinUnlocked: true });
}
