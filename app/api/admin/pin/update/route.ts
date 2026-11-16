import {
  clearPinUnlockCookie,
  createPinUnlockCookie,
  isValidPin,
  normalizePin,
  updateAdminPin,
} from "@/lib/admin-pin";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  let body: { otp?: string; newPin?: string; confirmPin?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const otp = normalizePin(body.otp ?? "");
  const newPin = normalizePin(body.newPin ?? "");
  const confirmPin = normalizePin(body.confirmPin ?? "");
  if (!isValidPin(otp)) return Response.json({ error: "Enter the 6-digit OTP from email." }, { status: 400 });
  if (!isValidPin(newPin)) return Response.json({ error: "Use a 6-digit PIN." }, { status: 400 });
  if (newPin !== confirmPin) return Response.json({ error: "The new PIN and confirmation do not match." }, { status: 400 });

  try {
    await updateAdminPin(otp, newPin);
    await clearPinUnlockCookie();
    await createPinUnlockCookie(auth.user.id);
    return Response.json({ ok: true, message: "Admin PIN updated." });
  } catch (reason) {
    return Response.json({
      error: reason instanceof Error ? reason.message : "Unable to update PIN.",
    }, { status: 400 });
  }
}
