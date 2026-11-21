const MAX_EDGE = 2048;
const JPEG_QUALITY = 0.85;

// Phone photos are 3–5 MB; shrinking keeps page loads fast and stays well
// inside the free Blob storage and transfer limits.
export async function shrinkPhoto(file: File): Promise<Blob> {
  if (file.type === "image/gif") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const shrunk = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    return shrunk && shrunk.size < file.size ? shrunk : file;
  } catch {
    return file;
  }
}
