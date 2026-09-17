import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { getClientIp, normalizeIp, parseUserAgent } from "../src/utils/requestSecurity.js";

function resolvedIp(trustProxy, forwardedFor) {
  const app = express();
  app.set("trust proxy", trustProxy);
  const req = Object.create(app.request);
  req.socket = { remoteAddress: "127.0.0.1" };
  req.headers = forwardedFor ? { "x-forwarded-for": forwardedFor } : {};
  return { ip: getClientIp(req), ips: req.ips };
}

test("normalizes IPv4-mapped IPv6 without changing native IPv6", () => {
  assert.equal(normalizeIp("::ffff:39.45.123.10"), "39.45.123.10");
  assert.equal(normalizeIp("2400:cb00:2048:1::c629:d7a2"), "2400:cb00:2048:1::c629:d7a2");
  assert.equal(normalizeIp("::1"), "::1");
});

test("user agent parsing keeps existing browser, OS and device behavior", () => {
  const desktop = parseUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140.0 Safari/537.36");
  assert.equal(desktop.browser, "Chrome");
  assert.equal(desktop.operatingSystem, "macOS");
  assert.equal(desktop.deviceType, "DESKTOP");
  assert.equal(parseUserAgent("Mozilla/5.0 (iPhone) AppleWebKit/605.1 Safari/604.1").deviceType, "MOBILE");
});

test("an untrusted direct request cannot override its IP with X-Forwarded-For", () => {
  const result = resolvedIp(false, "8.8.8.8");
  assert.equal(result.ip, "127.0.0.1");
  assert.deepEqual(result.ips, []);
});

test("one trusted proxy resolves the address supplied by that direct proxy", () => {
  const result = resolvedIp(1, "203.0.113.25");
  assert.equal(result.ip, "203.0.113.25");
  assert.deepEqual(result.ips, ["203.0.113.25"]);
});

test("a configured two-hop chain resolves the original address", () => {
  const result = resolvedIp(2, "203.0.113.25, 10.0.0.2");
  assert.equal(result.ip, "203.0.113.25");
});
