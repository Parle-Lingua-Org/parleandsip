import "server-only";

import { createHash, randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const MEDIA_BUCKET = "parle-sip-media";

function parseDataUrl(dataUrl: string) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s.exec(dataUrl.trim());
  if (!match) throw new Error("Invalid image data.");
  const contentType = match[1].toLowerCase();
  const base64 = match[2];
  const buffer = Buffer.from(base64, "base64");
  if (!buffer.length) throw new Error("Invalid image data.");
  if (buffer.length > 5_000_000) throw new Error("Image must be smaller than 5 MB.");
  const extension = contentType.includes("png")
    ? "png"
    : contentType.includes("webp")
      ? "webp"
      : contentType.includes("avif")
        ? "avif"
        : contentType.includes("svg")
          ? "svg"
          : "jpg";
  return { contentType, buffer, extension };
}

export function isDataImageUrl(value: string) {
  return value.trim().startsWith("data:image/");
}

export async function uploadImageBuffer(options: {
  buffer: Buffer;
  contentType: string;
  folder: string;
  extension?: string;
}) {
  const admin = createAdminClient();
  const extension = options.extension || (options.contentType.includes("png") ? "png" : options.contentType.includes("webp") ? "webp" : "jpg");
  const hash = createHash("sha1").update(options.buffer).digest("hex").slice(0, 12);
  const path = `${options.folder.replace(/^\/+|\/+$/g, "")}/${Date.now()}-${hash}-${randomUUID().slice(0, 8)}.${extension}`;
  const { error } = await admin.storage.from(MEDIA_BUCKET).upload(path, options.buffer, {
    contentType: options.contentType,
    upsert: false,
    cacheControl: "31536000",
  });
  if (error) throw new Error(error.message);
  const { data } = admin.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("Unable to resolve uploaded image URL.");
  return data.publicUrl;
}

export async function ensureStoredImageUrl(image: string, folder: string) {
  const value = image.trim();
  if (!value) return "";
  if (!isDataImageUrl(value)) return value;
  const parsed = parseDataUrl(value);
  return uploadImageBuffer({
    buffer: parsed.buffer,
    contentType: parsed.contentType,
    extension: parsed.extension,
    folder,
  });
}

export async function ensureStoredImageUrls(images: string[], folder: string) {
  const resolved: string[] = [];
  for (const image of images) {
    const url = await ensureStoredImageUrl(image, folder);
    if (url && !resolved.includes(url)) resolved.push(url);
  }
  return resolved;
}
