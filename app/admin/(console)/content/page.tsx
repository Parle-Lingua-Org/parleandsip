"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check, Palette, Save, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImagePicker } from "@/components/ui/image-picker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminEventsQuery, useSaveSiteSettingsMutation, useSiteSettingsQuery } from "@/hooks/use-site-data";
import { initialSiteData, type SiteContent, type SiteTheme } from "@/lib/site-data";

const themeFields: { key: keyof SiteTheme; label: string; note: string }[] = [
  { key: "background", label: "Page background", note: "Main canvas" },
  { key: "foreground", label: "Text & outlines", note: "Typography and borders" },
  { key: "primary", label: "Primary", note: "Main buttons and highlights" },
  { key: "secondary", label: "Secondary", note: "Soft panels" },
  { key: "muted", label: "Muted surface", note: "Subtle backgrounds" },
  { key: "mutedForeground", label: "Muted text", note: "Supporting copy" },
  { key: "accent", label: "Accent", note: "Calls to action" },
  { key: "ring", label: "Focus ring", note: "Keyboard focus" },
  { key: "info", label: "Info tint", note: "Illustrative accents" },
];

const palettePresets: { name: string; mood: string; colors: Pick<SiteTheme, "background" | "foreground" | "primary" | "secondary" | "muted" | "mutedForeground" | "accent" | "ring" | "info"> }[] = [
  { name: "Parle & Sip rouge", mood: "Navy, red, a touch of gold", colors: { background: "#f5f6f8", foreground: "#192637", primary: "#9a1f26", secondary: "#e5e9ef", muted: "#edf0f4", mutedForeground: "#526173", accent: "#be8f3f", ring: "#9a1f26", info: "#dce4ef" } },
  { name: "Atlantic", mood: "Cool lagoon + coral", colors: { background: "#eff6f2", foreground: "#173334", primary: "#70ddc6", secondary: "#d2e8df", muted: "#e2eee8", mutedForeground: "#526865", accent: "#fb8866", ring: "#17685f", info: "#cce2f1" } },
  { name: "Market day", mood: "Papaya + marigold", colors: { background: "#f6efe3", foreground: "#2c2118", primary: "#f5c957", secondary: "#e9dcc6", muted: "#eee5d7", mutedForeground: "#746556", accent: "#ef7559", ring: "#8a5228", info: "#d7e2ee" } },
  { name: "Night market", mood: "Electric leaf + sky", colors: { background: "#eaf0ec", foreground: "#13252a", primary: "#b9e86a", secondary: "#cfe0df", muted: "#dfe9e6", mutedForeground: "#53676a", accent: "#ff795c", ring: "#286171", info: "#c1dce8" } },
];

const contentSections: { title: string; description: string; fields: { key: keyof SiteContent; label: string; multiline?: boolean }[] }[] = [
  { title: "Header & announcement", description: "Brand identity and top navigation copy.", fields: [{ key: "brandName", label: "Brand name" }, { key: "announcement", label: "Announcement banner" }, { key: "navExplore", label: "Explore link" }, { key: "navCommunity", label: "Community link" }, { key: "navPros", label: "Language pros link" }, { key: "navContact", label: "Contact link" }] },
  { title: "Hero", description: "Featured message and cover image.", fields: [{ key: "heroEyebrow", label: "Eyebrow" }, { key: "heroTitle", label: "Heading, line one" }, { key: "heroSecondLine", label: "Heading, line two" }, { key: "heroDescription", label: "Description", multiline: true }] },
  { title: "Bento sections", description: "The supporting homepage panels.", fields: [{ key: "promptTitle", label: "Prompt heading" }, { key: "promptEmphasis", label: "Prompt emphasis" }, { key: "promptCaption", label: "Prompt caption" }, { key: "calendarTitle", label: "Calendar panel title" }, { key: "communityTitle", label: "Community panel headline", multiline: true }, { key: "communityCta", label: "Community link label" }] },
  { title: "Meetups & language pros", description: "Section labels and host callout.", fields: [{ key: "eventsEyebrow", label: "Meetups eyebrow" }, { key: "eventsTitle", label: "Meetups headline" }, { key: "eventsEmphasis", label: "Meetups headline emphasis" }, { key: "proEyebrow", label: "Language pros eyebrow" }, { key: "proTitle", label: "Language pros headline" }, { key: "proEmphasis", label: "Language pros emphasis" }, { key: "proDescription", label: "Language pros description", multiline: true }, { key: "proCta", label: "Host event link label" }] },
  { title: "City & areas", description: "Controls the public area filter and the areas admins can assign to events.", fields: [{ key: "cityName", label: "City name" }, { key: "areaFilterAll", label: "All-areas filter label" }, { key: "eventAreas", label: "Event areas, separated by commas", multiline: true }, { key: "footerLocation", label: "Footer location label" }] },
  { title: "Contact & social", description: "Email, WhatsApp, Instagram and TikTok shown on the public page.", fields: [{ key: "contactEmail", label: "Contact email" }, { key: "contactWhatsapp", label: "WhatsApp number" }, { key: "instagramHandle", label: "Instagram username" }, { key: "tiktokHandle", label: "TikTok username" }] },
  { title: "Footer", description: "Footer content shown on every public page.", fields: [{ key: "footerText", label: "Footer tagline" }, { key: "footerCurrency", label: "Currency label" }] },
];

