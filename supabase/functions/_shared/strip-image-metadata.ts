import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

export const MAX_INPUT_BYTES = 10 * 1024 * 1024;
export const MAX_PIXELS = 50_000_000;

// Read width*height from a JPEG's SOF marker without fully decoding it.
export function jpegPixelCount(bytes: Uint8Array): number | null {
  let i = 2; // skip SOI (FFD8)
  while (i + 9 < bytes.length) {
    if (bytes[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = bytes[i + 1];
    const isSof =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    if (isSof) {
      const height = (bytes[i + 5] << 8) | bytes[i + 6];
      const width = (bytes[i + 7] << 8) | bytes[i + 8];
      return width * height;
    }
    const segLen = (bytes[i + 2] << 8) | bytes[i + 3];
    if (segLen < 2) return null;
    i += 2 + segLen;
  }
  return null;
}

// Decode pixels then re-encode JPEG. The output is built solely from pixel
// data, so all EXIF/GPS/IPTC/XMP is dropped.
export async function stripToCleanJpeg(input: Uint8Array): Promise<Uint8Array> {
  if (input.byteLength > MAX_INPUT_BYTES) {
    throw new Error("Image too large");
  }
  const pixels = jpegPixelCount(input);
  if (pixels !== null && pixels > MAX_PIXELS) {
    throw new Error("Image dimensions too large");
  }
  const image = await Image.decode(input);
  return await image.encodeJPEG(80);
}
