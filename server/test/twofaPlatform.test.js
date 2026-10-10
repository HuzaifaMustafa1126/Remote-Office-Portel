import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import test from "node:test";
import {
  bulkCreatePlatformsSchema,
  createPlatformSchema,
  revealKeySchema,
  updatePlatformSchema,
} from "../src/validators/twofa.validator.js";
import {
  decryptTwofaValue,
  encryptTwofaValue,
} from "../src/utils/twofaEncryption.js";
import {
  createTwofaRevealRateLimit,
  resetTwofaRevealRateLimits,
} from "../src/middleware/twofaRateLimit.middleware.js";
import { setTwofaNoStore } from "../src/controllers/twofaPlatform.controller.js";

const cryptoConfig = { key: randomBytes(32).toString("base64"), version: 7 };

test("AES-256-GCM round trips, uses unique IVs, and rejects tampering or wrong context", () => {
  const first = encryptTwofaValue(
    "dummy manual information",
    "test-context",
    "twofa_information",
    cryptoConfig,
  );
  const second = encryptTwofaValue(
    "dummy manual information",
    "test-context",
    "twofa_information",
    cryptoConfig,
  );
  assert.notDeepEqual(first.iv, second.iv);
  assert.notDeepEqual(first.ciphertext, second.ciphertext);
  assert.equal(
    decryptTwofaValue(
      first,
      "test-context",
      "twofa_information",
      cryptoConfig,
    ),
    "dummy manual information",
  );
  assert.throws(
    () =>
      decryptTwofaValue(
        { ...first, tag: Buffer.alloc(16) },
        "test-context",
        "twofa_information",
        cryptoConfig,
      ),
    (error) => error.code === "TWOFA_DECRYPTION_FAILED",
  );
  assert.throws(
    () =>
      decryptTwofaValue(
        first,
        "different-context",
        "twofa_information",
        cryptoConfig,
      ),
    (error) => error.code === "TWOFA_DECRYPTION_FAILED",
  );
});

test("platform validation supports defaults, Other, duplicates, partial update, and explicit clear", () => {
  assert.deepEqual(
    createPlatformSchema.parse({
      platformName: "Instagram",
      accountLabel: " Main ",
      authKey: " dummy key with spaces ",
    }),
    {
      platformName: "INSTAGRAM",
      accountLabel: "Main",
      authKey: " dummy key with spaces ",
    },
  );
  assert.equal(
    createPlatformSchema.safeParse({
      platformName: "Other",
      customPlatformName: "Client Portal",
      twofaInformation: "dummy",
    }).success,
    true,
  );
  assert.equal(
    createPlatformSchema.safeParse({ platformName: "Other", authKey: "dummy" })
      .success,
    false,
  );
  assert.equal(
    createPlatformSchema.safeParse({ platformName: "Google" }).success,
    false,
  );
  assert.equal(
    bulkCreatePlatformsSchema.safeParse({
      platforms: [
        { platformName: "Google", authKey: "dummy-1" },
        { platformName: "Google", authKey: "dummy-2" },
      ],
    }).success,
    true,
  );
  assert.equal(
    updatePlatformSchema.safeParse({ accountLabel: null, clearAuthKey: true })
      .success,
    true,
  );
  assert.equal(
    updatePlatformSchema.safeParse({
      authKey: "replacement",
      clearAuthKey: true,
    }).success,
    false,
  );
  assert.equal(revealKeySchema.safeParse({ currentPassword: "dummy" }).success, true);
});

test("credential reveal limiter rejects attempts beyond the configured window quota", () => {
  resetTwofaRevealRateLimits();
  const limiter = createTwofaRevealRateLimit({ limit: 2, windowMs: 60_000 });
  const req = {
    user: { id: 10 },
    ip: "127.0.0.1",
    path: "/platforms/1/reveal-key",
    route: { path: "/platforms/:platformId/reveal-key" },
  };
  const results = [];
  const headers = {};
  const res = { setHeader: (name, value) => { headers[name] = value; } };
  limiter(req, res, (error) => results.push(error || null));
  limiter(req, res, (error) => results.push(error || null));
  limiter(req, res, (error) => results.push(error || null));
  assert.equal(results[0], null);
  assert.equal(results[1], null);
  assert.equal(results[2].statusCode, 429);
  assert.equal(results[2].code, "TWOFA_REVEAL_RATE_LIMITED");
  assert.ok(Number(headers["Retry-After"]) >= 1);
});

test("platform routes use separate permissions and reveal controllers set no-store headers", () => {
  const routes = fs.readFileSync(
    new URL("../src/routes/twofa.routes.js", import.meta.url),
    "utf8",
  );
  for (const permission of [
    "2fa.profile.view",
    "2fa.platform.add",
    "2fa.platform.edit",
    "2fa.platform.delete",
    "2fa.information.reveal",
    "2fa.key.reveal",
  ])
    assert.match(routes, new RegExp(permission.replaceAll(".", "\\.")));
  const controller = fs.readFileSync(
    new URL("../src/controllers/twofaPlatform.controller.js", import.meta.url),
    "utf8",
  );
  assert.match(controller, /Cache-Control/);
  assert.match(controller, /no-store/);
  const headers = new Map();
  setTwofaNoStore({ setHeader: (name, value) => headers.set(name, value) });
  assert.match(headers.get("Cache-Control"), /no-store/);
  assert.equal(headers.get("Pragma"), "no-cache");
  assert.equal(headers.get("Expires"), "0");
});
