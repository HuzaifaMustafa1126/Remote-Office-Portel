import mysql from "mysql2/promise";
import env from "../config/env.js";

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
   WHERE migration_name IN ('041_namaz_ongoing_work.sql','042_normalize_database_collations.sql')
   ORDER BY migration_name`,
);

console.log(JSON.stringify({database,ongoingWork,migrations,wrongTables,wrongColumns},null,2));
await connection.end();
if(
  database?.collation!=="utf8mb4_unicode_ci"||
  !ongoingWork?.tableExists||!ongoingWork?.namazExists||
  migrations.length!==2||wrongTables.length||wrongColumns.length
) process.exitCode=2;
