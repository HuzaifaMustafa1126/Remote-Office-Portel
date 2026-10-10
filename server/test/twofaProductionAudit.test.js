import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("production startup refuses a missing 2FA encryption key", () => {
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", "import('./src/config/env.js')"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "production",
        DB_HOST: "127.0.0.1",
        DB_USER: "test",
        DB_PASSWORD: "test",
        DB_NAME: "test",
        JWT_SECRET: "x".repeat(32),
        FRONTEND_URL: "https://example.invalid",
        TWOFA_ENCRYPTION_KEY: "",
      },
    },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /TWOFA_ENCRYPTION_KEY/);
});

test("production startup accepts a valid 32-byte base64 encryption key", () => {
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", "import('./src/config/env.js')"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "production",
        DB_HOST: "127.0.0.1",
        DB_USER: "test",
        DB_PASSWORD: "test",
        DB_NAME: "test",
        JWT_SECRET: "x".repeat(32),
        FRONTEND_URL: "https://example.invalid",
        TWOFA_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
      },
    },
  );
  assert.equal(result.status, 0, result.stderr);
});

test("2FA routes use denial-auditing permission middleware and bounded reveal limiting", () => {
  const routes = fs.readFileSync(new URL("../src/routes/twofa.routes.js", import.meta.url), "utf8");
  const limiter = fs.readFileSync(new URL("../src/middleware/twofaRateLimit.middleware.js", import.meta.url), "utf8");
  assert.match(routes, /requireTwofaPermission as permit/);
  assert.match(limiter, /MAX_TRACKED_KEYS/);
  assert.match(limiter, /Retry-After/);
});
