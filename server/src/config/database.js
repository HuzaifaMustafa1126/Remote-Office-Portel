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
