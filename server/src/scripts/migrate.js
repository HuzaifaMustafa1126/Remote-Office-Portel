import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import env from "../config/env.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(here, "../../database/migrations");
const auditScript = path.join(here, "auditMigrationHistory.js");
const canonicalCollation = "utf8mb4_unicode_ci";
const connection = await mysql.createConnection({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  charset: canonicalCollation,
  multipleStatements: true,
});

await connection.query(
  `SET SESSION collation_connection='${canonicalCollation}'`,
);
const [[existingSchema]] = await connection.execute(`
  SELECT COUNT(*) domainTables
  FROM information_schema.tables
  WHERE table_schema=DATABASE()
    AND table_type='BASE TABLE'
    AND table_name<>'schema_migrations'`);
await connection.execute(`CREATE TABLE IF NOT EXISTS schema_migrations(
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 migration_name VARCHAR(255) NOT NULL UNIQUE,
 applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

const files = (await fs.readdir(migrationsDir))
  .filter((name) => name.endsWith(".sql"))
  .sort();
const readApplied = async () =>
  new Set(
    (
      await connection.execute("SELECT migration_name FROM schema_migrations")
    )[0].map((row) => row.migration_name),
  );
let applied = await readApplied();

// Existing databases sometimes have schema from 001-040 without the matching
// ledger rows. Audit every durable footprint as one unit before recording any
// of them. If a footprint is incomplete, stop rather than replaying historical
// ALTER/DELETE statements against production data.
const legacyFiles = files.filter((name) => {
  const version = Number(name.slice(0, 3));
  return version >= 1 && version <= 40;
});
const missingLegacy = legacyFiles.filter((name) => !applied.has(name));
if (Number(existingSchema.domainTables) > 0 && missingLegacy.length) {
  console.log(
    `Reconciling ${missingLegacy.length} missing legacy migration record(s) after structural audit...`,
  );
  const audit = spawnSync(process.execPath, [auditScript, "--repair"], {
    cwd: path.resolve(here, "../.."),
    env: process.env,
    encoding: "utf8",
  });
  if (audit.stdout) process.stdout.write(audit.stdout);
  if (audit.stderr) process.stderr.write(audit.stderr);
  if (audit.status !== 0) {
    await connection.end();
    console.error(
      "Migration stopped safely. At least one legacy footprint is incomplete; no raw legacy migration was replayed.",
    );
    process.exit(audit.status || 2);
  }
  applied = await readApplied();
}

async function record(name) {
  await connection.execute(
    "INSERT INTO schema_migrations(migration_name) VALUES(?)",
    [name],
  );
  applied.add(name);
  console.log(`Recorded migration: ${name}`);
}

async function applyCollationMigration(name) {
  console.log(`Applying: ${name}`);
  const [[schema]] = await connection.execute("SELECT DATABASE() databaseName");
  await connection.query(
    `ALTER DATABASE \`${schema.databaseName.replaceAll("`", "``")}\` CHARACTER SET utf8mb4 COLLATE ${canonicalCollation}`,
  );
  const [tables] = await connection.execute(
    `
  SELECT DISTINCT t.table_name tableName
  FROM information_schema.tables t
  LEFT JOIN information_schema.columns c
    ON c.table_schema=t.table_schema AND c.table_name=t.table_name
  WHERE t.table_schema=DATABASE() AND t.table_type='BASE TABLE'
    AND (t.table_collation<>? OR (c.collation_name IS NOT NULL AND c.collation_name<>?))
  ORDER BY t.table_name`,
    [canonicalCollation, canonicalCollation],
  );
  const [[fk]] = await connection.execute(
    "SELECT @@SESSION.foreign_key_checks enabled",
  );
  try {
    await connection.query("SET SESSION foreign_key_checks=0");
    for (const { tableName } of tables) {
      const safeName = tableName.replaceAll("`", "``");
      await connection.query(
        `ALTER TABLE \`${safeName}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE ${canonicalCollation}`,
      );
      console.log(`Converted: ${tableName}`);
    }
  } finally {
    await connection.query(
      `SET SESSION foreign_key_checks=${Number(fk.enabled) ? 1 : 0}`,
    );
  }
  const [[remaining]] = await connection.execute(
    `
  SELECT
   (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_type='BASE TABLE' AND table_collation<>?) wrongTables,
   (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND collation_name IS NOT NULL AND collation_name<>?) wrongColumns`,
    [canonicalCollation, canonicalCollation],
  );
  if (Number(remaining.wrongTables) || Number(remaining.wrongColumns))
    throw new Error(
      `Collation verification failed: ${remaining.wrongTables} table default(s), ${remaining.wrongColumns} text column(s) remain noncanonical.`,
    );
  await record(name);
  console.log(
    `Migration completed: ${name}; converted ${tables.length} table(s), verified 0 noncanonical text columns.`,
  );
}

for (const name of files) {
  if (applied.has(name)) continue;
  const version = Number(name.slice(0, 3));
  if (version >= 1 && version <= 40) {
    await connection.end();
    throw new Error(
      `Legacy migration ${name} remains unrecorded after structural audit; refusing unsafe replay.`,
    );
  }
  if (name === "042_normalize_database_collations.sql") {
    await applyCollationMigration(name);
    continue;
  }
  console.log(`Applying: ${name}`);
  const sql = await fs.readFile(path.join(migrationsDir, name), "utf8");
  await connection.query(sql);
  await record(name);
  console.log(`Migration completed: ${name}`);
}

console.log("Database migrations are current.");
await connection.end();
