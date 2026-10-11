/** Shrinks an image on a canvas. Returns a WebP/JPEG blob. */
async function compress(file: File, maxDim: number, quality: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const toBlob = (type: string) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, quality));
  return (await toBlob("image/webp")) ?? (await toBlob("image/jpeg")) ?? Promise.reject(new Error("Could not process image"));
}

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export const IMAGE_PRESETS = {
  avatar: { maxDim: 512, quality: 0.85, inlineLimit: 150_000 },
  thumb: { maxDim: 160, quality: 0.85, inlineLimit: 40_000 },
  background: { maxDim: 1400, quality: 0.8, inlineLimit: 600_000 },
} as const;

/**
 * Compresses the image in the browser and returns a data URL that is saved inside the Firestore
 * document (no Firebase Storage needed). `inlineLimit` keeps documents under Firestore's 1 MB cap.
 */
export async function uploadImage(_uid: string, file: File, kind: keyof typeof IMAGE_PRESETS): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > 15 * 1024 * 1024) throw new Error("Image is too large (max 15 MB).");
  const preset = IMAGE_PRESETS[kind];
  const blob = await compress(file, preset.maxDim, preset.quality);

  if (blob.size > preset.inlineLimit) {
    const smaller = await compress(file, Math.round(preset.maxDim * 0.6), 0.6);
    if (smaller.size > preset.inlineLimit) throw new Error("Image is too detailed to store — try a smaller one.");
    return toDataUrl(smaller);
  }
  return toDataUrl(blob);
}
