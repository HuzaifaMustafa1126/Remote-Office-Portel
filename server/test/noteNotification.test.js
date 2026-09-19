import test from "node:test";
import assert from "node:assert/strict";
import { resolveNoteNotification } from "../src/services/note.service.js";
import { buildReplyNotificationPlan } from "../src/services/noteReply.service.js";

const event = (visibility, isImportant, kind = "published") =>
  resolveNoteNotification({ visibility, isImportant }, kind);

test("new Note notification matrix follows visibility and importance", () => {
  assert.equal(event("TEAM", false).type, "NOTE_TEAM_PUBLISHED");
  assert.equal(event("TEAM", true).type, "NOTE_IMPORTANT_PUBLISHED");
  assert.equal(event("TEAM", true).title, "⭐ Important Team Note");
  assert.equal(event("PRIVATE", false), null);
  assert.equal(event("PRIVATE", true), null);
  assert.equal(event("CEO_ONLY", false).type, "NOTE_CEO_PUBLISHED");
  assert.equal(event("CEO_ONLY", true).type, "NOTE_IMPORTANT_PUBLISHED");
  assert.equal(event("CEO_ONLY", true).title, "⭐ Important Note for CEO");
});

test("visibility sharing uses the destination audience", () => {
  assert.equal(event("TEAM", false, "shared").type, "NOTE_SHARED_TEAM");
  assert.equal(event("CEO_ONLY", false, "shared").type, "NOTE_SHARED_CEO");
  assert.equal(event("PRIVATE", false, "shared"), null);
});

test("reply recipients exclude the author and prioritize mentions over owner alerts", () => {
  assert.deepEqual(buildReplyNotificationPlan(1, 2, []), {
    mentionRecipientIds: [],
    notifyOwner: true,
  });
  assert.equal(buildReplyNotificationPlan(1, 1, []).notifyOwner, false);
  assert.deepEqual(buildReplyNotificationPlan(1, 2, [1, 3, 3, 2]), {
    mentionRecipientIds: [1, 3],
    notifyOwner: false,
  });
  assert.equal(buildReplyNotificationPlan(1, 2, [3], false).notifyOwner, false);
});
