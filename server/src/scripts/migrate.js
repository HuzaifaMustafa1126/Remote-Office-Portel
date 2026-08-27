import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import env from "../config/env.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(here, "../../../database/migrations");

const connection = await mysql.createConnection({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  multipleStatements: true,
});

await connection.execute(`CREATE TABLE IF NOT EXISTS schema_migrations(
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  migration_name VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

const files = (await fs.readdir(migrationsDir))
  .filter((name) => name.endsWith(".sql"))
  .sort();
const [appliedRows] = await connection.execute(
  "SELECT migration_name FROM schema_migrations",
);
const applied = new Set(appliedRows.map((row) => row.migration_name));

for (const name of files) {
  if (applied.has(name)) continue;
  const sql = await fs.readFile(path.join(migrationsDir, name), "utf8");
  console.log(`Applying ${name}...`);
  await connection.query(sql);
  await connection.execute(
    "INSERT INTO schema_migrations(migration_name) VALUES(?)",
    [name],
  );
  console.log(`Applied ${name}.`);
}

console.log("Database migrations are current.");
await connection.end();
