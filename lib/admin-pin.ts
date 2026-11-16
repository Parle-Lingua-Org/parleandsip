import "server-only";

import { createHash, randomInt, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

export const DEFAULT_ADMIN_PIN = "085213";
export const ADMIN_PIN_COOKIE = "pas_admin_pin";
const PIN_COOKIE_TTL_MS = 12 * 60 * 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;

function cookieSecret() {
  return process.env.ADMIN_PIN_COOKIE_SECRET
    || process.env.SUPABASE_SERVICE_SECRET_KEY
    || process.env.RESEND_API_KEY
    || "parle-and-sip-admin-pin";
}

function hashValue(value: string, salt: string) {
  return scryptSync(value, salt, 32).toString("hex");
}

function verifyHash(value: string, stored: string) {
  const [salt, digest] = stored.split(":");
  if (!salt || !digest) return false;
  const next = hashValue(value, salt);
  try {
    return timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(next, "hex"));
  } catch {
    return false;
  }
}

export function hashSecret(value: string) {
  const salt = createHash("sha256").update(`${Date.now()}-${randomInt(1_000_000_000)}`).digest("hex").slice(0, 16);
  return `${salt}:${hashValue(value, salt)}`;
}

function signPayload(payload: string) {
  return createHash("sha256").update(`${payload}.${cookieSecret()}`).digest("hex");
}

export async function createPinUnlockCookie(userId: string) {
  const expiresAt = Date.now() + PIN_COOKIE_TTL_MS;
  const payload = `${userId}.${expiresAt}`;
  const value = `${payload}.${signPayload(payload)}`;
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_PIN_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(PIN_COOKIE_TTL_MS / 1000),
  });
}

export async function clearPinUnlockCookie() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_PIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function isAdminPinUnlocked(userId: string) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ADMIN_PIN_COOKIE)?.value ?? "";
  const [user, expiresAt, signature] = raw.split(".");
  if (!user || !expiresAt || !signature || user !== userId) return false;
  if (Number(expiresAt) < Date.now()) return false;
  const expected = signPayload(`${user}.${expiresAt}`);
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

type PinSecurityRow = {
  admin_pin_hash: string | null;
  admin_pin_otp_hash: string | null;
  admin_pin_otp_expires_at: string | null;
};

async function readSecurity(): Promise<PinSecurityRow> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("site_settings")
    .select("admin_pin_hash, admin_pin_otp_hash, admin_pin_otp_expires_at")
    .eq("setting_key", "main")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return {
    admin_pin_hash: data?.admin_pin_hash ?? null,
    admin_pin_otp_hash: data?.admin_pin_otp_hash ?? null,
    admin_pin_otp_expires_at: data?.admin_pin_otp_expires_at ?? null,
  };
}

export function normalizePin(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidPin(value: string) {
  return /^\d{6}$/.test(value);
}

export async function verifyAdminPin(pin: string) {
  const normalized = normalizePin(pin);
  if (!isValidPin(normalized)) return false;
  const security = await readSecurity();
  if (!security.admin_pin_hash) return normalized === DEFAULT_ADMIN_PIN;
  return verifyHash(normalized, security.admin_pin_hash);
}

export async function requestPinChangeOtp() {
  const otp = String(randomInt(100000, 999999));
  const admin = createAdminClient();
  const { error } = await admin
    .from("site_settings")
    .update({
      admin_pin_otp_hash: hashSecret(otp),
      admin_pin_otp_expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("setting_key", "main");
  if (error) throw new Error(error.message);

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const inbox = process.env.CONTACT_INBOX_EMAIL?.trim() || "Parlelinguaservices@gmail.com";
  if (!apiKey || !from) throw new Error("Email is not configured on the server.");

  const resend = new Resend(apiKey);
  const { error: emailError } = await resend.emails.send({
    from,
    to: [inbox],
    subject: "Parle & Sip admin PIN change code",
    html: `<div style="max-width:560px;margin:0 auto;padding:24px;background:#f5f6f8;color:#192637;font-family:Arial,sans-serif">
      <header style="padding:18px;background:#192637;color:#fff">
        <p style="margin:0;color:#be8f3f;font-size:11px;letter-spacing:2px">PARLE & SIP</p>
        <h1 style="margin:10px 0 0;font-size:22px">Admin PIN change code</h1>
      </header>
      <p style="margin:22px 0 8px;font-size:14px">Use this one-time code to authorize an admin PIN change:</p>
      <p style="margin:0;font-size:32px;font-weight:700;letter-spacing:6px">${otp}</p>
      <p style="margin:18px 0 0;color:#526173;font-size:12px">This code expires in 10 minutes. If you did not request it, ignore this email.</p>
    </div>`,
  });
  if (emailError) throw new Error(emailError.message);
  return { inbox };
}

export async function updateAdminPin(otp: string, nextPin: string) {
  const normalizedOtp = normalizePin(otp);
  const normalizedPin = normalizePin(nextPin);
  if (!isValidPin(normalizedOtp)) throw new Error("Enter the 6-digit OTP from email.");
  if (!isValidPin(normalizedPin)) throw new Error("Use a 6-digit PIN.");

  const security = await readSecurity();
  if (!security.admin_pin_otp_hash || !security.admin_pin_otp_expires_at) {
    throw new Error("Request a new OTP first.");
  }
  if (new Date(security.admin_pin_otp_expires_at).getTime() < Date.now()) {
    throw new Error("That OTP has expired. Request a new one.");
  }
  if (!verifyHash(normalizedOtp, security.admin_pin_otp_hash)) {
    throw new Error("The OTP is incorrect.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("site_settings")
    .update({
      admin_pin_hash: hashSecret(normalizedPin),
      admin_pin_otp_hash: null,
      admin_pin_otp_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("setting_key", "main");
  if (error) throw new Error(error.message);
}
