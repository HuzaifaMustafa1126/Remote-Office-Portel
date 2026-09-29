const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

export const taskImageTypes = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/bmp": "bmp",
  "image/x-ms-bmp": "bmp",
  "image/avif": "avif",
};

export function detectTaskImageType(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
    return { mimeType: "image/jpeg", extension: "jpg" };
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(pngSignature))
    return { mimeType: "image/png", extension: "png" };
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  )
    return { mimeType: "image/webp", extension: "webp" };
  if (
    buffer.length >= 6 &&
    ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"))
  )
    return { mimeType: "image/gif", extension: "gif" };
  if (buffer.length >= 2 && buffer.subarray(0, 2).toString("ascii") === "BM")
    return { mimeType: "image/bmp", extension: "bmp" };
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    const brands = buffer.subarray(8, Math.min(buffer.length, 32)).toString("ascii");
    if (brands.includes("avif") || brands.includes("avis"))
      return { mimeType: "image/avif", extension: "avif" };
  }
  return null;
}

