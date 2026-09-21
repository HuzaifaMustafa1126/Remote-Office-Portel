import pool from "../config/database.js";
import { cleanupCompletedOngoingWork } from "../services/ongoingWork.service.js";

try {
  const result = await cleanupCompletedOngoingWork({ batchSize: 200 });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await pool.end();
}
