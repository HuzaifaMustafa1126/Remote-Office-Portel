export const PROTECTED_MIGRATION_MAX_VERSION = 48;

export const migrationVersion = (name) => {
  const match = /^(\d{3})_/.exec(name);
  return match ? Number(match[1]) : null;
};

export const isProtectedMigration = (name) => {
  const version = migrationVersion(name);
  return version !== null && version >= 1 && version <= PROTECTED_MIGRATION_MAX_VERSION;
};

export const auditCoverage = (migrationFiles, auditCheckNames) => {
  const protectedFiles = migrationFiles.filter(isProtectedMigration);
  const checks = new Set(auditCheckNames);
  const files = new Set(protectedFiles);
  return {
    missingChecks: protectedFiles.filter((name) => !checks.has(name)),
    orphanChecks: auditCheckNames.filter(
      (name) => isProtectedMigration(name) && !files.has(name),
    ),
  };
};

export const refusesProtectedReplay = (existingDatabase, migrationName) =>
  Boolean(existingDatabase && isProtectedMigration(migrationName));

export async function assertMigrationLedger(executor) {
  const [[shape]] = await executor.execute(
    `SELECT EXISTS(
       SELECT 1 FROM information_schema.columns
       WHERE table_schema=DATABASE() AND table_name='schema_migrations'
         AND column_name='migration_name' AND data_type='varchar'
         AND character_maximum_length=255 AND is_nullable='NO'
     ) validColumn`,
  );
  const [[unique]] = await executor.execute(
    `SELECT EXISTS(
       SELECT 1
       FROM information_schema.statistics
       WHERE table_schema=DATABASE() AND table_name='schema_migrations'
         AND non_unique=0
       GROUP BY index_name
       HAVING COUNT(*)=1 AND MAX(column_name='migration_name')=1
     ) validUniqueIndex`,
  );
  if (!shape.validColumn || !unique.validUniqueIndex)
    throw new Error(
      "schema_migrations must define migration_name VARCHAR(255) NOT NULL UNIQUE. Refusing migration-history reconciliation.",
    );
}
