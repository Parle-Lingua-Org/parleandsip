import { requestPinChangeOtp } from "@/lib/admin-pin";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const result = await requestPinChangeOtp();
    return Response.json({
      ok: true,
      message: `A one-time code was sent to ${result.inbox}.`,
      inbox: result.inbox,
    });
  } catch (reason) {
    return Response.json({
      error: reason instanceof Error ? reason.message : "Unable to send OTP.",
    }, { status: 500 });
  }
}
