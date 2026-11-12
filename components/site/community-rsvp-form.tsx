"use client";

import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FRENCH_LEVEL_OPTIONS,
  FOLLOWING_SOCIAL_OPTIONS,
  HEARD_FROM_OPTIONS,
  HOPING_TO_GAIN_OPTIONS,
  LEARNING_FRENCH_OPTIONS,
  MOTIVATION_OPTIONS,
} from "@/lib/community-rsvp";

function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function ChoiceButton({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`flex min-h-10 items-center border-2 px-3 text-left text-[11px] transition-colors ${selected ? "border-foreground bg-secondary" : "border-input bg-card hover:border-foreground"}`}
    >
      {children}
    </button>
  );
}

export function CommunityRsvpForm({ onDone }: { onDone?: () => void }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [ticketName, setTicketName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [learningFrench, setLearningFrench] = useState("");
  const [frenchLevel, setFrenchLevel] = useState("");
  const [motivations, setMotivations] = useState<string[]>([]);
  const [motivationsOther, setMotivationsOther] = useState("");
  const [hopingToGain, setHopingToGain] = useState<string[]>([]);
  const [hopingToGainOther, setHopingToGainOther] = useState("");
  const [expectingMost, setExpectingMost] = useState("");
  const [allergies, setAllergies] = useState("");
  const [heardFrom, setHeardFrom] = useState("");
  const [heardFromOther, setHeardFromOther] = useState("");
  const [followingSocial, setFollowingSocial] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!learningFrench || !frenchLevel || !heardFrom || !followingSocial) {
      setError("Please answer all required choice questions.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/community-rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fullName,
          ticketName,
          whatsapp,
          learningFrench,
          frenchLevel,
          motivations,
          motivationsOther,
          hopingToGain,
          hopingToGainOther,
          expectingMost,
          allergies,
          heardFrom,
          heardFromOther,
          followingSocial,
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to submit RSVP.");
      setSent(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to submit RSVP.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center p-6 text-center">
        <span className="grid size-11 place-items-center border-2 border-foreground bg-primary"><Check size={21} /></span>
        <p className="mt-4 font-mono text-[9px] text-muted-foreground">RSVP RECEIVED</p>
        <h3 className="mt-1 text-2xl font-bold">Merci, {ticketName || fullName}.</h3>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-muted-foreground">
          Your place is noted. We&apos;ll use {ticketName || "your preferred name"} on the ticket and stay in touch on WhatsApp.
        </p>
        {onDone ? <Button type="button" className="mt-5" onClick={onDone}>Close</Button> : null}
      </div>
    );
  }

  return (
    <form className="max-h-[min(70dvh,720px)] space-y-5 overflow-y-auto p-4 sm:p-5" onSubmit={(event) => void submit(event)}>
      {/* <div>
        <p className="font-mono text-[9px] tracking-wide text-muted-foreground">RSVP · ABUJA PARLE FRANÇAIS</p>
        <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
          Event: 1st Floor, Tropic Gallery Mall, beside Grand Square, CBD, Abuja. Required fields are marked *.
        </p>
      </div> */}
      {error ? <p role="alert" className="border-2 border-primary bg-card px-3 py-2 text-xs text-primary">{error}</p> : null}

      <section className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-[10px] font-semibold sm:col-span-2">1. Email *<Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label className="grid gap-1 text-[10px] font-semibold">2. Full name *<Input required value={fullName} onChange={(event) => setFullName(event.target.value)} /></label>
        <label className="grid gap-1 text-[10px] font-semibold">3. Prefered name for ticket *<Input required value={ticketName} onChange={(event) => setTicketName(event.target.value)} placeholder="First name for the ticket" /></label>
        <label className="grid gap-1 text-[10px] font-semibold sm:col-span-2">4. WhatsApp number *<Input required value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} placeholder="+234..." /></label>
      </section>

      <section className="space-y-3 border-t border-dap-border-muted pt-4">
        <p className="font-mono text-[8px] tracking-wide text-muted-foreground">YOUR LANGUAGE JOURNEY</p>
        <fieldset className="space-y-2">
          <legend className="text-[10px] font-semibold">5. Are you currently learning / studying French? *</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {LEARNING_FRENCH_OPTIONS.map((option) => (
              <ChoiceButton key={option} selected={learningFrench === option} onSelect={() => setLearningFrench(option)}>
                {option}
              </ChoiceButton>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="text-[10px] font-semibold">6. How would you describe your current level of French? *</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {FRENCH_LEVEL_OPTIONS.map((option) => (
              <ChoiceButton key={option} selected={frenchLevel === option} onSelect={() => setFrenchLevel(option)}>
                {option}
              </ChoiceButton>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="text-[10px] font-semibold">7. What motivates your interest in French? *</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {MOTIVATION_OPTIONS.map((option) => (
              <label key={option} className={`flex min-h-10 cursor-pointer items-center gap-2 border-2 px-3 text-[11px] ${motivations.includes(option) ? "border-foreground bg-secondary" : "border-input bg-card"}`}>
                <input type="checkbox" checked={motivations.includes(option)} onChange={() => setMotivations((current) => toggleValue(current, option))} />
                {option}
              </label>
            ))}
          </div>
          {motivations.includes("Other") ? <Input required value={motivationsOther} onChange={(event) => setMotivationsOther(event.target.value)} placeholder="Tell us more" /> : null}
        </fieldset>
      </section>

      <section className="space-y-3 border-t border-dap-border-muted pt-4">
        <p className="font-mono text-[8px] tracking-wide text-muted-foreground">YOUR EXPECTATIONS</p>
        <fieldset className="space-y-2">
          <legend className="text-[10px] font-semibold">8. What are you hoping to gain from Parle & Sip? *</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {HOPING_TO_GAIN_OPTIONS.map((option) => (
              <label key={option} className={`flex min-h-10 cursor-pointer items-center gap-2 border-2 px-3 text-[11px] ${hopingToGain.includes(option) ? "border-foreground bg-secondary" : "border-input bg-card"}`}>
                <input type="checkbox" checked={hopingToGain.includes(option)} onChange={() => setHopingToGain((current) => toggleValue(current, option))} />
                {option}
              </label>
            ))}
          </div>
          {hopingToGain.includes("Other") ? <Input required value={hopingToGainOther} onChange={(event) => setHopingToGainOther(event.target.value)} placeholder="Tell us more" /> : null}
        </fieldset>
        <label className="grid gap-1 text-[10px] font-semibold">9. What are you expecting the most from the community? *<Textarea required rows={3} value={expectingMost} onChange={(event) => setExpectingMost(event.target.value)} /></label>
        <label className="grid gap-1 text-[10px] font-semibold">10. Any allergies or dietary requirements? *<Input required value={allergies} onChange={(event) => setAllergies(event.target.value)} placeholder="None, or list them" /></label>
      </section>

      <section className="space-y-3 border-t border-dap-border-muted pt-4">
        <p className="font-mono text-[8px] tracking-wide text-muted-foreground">COMMUNITY</p>
        <fieldset className="space-y-2">
          <legend className="text-[10px] font-semibold">11. How did you hear about Parle & Sip? *</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {HEARD_FROM_OPTIONS.map((option) => (
              <ChoiceButton key={option} selected={heardFrom === option} onSelect={() => setHeardFrom(option)}>
                {option}
              </ChoiceButton>
            ))}
          </div>
          {heardFrom === "Other" ? <Input required value={heardFromOther} onChange={(event) => setHeardFromOther(event.target.value)} placeholder="Where did you hear about us?" /> : null}
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="text-[10px] font-semibold">12. Are you following us on social media? *</legend>
          <p className="text-[10px] text-muted-foreground">TikTok @parle.sip · Instagram @parlesip</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {FOLLOWING_SOCIAL_OPTIONS.map((option) => (
              <ChoiceButton key={option} selected={followingSocial === option} onSelect={() => setFollowingSocial(option)}>
                {option}
              </ChoiceButton>
            ))}
          </div>
        </fieldset>
      </section>

      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Submitting…" : "Join The Community"}</Button>
    </form>
  );
}
