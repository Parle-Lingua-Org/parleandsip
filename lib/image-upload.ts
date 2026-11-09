export async function imageFileToDataUrl(file: File, maxDimension = 1600) {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size > 12_000_000) throw new Error("Choose an image smaller than 12 MB.");

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not process the image.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let quality = 0.82;
  let dataUrl = canvas.toDataURL("image/webp", quality);
  while (dataUrl.length > 500_000 && quality > 0.35) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL("image/webp", quality);
  }
  if (dataUrl.length > 500_000) throw new Error("This image is too large for browser storage. Use a smaller image or an image URL.");
  return dataUrl;
}