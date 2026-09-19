import test from "node:test";
import assert from "node:assert/strict";
import { availabilityNotificationContent } from "../src/services/availability.service.js";

const message = (from, to, context) =>
  availabilityNotificationContent("Ali Khan", from, to, context);

test("availability notification copy covers every supported transition", () => {
  assert.deepEqual(message("ONLINE", "IN_MEETING"), {
    title: "Ali Khan is In a Meeting",
    message: "Ali Khan changed their availability to In a Meeting.",
  });
  assert.equal(message("ONLINE", "AWAY").title, "Ali Khan is Away");
  assert.equal(
    message("ONLINE", "DO_NOT_DISTURB").title,
    "Ali Khan is Do Not Disturb",
  );
  assert.equal(
    message("ONLINE", "NAMAZ").title,
    "Ali Khan is Away for Namaz",
  );
  assert.deepEqual(message("ONLINE", "ON_BREAK"), {
    title: "Ali Khan Started a Break",
    message: "Ali Khan is now On Break.",
  });
  assert.deepEqual(message("AWAY", "ONLINE"), {
    title: "Ali Khan is Available",
    message: "Ali Khan is available again.",
  });
  assert.equal(
    message("ON_BREAK", "ONLINE", "BREAK_ENDED").message,
    "Ali Khan ended their break and is available again.",
  );
  assert.equal(
    message("IN_MEETING", "AWAY").message,
    "Ali Khan changed their availability from In a Meeting to Away.",
  );
  assert.equal(
    message("AWAY", "NAMAZ").message,
    "Ali Khan changed their availability from Away to Namaz.",
  );
});

test("same-status and automatic offline resolution do not notify", () => {
  assert.equal(message("AWAY", "AWAY"), null);
  assert.equal(message("ONLINE", "OFFLINE"), null);
});
