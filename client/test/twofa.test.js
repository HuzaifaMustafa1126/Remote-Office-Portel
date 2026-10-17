import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

test("2FA API client covers every backend workflow without hardcoded origins", () => {
  const source = read("../src/services/twofa.service.js");
  for (const route of ["/2fa/profiles", "/platforms/bulk", "/reveal-2fa", "/reveal-key", "/access", "/history"])
    assert.ok(source.includes(route), route);
  assert.doesNotMatch(source, /https?:\/\//);
});

test("Grant Access loads active employees from the existing employee API", () => {
  const access = read("../src/components/twofa/AccessTab.jsx");
  assert.match(access, /listEmployees\(\{\}\)/);
  assert.match(access, /employee\.status === "ACTIVE"/);
  assert.doesNotMatch(access, /PermissionChecks|canRevealTwofa|canRevealAuthKey/);
});

test("navigation and routes are available to every authenticated employee", () => {
  const routes = read("../src/routes/AppRoutes.jsx");
  const sidebar = read("../src/layouts/Sidebar.jsx");
  assert.match(routes, /path="2fa-manager"/);
  assert.match(routes, /path="2fa-manager\/:profileId"/);
  assert.equal((routes.match(/P\.TWOFA_PROFILE_VIEW/g) || []).length, 0);
  assert.match(sidebar, /\["2FA Manager", "\/2fa-manager", KeyRound, null\]/);
});

test("credential entry is plain text while saved values remain masked and ephemeral", () => {
  const platforms = read("../src/components/twofa/PlatformsTab.jsx");
  const fields = read("../src/components/twofa/PlatformFields.jsx");
  assert.match(platforms, /••••••••••••/);
  assert.doesNotMatch(platforms, /Confirm Your Password|Current Password|type="password"/);
  assert.match(platforms, /setTimeout\(\(\) => setRevealed\(\{\}\), 60000\)/);
  assert.match(platforms, /navigator\.clipboard\.writeText\(result\.value\)/);
  assert.match(platforms, /whitespace-pre-wrap/);
  assert.match(fields, /<textarea[\s\S]*value=\{value\.authKey\}/);
  assert.doesNotMatch(fields, /showKey|type="password"/);
  assert.doesNotMatch(`${platforms}\n${fields}`, /localStorage|sessionStorage/);
});

test("partial profile creation preserves form state and retries only platform creation", () => {
  const source = read("../src/components/twofa/ProfileCreateModal.jsx");
  assert.match(source, /createdProfile/);
  assert.match(source, /Retry Platforms/);
  assert.match(source, /Your entries are preserved/);
});

test("profile detail shares platform and history controls while retaining creator capabilities", () => {
  const source = read("../src/pages/TwofaProfilePage.jsx");
  assert.match(source, /canAdd: true/);
  assert.match(source, /profile\.capabilities\.canEdit/);
  for (const label of ["Platforms", "Activity History", "Employee Access"])
    assert.ok(source.includes(label));
});
