"use client";

import { useId, useState } from "react";
import { ImagePlus, Link2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadImageToStorage } from "@/lib/image-upload";
import { notifyError } from "@/lib/notify";

type ImagePickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxDimension?: number;
  folder?: string;
  previewClassName?: string;
};

export function ImagePicker({
  label,
  value,
  onChange,
  maxDimension,
  folder = "uploads",
  previewClassName = "aspect-[2/1]",
}: ImagePickerProps) {
  const inputId = useId();
  const [busy, setBusy] = useState(false);

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadImageToStorage(file, { folder, maxDimension }));
    } catch (reason) {
      notifyError(reason, "Unable to upload this image.");
    } finally {
      setBusy(false);
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
        <label htmlFor={`${inputId}-upload`} className={`inline-flex h-9 cursor-pointer items-center gap-2 border-2 border-foreground bg-card px-3 text-[10px] font-semibold shadow-[2px_2px_0_var(--foreground)] hover:bg-secondary ${busy ? "opacity-60" : ""}`}>
          <Upload size={13} /> {busy ? "Uploading…" : "Upload image"}
          <input id={`${inputId}-upload`} className="sr-only" type="file" accept="image/*" disabled={busy} onChange={(event) => { void upload(event.target.files?.[0]); event.currentTarget.value = ""; }} />
        </label>
        {value && <Button variant="ghost" size="sm" disabled={busy} onClick={() => onChange("")}><Trash2 size={13} /> Remove</Button>}
      </div>
    </div>
  );
}
