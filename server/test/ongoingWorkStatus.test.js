import assert from "node:assert/strict";
import test from "node:test";

import { statusUpdateStatement } from "../src/services/ongoingWork.service.js";

test("ongoing-work status SQL avoids collation-sensitive string comparisons", () => {
  for (const status of ["ONGOING", "PAUSED", "COMPLETED"]) {
    const sql = statusUpdateStatement(status);

    assert.match(sql, new RegExp(`status='${status}'`));
    assert.equal(sql.match(/\?/g)?.length, 1);
    assert.match(sql, /WHERE id=\?/);
  }
});

test("ongoing-work status SQL preserves timestamp behavior", () => {
  assert.match(statusUpdateStatement("ONGOING"), /COALESCE\(started_at,CURRENT_TIMESTAMP\)/);
  assert.match(statusUpdateStatement("ONGOING"), /completed_at=NULL/);
  assert.match(statusUpdateStatement("PAUSED"), /completed_at=NULL/);
  assert.match(statusUpdateStatement("COMPLETED"), /completed_at=CURRENT_TIMESTAMP/);
});
