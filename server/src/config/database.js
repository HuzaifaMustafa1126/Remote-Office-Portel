import mysql from "mysql2/promise";
import env from "./env.js";
const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4_unicode_ci",
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  dateStrings: true,
  timezone: "+05:00",
});
// Shift times and work dates are Pakistan local time. Set the SQL session too:
// the driver's timezone option alone does not affect NOW() or TIMESTAMP reads.
pool.on("connection", (connection) => {
  connection.query("SET SESSION time_zone = '+05:00'", (error) => {
    if (error) connection.destroy();
  });
});
export const verifyDatabase = async () => {
  const c = await pool.getConnection();
  try {
    await c.ping();
  } finally {
    c.release();
  }
};
export default pool;
