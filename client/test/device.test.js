import { test } from "node:test";
import assert from "node:assert/strict";
import { detectDevice, canAccessDevice, MOBILE_PERMISSION } from "../src/utils/device.js";
const phone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile Safari";
test("phones stay mobile in portrait, landscape and with client hints", () => {
  assert.equal(detectDevice({ width: 390, userAgent: phone }), "mobile");
  assert.equal(detectDevice({ width: 844, userAgent: phone }), "mobile");
  assert.equal(detectDevice({ width: 1280, mobileHint: true }), "mobile");
});
test("tablets remain allowed, including desktop-mode iPadOS", () => {
  assert.equal(detectDevice({ width: 768, userAgent: "iPad" }), "tablet");
  assert.equal(detectDevice({ width: 600, userAgent: "Android 14; Tablet" }), "tablet");
  assert.equal(detectDevice({ width: 744, userAgent: "Macintosh", touchPoints: 5 }), "tablet");
});
test("resize blocks narrow desktop windows but ordinary desktop zoom stays allowed", () => {
  assert.equal(detectDevice({ width: 600, outerWidth: 620 }), "mobile");
  assert.equal(detectDevice({ width: 600, outerWidth: 1200 }), "tablet");
  assert.equal(detectDevice({ width: 768 }), "tablet");
  assert.equal(detectDevice({ width: 1024 }), "desktop");
});
for (const role of ["CEO", "ADMIN", "SUPER_ADMIN", "Employee", "Manager"]) {
  for (const device of ["mobile", "tablet", "desktop"]) {
    test(`${role} + ${device}: secure default permission mapping`, () => {
      const privileged = ["CEO", "ADMIN", "SUPER_ADMIN"].includes(role);
      const user = { roles: [role], permissions: privileged ? [MOBILE_PERMISSION] : [] };
      assert.equal(canAccessDevice(user, device), device !== "mobile" || privileged);
    });
  }
}
test("permission grants and revocations override role names", () => {
  assert.equal(canAccessDevice({ roles: ["CEO"], permissions: [] }, "mobile"), false);
  assert.equal(canAccessDevice({ roles: ["Employee"], permissions: [MOBILE_PERMISSION] }, "mobile"), true);
});

test("browser resize with stale outerWidth is distinguished from zoom", async () => {
  const { getDeviceType } = await import("../src/utils/device.js");
  const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  try {
    Object.defineProperty(globalThis, "window", { configurable: true, value: { innerWidth: 1280, outerWidth: 1280, devicePixelRatio: 1 } });
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: { userAgent: "Desktop browser", maxTouchPoints: 0 } });
    assert.equal(getDeviceType(), "desktop");
    window.innerWidth = 390;
    assert.equal(getDeviceType(), "mobile");
    assert.equal(getDeviceType(), "mobile", "API calls agree with the guard");
    window.innerWidth = 1280;
    assert.equal(getDeviceType(), "desktop");
    window.innerWidth = 640;
    window.devicePixelRatio = 2;
    assert.equal(getDeviceType(), "tablet", "ordinary zoom remains allowed");
  } finally {
    if (windowDescriptor) Object.defineProperty(globalThis, "window", windowDescriptor); else delete globalThis.window;
    if (navigatorDescriptor) Object.defineProperty(globalThis, "navigator", navigatorDescriptor); else delete globalThis.navigator;
  }
});
