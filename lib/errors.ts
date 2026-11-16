/** Maps raw API / DB / network errors into short user-facing copy. */
export function toUserMessage(reason: unknown, fallback = "Something went wrong. Please try again.") {
  const raw = reason instanceof Error
    ? reason.message
    : typeof reason === "string"
      ? reason
      : "";
  const message = raw.trim();
  if (!message) return fallback;

  const lower = message.toLowerCase();

  if (/index row requires|maximum size is 8191|value too long/i.test(message)) {
    return "One of the images is too large to save. Re-upload it, then try again.";
  }
  if (/ticket sales have ended|sales have closed|sales_end/i.test(message)) {
    return "Ticket sales for this experience have closed.";
  }
  if (/ticket sales have not started/i.test(message)) {
    return "Ticket sales for this experience have not opened yet.";
  }
  if (/sold out|capacity|quantity_sold/i.test(message)) {
    return "Those tickets are no longer available. Choose another type or quantity.";
  }
  if (/duplicate key|unique constraint|already exists/i.test(message)) {
    return "That record already exists. Change the name or details and try again.";
  }
  if (/row level security|permission denied|not authorized|jwt/i.test(message)) {
    return "You do not have permission to do that. Sign in again and retry.";
  }
  if (/fetch failed|network|failed to fetch|econnrefused|enotfound/i.test(message)) {
    return "Could not reach the server. Check your connection and try again.";
  }
  if (/unable to verify the first certificate|unable_to_verify_leaf_signature/i.test(message)) {
    return "Could not connect securely to the database. Check certificates and try again.";
  }
  if (/paystack/i.test(message) && /not configured|secret/i.test(message)) {
    return "Payments are not configured on the server yet.";
  }
  if (/resend|email is not configured/i.test(message)) {
    return "Email is not configured on the server yet.";
  }
  if (/invalid login|invalid credentials|email or password is incorrect/i.test(message)) {
    return "Email or password is incorrect.";
  }
  if (/admin pin required/i.test(message)) {
    return "Enter the admin PIN to continue.";
  }
  if (/incorrect pin/i.test(message)) {
    return "That PIN is incorrect.";
  }
  if (/otp/i.test(message) && /expired/i.test(message)) {
    return "That code has expired. Request a new one.";
  }
  if (/otp/i.test(message) && /incorrect|invalid/i.test(message)) {
    return "That code is incorrect.";
  }
  if (/bucket|storage/i.test(message) && /not found|does not exist/i.test(message)) {
    return "Image storage is not ready. Try again in a moment.";
  }
  if (/violates check constraint|22p02|invalid input/i.test(message)) {
    return "Some details look invalid. Check the form and try again.";
  }

  // Prefer short, human messages; strip raw SQL-ish dumps.
  if (message.length > 180 || /select |insert |update |alter |constraint |sqlstate/i.test(lower)) {
    return fallback;
  }

  return message;
}
