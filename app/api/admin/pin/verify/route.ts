import {
  createPinUnlockCookie,
  isValidPin,
  normalizePin,
  verifyAdminPin,
} from "@/lib/admin-pin";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const auth = await requireAdmin({ requirePin: false });
  if (auth.error) return auth.error;

  let body: { pin?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const pin = normalizePin(body.pin ?? "");
  if (!isValidPin(pin)) return Response.json({ error: "Enter your 6-digit admin PIN." }, { status: 400 });
  const ok = await verifyAdminPin(pin);
  if (!ok) return Response.json({ error: "Incorrect PIN." }, { status: 401 });

  await createPinUnlockCookie(auth.user.id);
  return Response.json({ ok: true });
}
