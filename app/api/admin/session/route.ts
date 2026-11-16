import { isAdminPinUnlocked } from "@/lib/admin-pin";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const auth = await requireAdmin({ requirePin: false });
  if (auth.error) return auth.error;

  const pinUnlocked = await isAdminPinUnlocked(auth.user.id);
  return Response.json({
    email: auth.user.email,
    username: auth.username,
    pinUnlocked,
  });
}
