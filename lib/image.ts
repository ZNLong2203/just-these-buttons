// Browser-only: turns whatever the camera or file picker gave us into an
// upright JPEG small enough to send quickly, and a URL to show on the page.

import type { Credit } from "./samples";
import type { Photo } from "./types";

const MAX_EDGE = 1600;
const QUALITY = 0.85;

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function preparePhoto(file: Blob, credit?: Credit): Promise<Photo> {
  // Phones store rotation as metadata; honour it so the boxes match what the
  // caregiver sees.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode the photo"))), "image/jpeg", QUALITY),
  );
  return {
    url: URL.createObjectURL(blob),
    base64: await blobToBase64(blob),
    mimeType: "image/jpeg",
    width,
    height,
    credit,
  };
}

export async function loadSample(path: string, credit: Credit): Promise<Photo> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Sample photo missing: ${res.status}`);
  return preparePhoto(await res.blob(), credit);
}
