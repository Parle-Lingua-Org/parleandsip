"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, Mail, Save, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { notifyError, notifySuccess } from "@/lib/notify";

export default function AdminPinPage() {
  const [otp, setOtp] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  async function sendOtp() {
    setOtpBusy(true);
    try {
      const response = await fetch("/api/admin/pin/request-otp", { method: "POST" });
      const result = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to send OTP.");
      setOtpSent(true);
      notifySuccess(result.message ?? "OTP sent.");
    } catch (reason) {
      notifyError(reason, "Unable to send OTP.");
    } finally {
      setOtpBusy(false);
    }
  }

  async function updatePin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPin !== confirmPin) {
      notifyError("The new PIN and confirmation do not match.");
      return;
    }
    setSaveBusy(true);
    try {
      const response = await fetch("/api/admin/pin/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, newPin, confirmPin }),
      });
      const result = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to update PIN.");
      setOtp("");
      setNewPin("");
      setConfirmPin("");
      setOtpSent(false);
      notifySuccess(result.message ?? "Admin PIN updated.");
    } catch (reason) {
      notifyError(reason, "Unable to update PIN.");
    } finally {
      setSaveBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[9px] tracking-wide text-muted-foreground">ACCOUNT SECURITY</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Change admin PIN</h1>
        <p className="mt-2 max-w-2xl text-xs text-muted-foreground">
          Changing the PIN requires a one-time code emailed to the Parle & Sip Gmail inbox.
        </p>
      </div>

      <Card className="max-w-xl space-y-5 p-4 shadow-[4px_4px_0_var(--foreground)] sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center border-2 border-foreground bg-primary"><Shield size={18} /></span>
          <div>
            <h2 className="font-bold">Authorize with OTP</h2>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Step 1: send a code. Step 2: enter the code with your new 6-digit PIN.
            </p>
          </div>
        </div>

        <Button type="button" variant="outline" disabled={otpBusy} onClick={() => void sendOtp()}>
          <Mail size={14} /> {otpBusy ? "Sending…" : otpSent ? "Resend OTP" : "Send OTP to Parle Gmail"}
        </Button>

        <form className="grid gap-4" onSubmit={(event) => void updatePin(event)}>
          <label className="grid gap-1.5 text-xs font-semibold">
            OTP from email
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit code"
            />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold">
            New PIN
            <Input
              inputMode="numeric"
              autoComplete="new-password"
              pattern="\d{6}"
              maxLength={6}
              required
              value={newPin}
              onChange={(event) => setNewPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6 digits"
            />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold">
            Confirm new PIN
            <Input
              inputMode="numeric"
              autoComplete="new-password"
              pattern="\d{6}"
              maxLength={6}
              required
              value={confirmPin}
              onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Repeat PIN"
            />
          </label>
          <Button type="submit" disabled={saveBusy || otp.length !== 6 || newPin.length !== 6 || confirmPin.length !== 6}>
            <Save size={14} /> {saveBusy ? "Updating…" : "Update PIN"}
          </Button>
        </form>
        <p className="flex items-center gap-1 text-[9px] text-muted-foreground"><KeyRound size={12} /> Default PIN is 085213 until you change it.</p>
      </Card>
    </div>
  );
}