export default function AdminContentPage() {
  const settingsQuery = useSiteSettingsQuery();
  const eventsQuery = useAdminEventsQuery();
  const saveMutation = useSaveSiteSettingsMutation();
  const [contentDraft, setContentDraft] = useState<SiteContent>(initialSiteData.content);
  const [themeDraft, setThemeDraft] = useState<SiteTheme>(initialSiteData.theme);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const events = eventsQuery.data ?? [];
  const activePalette = palettePresets.find((palette) => (Object.keys(palette.colors) as Array<keyof SiteTheme>).every((key) => palette.colors[key] === themeDraft[key]))?.name ?? "Custom palette";

  useEffect(() => {
    if (!settingsQuery.data) return;
    setContentDraft(settingsQuery.data.content);
    setThemeDraft(settingsQuery.data.theme);
  }, [settingsQuery.data]);

  function updateContentField<K extends keyof SiteContent>(key: K, value: SiteContent[K]) {
    setContentDraft((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function updateThemeField<K extends keyof SiteTheme>(key: K, value: SiteTheme[K]) {
    setThemeDraft((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function choosePalette(palette: (typeof palettePresets)[number]) {
    setThemeDraft((current) => ({ ...current, ...palette.colors }));
    setSaved(false);
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await saveMutation.mutateAsync({ content: contentDraft, theme: themeDraft });
      setSaved(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save site settings.");
    }
  }

  if (settingsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={(event) => void saveSettings(event)}>
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-[9px] tracking-wide text-muted-foreground">SUPABASE · BRAND, HOMEPAGE & THEME</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Site content</h1><p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">Edit the public header, hero, homepage panels, footer and shared palette. Changes save to Supabase for every visitor.</p></div><div className="flex items-center gap-3">{saved && <span role="status" className="flex items-center gap-1 text-xs text-dap-green"><Check size={14} /> Saved</span>}<Button type="submit" disabled={saveMutation.isPending}><Save size={14} /> {saveMutation.isPending ? "Saving…" : "Save all changes"}</Button></div></div>
      {error ? <p role="alert" className="border-2 border-primary bg-card px-3 py-2 text-xs text-primary">{error}</p> : null}

      <Card className="grid gap-5 p-4 shadow-[4px_4px_0_var(--foreground)] md:grid-cols-2 sm:p-6">
        <div><h2 className="font-bold">Logo</h2><p className="mt-1 text-[10px] text-muted-foreground">Upload an image or paste a direct image URL. Leave empty to use the text mark.</p><div className="mt-4"><ImagePicker label="Brand logo" value={contentDraft.logoImage} onChange={(value) => updateContentField("logoImage", value)} maxDimension={512} previewClassName="aspect-square max-w-32" /></div></div>
        <div><h2 className="font-bold">Favicon</h2><p className="mt-1 text-[10px] text-muted-foreground">A square icon is recommended. It updates in this browser after saving.</p><div className="mt-4"><ImagePicker label="Browser tab icon" value={contentDraft.faviconImage} onChange={(value) => updateContentField("faviconImage", value)} maxDimension={256} previewClassName="aspect-square max-w-32" /></div></div>
      </Card>

      {contentSections.map((section) => <Card key={section.title} className="p-4 shadow-[4px_4px_0_var(--foreground)] sm:p-6">
        <div className="mb-5"><h2 className="text-base font-bold">{section.title}</h2><p className="mt-1 text-[10px] text-muted-foreground">{section.description}</p></div>
        {section.title === "Hero" && <div className="mb-5 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,.9fr)]"><div className="grid content-start gap-3"><ImagePicker label="Featured hero image" value={contentDraft.heroImage} onChange={(value) => updateContentField("heroImage", value)} /></div><label className="grid content-start gap-1.5 text-[10px] font-semibold">Featured event<select className="h-10 border-2 border-input bg-card px-3 text-xs" value={contentDraft.featuredEventId} onChange={(event) => updateContentField("featuredEventId", event.target.value)}>{events.map((item) => <option key={item.id} value={item.slug}>{item.title}</option>)}</select><span className="text-[9px] font-normal text-muted-foreground">Uses the event slug Live for the featured title and ticket action.</span></label></div>}
        <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">{section.fields.map(({ key, label, multiline }) => <label key={key} className={`grid gap-1.5 text-[10px] font-semibold ${multiline ? "sm:col-span-2" : ""}`}>{label}{multiline ? <Textarea rows={2} value={contentDraft[key]} onChange={(event) => updateContentField(key, event.target.value)} /> : <Input value={contentDraft[key]} onChange={(event) => updateContentField(key, event.target.value)} />}</label>)}</div>
      </Card>)}

      <Card className="p-4 shadow-[4px_4px_0_var(--foreground)] sm:p-6">
        <div className="mb-5 flex items-start gap-3"><span className="grid size-9 place-items-center border-2 border-foreground bg-primary"><Palette size={17} /></span><div><h2 className="font-bold">Global palette</h2><p className="mt-1 text-[10px] text-muted-foreground">Start with a palette, then tune individual semantic colors.</p></div></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{palettePresets.map((palette) => <button key={palette.name} type="button" aria-pressed={activePalette === palette.name} onClick={() => choosePalette(palette)} className={`border-2 p-3 text-left transition-shadow ${activePalette === palette.name ? "border-foreground bg-secondary shadow-[3px_3px_0_var(--foreground)]" : "border-dap-border-muted bg-card hover:border-foreground"}`}>
          <span className="flex h-9 overflow-hidden border border-foreground">{[palette.colors.background, palette.colors.foreground, palette.colors.primary, palette.colors.secondary, palette.colors.accent].map((color, index) => <span key={index} className="flex-1" style={{ backgroundColor: color }} />)}</span>
          <span className="mt-2 flex items-center justify-between gap-2"><strong className="text-[11px]">{palette.name}</strong>{activePalette === palette.name && <Check size={14} />}</span><small className="mt-0.5 block text-[9px] text-muted-foreground">{palette.mood}</small>
        </button>)}</div>
        <div className="mt-7 flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-xs font-bold">Custom colors</h3><p className="mt-1 text-[9px] text-muted-foreground">Select a swatch to change it. Related surfaces and borders derive from these values.</p></div><Badge variant="outline">{activePalette}</Badge></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{themeFields.map(({ key, label, note }) => <label key={key} className="flex min-h-[68px] items-center gap-3 border border-dap-border-muted bg-card p-3 transition-colors hover:bg-muted">
          <span className="relative size-10 shrink-0 overflow-hidden border-2 border-foreground shadow-[2px_2px_0_var(--foreground)]" style={{ backgroundColor: themeDraft[key] }}><input aria-label={`Pick ${label}`} type="color" className="absolute inset-0 size-full cursor-pointer opacity-0" value={themeDraft[key]} onChange={(event) => updateThemeField(key, event.target.value)} /></span>
          <span className="min-w-0 flex-1"><strong className="block text-[10px]">{label}</strong><small className="text-[9px] text-muted-foreground">{note}</small></span><Input aria-label={`${label} hex value`} className="h-7 w-[82px] px-1.5 font-mono text-[9px] uppercase" pattern="#[0-9A-Fa-f]{6}" value={themeDraft[key]} onChange={(event) => updateThemeField(key, event.target.value)} />
        </label>)}</div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="border-2 border-foreground bg-background p-3 text-xs">Page surface</div><div className="border-2 border-foreground bg-primary p-3 text-xs">Primary action</div><div className="border-2 border-foreground bg-accent p-3 text-xs">Accent panel</div></div>
      </Card>
      <div className="flex justify-end"><Button type="submit"><Sparkles size={14} /> Save site & palette</Button></div>
    </form>
  );
}