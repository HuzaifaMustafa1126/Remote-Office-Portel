import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULTS,
  PALETTES,
  MODES,
  themeTokens,
  contrast,
  sanitize,
  storageKey,
  readPreferences,
  paletteStrip,
} from "../src/theme/theme.js";
for (const mode of MODES)
  for (const palette of PALETTES) {
    test(`${mode} / ${palette.name}: accessible semantic colors`, () => {
      const { tokens: t, mono } = themeTokens(
        { ...DEFAULTS, mode, palette: palette.id },
        true,
      );
      for (const [fg, bg] of [
        ["foreground", "surface"],
        ["muted-foreground", "surface"],
        ["primary-foreground", "primary"],
        ["primary-text", "primary-soft"],
        ["accent-text", "accent-soft"],
        ["secondary-foreground", "secondary"],
        ["sidebar-foreground", "sidebar"],
        ["sidebar-active-foreground", "sidebar-active"],
      ])
        assert.ok(contrast(t[fg], t[bg]) >= 4.5, `${fg} on ${bg}`);
      for (const status of ["success", "warning", "danger", "info"])
        assert.ok(contrast(t[status], t[status + "-soft"]) >= 4.5, status);
      assert.equal(paletteStrip(palette).length, 8);
      if (mono)
        for (const [key, value] of Object.entries(t))
          assert.ok(
            value.slice(1, 3) === value.slice(3, 5) &&
              value.slice(3, 5) === value.slice(5, 7),
            `${key} must be monochrome: ${value}`,
          );
    });
  }
test("system follows the device, explicit modes do not", () => {
  assert.equal(themeTokens(DEFAULTS, false).mode, "LIGHT");
  assert.equal(themeTokens(DEFAULTS, true).mode, "DARK");
  assert.equal(themeTokens({ ...DEFAULTS, mode: "LIGHT" }, true).mode, "LIGHT");
});
test("malformed storage is safely discarded and account preferences are isolated", () => {
  const data = new Map([
    [storageKey(1), JSON.stringify({ ...DEFAULTS, mode: "DARK" })],
    [storageKey(2), JSON.stringify({ ...DEFAULTS, mode: "BLACK_WHITE" })],
  ]);
  const storage = { getItem: (key) => data.get(key) };
  assert.equal(readPreferences(1, storage).mode, "DARK");
  assert.equal(readPreferences(2, storage).mode, "BLACK_WHITE");
  assert.equal(readPreferences(3, storage).mode, "SYSTEM");
  data.set(storageKey(1), "{broken");
  assert.deepEqual(readPreferences(1, storage), DEFAULTS);
  assert.deepEqual(
    sanitize({
      mode: "NO",
      palette: "unknown",
      favorites: ["unknown"],
      customs: [{ id: "custom-bad" }],
    }),
    DEFAULTS,
  );
});
