"use client";

import { useId, useState } from "react";
import { ImagePlus, Link2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { imageFileToDataUrl } from "@/lib/image-upload";

type ImagePickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxDimension?: number;
  previewClassName?: string;
};

export function ImagePicker({ label, value, onChange, maxDimension, previewClassName = "aspect-[2/1]" }: ImagePickerProps) {
  const inputId = useId();
  const [error, setError] = useState("");

  async function upload(file?: File) {
    if (!file) return;
    setError("");
    try {
      onChange(await imageFileToDataUrl(file, maxDimension));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to read this image.");
    }
  }

  return (
    <div className="grid gap-2">
      <span className="text-[10px] font-semibold">{label}</span>
      <div className={`relative overflow-hidden border-2 border-foreground bg-muted ${previewClassName}`}>
        {value ? <img src={value} alt={`${label} preview`} className="size-full object-cover" /> : <div className="grid size-full place-items-center text-muted-foreground"><ImagePlus size={22} /></div>}
      </div>
      <label className="flex items-center gap-2 text-[9px] text-muted-foreground" htmlFor={inputId}><Link2 size={13} /> Image URL</label>
      <Input value={value.startsWith("data:") ? "" : value} placeholder="https://…" onChange={(event) => onChange(event.target.value)} />
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`${inputId}-upload`} className="inline-flex h-9 cursor-pointer items-center gap-2 border-2 border-foreground bg-card px-3 text-[10px] font-semibold shadow-[2px_2px_0_var(--foreground)] hover:bg-secondary"><Upload size={13} /> Upload image<input id={`${inputId}-upload`} className="sr-only" type="file" accept="image/*" onChange={(event) => { void upload(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label>
        {value && <Button variant="ghost" size="sm" onClick={() => onChange("")}><Trash2 size={13} /> Remove</Button>}
      </div>
      {error && <p role="alert" className="text-[9px] text-accent-foreground">{error}</p>}
    </div>
  );
}