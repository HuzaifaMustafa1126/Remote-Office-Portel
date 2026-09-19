import mysql from "mysql2/promise";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import env from "../config/env.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(here, "../../database/migrations");
const expectedMigrations = (await fs.readdir(migrationsDir))
  .filter((name) => name.endsWith(".sql"))
  .sort();

const connection = await mysql.createConnection({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  charset: "utf8mb4_unicode_ci",
});

const [[database]] = await connection.execute(
  `SELECT default_character_set_name characterSet,
          default_collation_name collation
   FROM information_schema.schemata WHERE schema_name=DATABASE()`,
);
const [wrongTables] = await connection.execute(
  `SELECT table_name tableName,table_collation collation
   FROM information_schema.tables
   WHERE table_schema=DATABASE() AND table_type='BASE TABLE'
     AND table_collation <> 'utf8mb4_unicode_ci'
   ORDER BY table_name`,
);
const [wrongColumns] = await connection.execute(
  `SELECT table_name tableName,column_name columnName,
          character_set_name characterSet,collation_name collation
   FROM information_schema.columns
   WHERE table_schema=DATABASE() AND collation_name IS NOT NULL
     AND collation_name <> 'utf8mb4_unicode_ci'
   ORDER BY table_name,column_name`,
);
const [[ongoingWork]] = await connection.execute(
  `SELECT EXISTS(SELECT 1 FROM information_schema.tables
                 WHERE table_schema=DATABASE() AND table_name='ongoing_work') tableExists,
          EXISTS(SELECT 1 FROM information_schema.columns
                 WHERE table_schema=DATABASE()
                   AND table_name='employee_availability_preferences'
                   AND column_name='manual_status'
                   AND column_type LIKE '%NAMAZ%') namazExists`,
);
const [migrations] = await connection.execute(
  `SELECT migration_name migrationName,applied_at appliedAt
   FROM schema_migrations
   ORDER BY migration_name`,
);
const appliedMigrations = new Set(migrations.map((row) => row.migrationName));
const missingMigrations = expectedMigrations.filter(
  (name) => !appliedMigrations.has(name),
);
const unexpectedMigrations = migrations
  .map((row) => row.migrationName)
  .filter((name) => !expectedMigrations.includes(name));
const [[recentFeatures]] = await connection.execute(
  `SELECT
    EXISTS(SELECT 1 FROM information_schema.tables
           WHERE table_schema=DATABASE() AND table_name='note_reads') noteReadsTable,
    EXISTS(SELECT 1 FROM information_schema.tables
           WHERE table_schema=DATABASE() AND table_name='note_replies') noteRepliesTable,
    EXISTS(SELECT 1 FROM information_schema.tables
           WHERE table_schema=DATABASE() AND table_name='note_reply_mentions') noteReplyMentionsTable,
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema=DATABASE() AND table_name='work_notes'
             AND column_name='archived_at') noteArchiveTimestamp,
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema=DATABASE() AND table_name='notification_preferences'
             AND column_name='availability_notifications') availabilityPreference,
    EXISTS(SELECT 1 FROM notification_policies
           WHERE event_type='AVAILABILITY_CHANGED') availabilityPolicy`,
);
const migrationState = {
  expectedCount: expectedMigrations.length,
  appliedExpectedCount: expectedMigrations.length - missingMigrations.length,
  latestExpected: expectedMigrations.at(-1) || null,
  latestApplied: migrations.at(-1)?.migrationName || null,
  missingMigrations,
  unexpectedMigrations,
};

console.log(
  JSON.stringify(
    {
      database,
      ongoingWork,
      recentFeatures,
      migrationState,
      migrations,
      wrongTables,
      wrongColumns,
    },
    null,
    2,
  ),
);
await connection.end();
if(
  database?.collation!=="utf8mb4_unicode_ci"||
  !ongoingWork?.tableExists||!ongoingWork?.namazExists||
  Object.values(recentFeatures).some((value) => !value)||
  missingMigrations.length||wrongTables.length||wrongColumns.length
) process.exitCode=2;
