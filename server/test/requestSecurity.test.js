import test from "node:test";
import assert from "node:assert/strict";
import { normalizeIp, parseUserAgent } from "../src/utils/requestSecurity.js";

test("IP normalization removes only the IPv4-mapped IPv6 prefix", () => {
  assert.equal(normalizeIp("::ffff:192.168.1.20"), "192.168.1.20");
  assert.equal(normalizeIp("2001:db8::1"), "2001:db8::1");
  assert.equal(normalizeIp("::1"), "::1");
});

test("user agent parsing returns conservative browser, OS and device families", () => {
  const desktop = parseUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140.0 Safari/537.36");
  assert.equal(desktop.browser, "Chrome");
  assert.equal(desktop.operatingSystem, "macOS");
  assert.equal(desktop.deviceType, "DESKTOP");
  assert.equal(parseUserAgent("Mozilla/5.0 (iPhone) AppleWebKit/605.1 Safari/604.1").deviceType, "MOBILE");
});
