import test from "node:test";
import assert from "node:assert/strict";
import { detectTaskImageType } from "../src/utils/imageFile.js";

test("task images are identified from content instead of filename MIME metadata", () => {
  assert.deepEqual(
    detectTaskImageType(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    { mimeType: "image/png", extension: "png" },
  );
  assert.deepEqual(detectTaskImageType(Buffer.from([0xff, 0xd8, 0xff])), {
    mimeType: "image/jpeg",
    extension: "jpg",
  });
});

test("task images support common browser-renderable formats", () => {
  assert.deepEqual(detectTaskImageType(Buffer.from("GIF89a")), {
    mimeType: "image/gif",
    extension: "gif",
  });
  assert.deepEqual(detectTaskImageType(Buffer.from("BMplaceholder")), {
    mimeType: "image/bmp",
    extension: "bmp",
  });
  assert.deepEqual(
    detectTaskImageType(Buffer.from("0000ftypavif0000")),
    { mimeType: "image/avif", extension: "avif" },
  );
});

test("non-image content remains rejected", () => {
  assert.equal(detectTaskImageType(Buffer.from("not an image")), null);
});
