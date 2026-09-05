import { test } from "node:test";
import assert from "node:assert/strict";
import { isMobileRequest } from "../src/utils/deviceAccess.js";
process.env.NODE_ENV = "test";
process.env.DB_USER = "test";
process.env.JWT_SECRET = "test-only-secret-for-device-access-tests";
const { default: pool } = await import("../src/config/database.js");
const { requireDeviceAccess } =
  await import("../src/middleware/deviceAccess.middleware.js");
test("backend uses phone UA and client hints even with a contradictory custom header", () => {
  assert.ok(
    isMobileRequest({
      "user-agent": "iPhone Mobile",
      "x-client-device": "desktop",
    }),
  );
  assert.ok(isMobileRequest({ "sec-ch-ua-mobile": "?1" }));
  assert.ok(isMobileRequest({ "x-client-device": "mobile" }));
  assert.ok(isMobileRequest({}, "mobile"));
  assert.equal(
    isMobileRequest({
      "user-agent": "Android Tablet",
      "x-client-device": "tablet",
    }),
    false,
  );
  assert.equal(isMobileRequest({}), false);
});
for (const device of ["mobile", "tablet", "desktop"]) {
  for (const allowed of [true, false]) {
    test(`API ${device}, permission=${allowed}`, async (t) => {
      const query = t.mock.method(pool, "execute", async (sql, params) => {
        assert.deepEqual(params, [7, "portal.access_mobile"]);
        return [allowed ? [{ value: 1 }] : []];
      });
      let result;
      await requireDeviceAccess(
        { user: { id: 7 }, headers: { "x-client-device": device } },
        {},
        (error) => {
          result = error;
        },
      );
      assert.equal(
        result?.code,
        device === "mobile" && !allowed ? "MOBILE_ACCESS_DENIED" : undefined,
      );
      if (result) assert.equal(result.statusCode, 403);
      assert.equal(query.mock.callCount(), device === "mobile" ? 1 : 0);
    });
  }
}
