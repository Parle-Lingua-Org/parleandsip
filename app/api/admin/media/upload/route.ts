import { requireAdmin } from "@/lib/admin-auth";
import { apiError } from "@/lib/api-response";
import { uploadImageBuffer } from "@/lib/media-storage";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const form = await request.formData();
    const file = form.get("file");
    const folderRaw = form.get("folder");
    if (!(file instanceof File)) return Response.json({ error: "Choose an image file." }, { status: 400 });
    if (!file.type.startsWith("image/")) return Response.json({ error: "Only image uploads are allowed." }, { status: 400 });
    if (file.size > 5_000_000) return Response.json({ error: "Image must be smaller than 5 MB." }, { status: 400 });

    const folder = typeof folderRaw === "string" && folderRaw.trim()
      ? folderRaw.trim().replace(/[^a-zA-Z0-9/_-]/g, "").slice(0, 80)
      : "uploads";
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadImageBuffer({
      buffer,
      contentType: file.type || "image/jpeg",
      folder: folder || "uploads",
    });
    return Response.json({ url });
  } catch (reason) {
    return apiError(reason, 500, "Unable to upload image.");
  }
}
