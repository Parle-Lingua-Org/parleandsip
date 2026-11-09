"use client";

import { useState, type FormEvent } from "react";
import { Check, KeyRound, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AdminPasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (newPassword.length < 10) {
      setError("Use at least 10 characters for the new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The new password and confirmation do not match.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/admin/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword, confirmPassword }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to update the password.");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password updated successfully.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update the password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div><p className="font-mono text-[9px] tracking-wide text-muted-foreground">ACCOUNT SECURITY</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Change password</h1><p className="mt-2 text-xs text-muted-foreground">Passwords are stored and verified by Supabase Auth, never in the profiles table.</p></div>
      <Card className="max-w-xl p-5 shadow-[4px_4px_0_var(--foreground)] sm:p-6">
        <div className="mb-5 flex items-center gap-3"><span className="grid size-10 place-items-center border-2 border-foreground bg-primary"><KeyRound size={18} /></span><div><h2 className="font-bold">Update your admin password</h2><p className="mt-1 text-[10px] text-muted-foreground">Verify your current password before choosing a new one.</p></div></div>
        <form className="grid gap-4" onSubmit={changePassword}>
          <label className="grid gap-1.5 text-xs font-semibold">Current password<Input type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
          <label className="grid gap-1.5 text-xs font-semibold">New password<Input type="password" autoComplete="new-password" minLength={10} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
          <label className="grid gap-1.5 text-xs font-semibold">Confirm new password<Input type="password" autoComplete="new-password" minLength={10} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
          {error && <p role="alert" className="border-2 border-accent bg-accent/20 p-2 text-xs">{error}</p>}
          {message && <p role="status" className="flex items-center gap-2 border-2 border-primary bg-success p-2 text-xs"><Check size={14} />{message}</p>}
          <Button type="submit" disabled={busy} className="mt-1"><Save size={14} />{busy ? "Updating…" : "Update password"}</Button>
        </form>
      </Card>
    </div>
  );
}