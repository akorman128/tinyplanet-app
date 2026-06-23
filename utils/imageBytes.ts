/**
 * Read a local image URI into an ArrayBuffer, enforcing a max size.
 *
 * fetch().arrayBuffer() is used deliberately: a React Native Blob loses its
 * bytes when supabase-js wraps it in FormData, producing an empty upload.
 */
export async function readImageAsArrayBuffer(
  uri: string,
  maxBytes: number
): Promise<ArrayBuffer> {
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > maxBytes) {
    throw new Error("Image is too large. Please choose a smaller one.");
  }
  return arrayBuffer;
}
