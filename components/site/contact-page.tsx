"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteChrome } from "@/components/site/site-chrome";
import { useSiteSettingsQuery } from "@/hooks/use-site-data";
import { initialSiteData } from "@/lib/site-data";

export function ContactPage() {
  const settingsQuery = useSiteSettingsQuery();
  const content = settingsQuery.data?.content ?? initialSiteData.content;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <SiteChrome content={content} active="contact">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
        <section className="grid gap-8 py-10 md:grid-cols-[minmax(0,.95fr)_minmax(0,1.05fr)] md:py-14">
          <div>
            <p className="flex items-center gap-2 font-mono text-[9px] tracking-wider text-muted-foreground">
              <span className="size-2 border border-foreground bg-accent" />
              {settingsQuery.isLoading ? <Skeleton className="h-3 w-28" /> : content.contactPageEyebrow}
            </p>
            <h1 className="mt-4 text-[36px] font-bold leading-[1.02] tracking-[-1.5px] sm:text-[46px]">
              {settingsQuery.isLoading ? <Skeleton className="h-12 w-56" /> : content.contactPageTitle}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
              {settingsQuery.isLoading ? <Skeleton className="h-16 w-full" /> : content.contactPageDescription}
            </p>

            <div className="mt-6 grid gap-3">
              <a className="flex items-center gap-3 border-2 border-foreground bg-card p-4 shadow-[3px_3px_0_var(--foreground)]" href={`mailto:${content.contactEmail}`}>
                <span className="grid size-10 shrink-0 place-items-center border-2 border-foreground bg-primary"><Mail size={18} /></span>
                <span><span className="block font-mono text-[8px] tracking-wide text-muted-foreground">EMAIL</span><strong className="mt-1 block text-sm">{content.contactEmail}</strong></span>
              </a>
              <a className="flex items-center gap-3 border-2 border-foreground bg-card p-4 shadow-[3px_3px_0_var(--foreground)]" href={`https://wa.me/${content.contactWhatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                <span className="grid size-10 shrink-0 place-items-center border-2 border-foreground bg-secondary text-xs font-bold">WA</span>
                <span><span className="block font-mono text-[8px] tracking-wide text-muted-foreground">WHATSAPP</span><strong className="mt-1 block text-sm">{content.contactWhatsapp}</strong></span>
              </a>
              <a className="flex items-center gap-3 border-2 border-foreground bg-card p-4 shadow-[3px_3px_0_var(--foreground)]" href={`https://www.instagram.com/${content.instagramHandle.replace(/^@/, "")}/`} target="_blank" rel="noreferrer">
                <span className="grid size-10 shrink-0 place-items-center border-2 border-foreground bg-accent text-[10px] font-bold">IG</span>
                <span><span className="block font-mono text-[8px] tracking-wide text-muted-foreground">INSTAGRAM</span><strong className="mt-1 block text-sm">@{content.instagramHandle.replace(/^@/, "")}</strong></span>
              </a>
              <a className="flex items-center gap-3 border-2 border-foreground bg-card p-4 shadow-[3px_3px_0_var(--foreground)]" href={`https://www.tiktok.com/@${encodeURIComponent(content.tiktokHandle.replace(/^@/, ""))}`} target="_blank" rel="noreferrer">
                <span className="grid size-10 shrink-0 place-items-center border-2 border-foreground bg-foreground text-[10px] font-bold text-card">TT</span>
                <span><span className="block font-mono text-[8px] tracking-wide text-muted-foreground">TIKTOK</span><strong className="mt-1 block text-sm">@{content.tiktokHandle.replace(/^@/, "")}</strong></span>
              </a>
            </div>
          </div>

          <div className="border-2 border-foreground bg-card p-4 shadow-[4px_4px_0_var(--foreground)] sm:p-6">
            {sent ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                <span className="grid size-11 place-items-center border-2 border-foreground bg-primary"><Mail size={21} /></span>
                <p className="mt-4 font-mono text-[9px] text-muted-foreground">MESSAGE SENT</p>
                <h2 className="mt-1 text-2xl font-bold">Merci.</h2>
                <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-muted-foreground">
                  Your note reached {content.contactEmail}. We&apos;ll reply if a response is needed.
                </p>
                <Button type="button" className="mt-5" onClick={() => setSent(false)}>Send another</Button>
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setBusy(true);
                  setError("");
                  try {
                    const response = await fetch("/api/contact", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name: name.trim(),
                        email: email.trim(),
                        subject: subject.trim(),
                        message: message.trim(),
                      }),
                    });
                    const result = await response.json() as { error?: string };
                    if (!response.ok) throw new Error(result.error || "Unable to send your message.");
                    setSent(true);
                    setName("");
                    setEmail("");
                    setSubject("");
                    setMessage("");
                  } catch (reason) {
                    setError(reason instanceof Error ? reason.message : "Unable to send your message.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <div>
                  <p className="font-mono text-[9px] tracking-wide text-muted-foreground">WRITE TO US</p>
                  <h2 className="mt-1 text-xl font-bold">Send a message</h2>
                </div>
                {error ? <p role="alert" className="text-xs text-primary">{error}</p> : null}
                <label className="grid gap-1 text-[10px] font-semibold">Name<Input required value={name} onChange={(event) => setName(event.target.value)} /></label>
                <label className="grid gap-1 text-[10px] font-semibold">Email<Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
                <label className="grid gap-1 text-[10px] font-semibold">Subject<Input required value={subject} onChange={(event) => setSubject(event.target.value)} /></label>
                <label className="grid gap-1 text-[10px] font-semibold">Message<Textarea required rows={5} value={message} onChange={(event) => setMessage(event.target.value)} /></label>
                <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Send message"}</Button>
              </form>
            )}
          </div>
        </section>
      </div>
    </SiteChrome>
  );
}
