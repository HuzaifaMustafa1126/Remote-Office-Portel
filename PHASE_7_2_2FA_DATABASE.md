# Phase 7.2 — 2FA Manager Database Foundation

## Scope

This phase adds only the MySQL foundation for the storage-only 2FA Manager. It does not add APIs, encryption services, permission middleware, frontend pages, TOTP generation, QR codes, countdowns, notifications, or role assignments.

The design follows [Phase 7.1](./PHASE_7_1_2FA_MANAGER_ARCHITECTURE.md) and the repository's existing Node.js/MySQL conventions.

## Migration files

The latest pre-existing migration was `074_company_policies.sql`. Phase 7.2 adds:

- Runtime migration: `server/database/migrations/075_twofa_manager_foundation.sql`
- Synchronized root copy: `database/migrations/075_twofa_manager_foundation.sql`

The two files are byte-identical. The existing migration runner automatically discovers the new `.sql` filename, orders it after 074, and records it in `schema_migrations` after successful execution.

The migration is restart-safe for MySQL's auto-committing DDL behavior: tables use `CREATE TABLE IF NOT EXISTS`, and permission registration uses an upsert. Previously deployed migrations were not modified.

## Existing conventions reused

- InnoDB
- `utf8mb4` with `utf8mb4_unicode_ci`
- `BIGINT UNSIGNED AUTO_INCREMENT` identifiers
- `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- `ON UPDATE CURRENT_TIMESTAMP` for updated timestamps
- Existing `users`, `employees`, and `permissions` tables
- Explicit named foreign keys and indexes
- Application-managed soft deletion

Authenticated actor columns reference `users.id`; profile-specific access references `employees.id`. This preserves the distinction already used by the authentication system: the user is the authenticated account, while the employee is the organizational identity receiving access.

## Tables

### `twofa_profiles`

Stores non-secret profile metadata.

| Column | Definition |
|---|---|
| `id` | `BIGINT UNSIGNED`, auto-increment primary key |
| `profile_name` | `VARCHAR(200) NOT NULL` |
| `created_by` | Required creator user ID |
| `updated_by` | Required last-updater user ID |
| `deleted_by` | Nullable deleting user ID |
| `created_at` | Creation timestamp |
| `updated_at` | Automatically maintained update timestamp |
| `deleted_at` | Nullable soft-deletion time |

Similar profile names are allowed. Application validation will trim and validate names in Phase 7.3.

Important indexes:

- `idx_twofa_profiles_active_updated (deleted_at, updated_at, id)` for active lists.
- `idx_twofa_profiles_creator_active (created_by, deleted_at)` for creator-scoped lookup.

Creator, updater, and deleter reference `users(id)` with `ON DELETE RESTRICT`, preserving attribution.

### `twofa_platforms`

Stores any number of platforms beneath a profile. There is intentionally no uniqueness constraint on profile/platform name, so multiple accounts on the same service remain valid.

| Column | Definition |
|---|---|
| `id` | `BIGINT UNSIGNED`, auto-increment primary key |
| `profile_id` | Required parent profile |
| `platform_name` | `VARCHAR(50)`, intended for normalized values such as `GOOGLE` or `OTHER` |
| `platform_custom_name` | Optional `VARCHAR(100)` label; required only for `OTHER` |
| `twofa_information_ciphertext` | Required `MEDIUMBLOB` encrypted payload |
| `twofa_information_iv` | Required 12-byte nonce |
| `twofa_information_tag` | Required 16-byte GCM authentication tag |
| `auth_key_ciphertext` | Required `BLOB` encrypted authentication key |
| `auth_key_iv` | Required independent 12-byte nonce |
| `auth_key_tag` | Required 16-byte GCM authentication tag |
| `encryption_key_version` | Positive `SMALLINT UNSIGNED` key identifier |
| `created_by`, `updated_by`, `deleted_by` | User attribution |
| `created_at`, `updated_at`, `deleted_at` | Lifecycle timestamps |

Constraints enforce a positive key version and the `OTHER` custom-name rule. Supported platform values will be strictly validated in the Phase 7.3 Zod schema without making the database difficult to extend.

Important indexes:

- `idx_twofa_platforms_profile_active (profile_id, deleted_at, id)` for loading active platforms.
- `idx_twofa_platforms_name_active (platform_name, deleted_at)` for platform filters.

The profile relationship uses `ON DELETE RESTRICT`. Profiles and platforms are soft-deleted, so neither platform records nor their history are accidentally cascaded away.

### `twofa_profile_access`

Stores profile-specific employee scope. It complements—not replaces—the existing role/permission system.

| Column | Definition |
|---|---|
| `id` | `BIGINT UNSIGNED`, auto-increment primary key |
| `profile_id` | Required profile |
| `employee_id` | Required authorized employee |
| `access_type` | `OWNER` or `GRANTED` |
| `granted_by` | Required authenticated grantor user |
| `created_at`, `updated_at` | Grant timestamps |

`uq_twofa_profile_employee (profile_id, employee_id)` prevents duplicate assignments. `idx_twofa_access_employee_profile (employee_id, profile_id)` supports fast authorization checks and employee-scoped lists.

Access removal will delete the access row in Phase 7.3; the associated `ACCESS_REVOKED` activity event remains in the dedicated history. Owner-preservation rules belong in the transactional service layer.

### `twofa_activity_logs`

Provides append-only application history for profile-scoped operations.

| Column | Definition |
|---|---|
| `id` | `BIGINT UNSIGNED`, auto-increment primary key |
| `profile_id` | Required affected profile |
| `platform_id` | Nullable affected platform |
| `actor_user_id` | Nullable authenticated account reference |
| `employee_id` | Nullable employee reference |
| `action` | Constrained activity type |
| `changed_fields` | Nullable JSON containing safe field names only |
| `ip_address` | Nullable IPv4/IPv6 text |
| `user_agent` | Nullable bounded browser/device string |
| `request_id` | Nullable request correlation ID |
| `event_status` | `SUCCESS` or `FAILURE` |
| `metadata` | Nullable non-sensitive JSON |
| `created_at` | Event timestamp |

Supported actions are:

- `PROFILE_CREATED`, `PROFILE_UPDATED`, `PROFILE_DELETED`
- `PLATFORM_ADDED`, `PLATFORM_UPDATED`, `PLATFORM_REMOVED`
- `TWOFA_UPDATED`, `AUTH_KEY_UPDATED`
- `TWOFA_REVEALED`, `AUTH_KEY_REVEALED`
- `ACCESS_GRANTED`, `ACCESS_REVOKED`, `ACCESS_DENIED`

History relationships use `ON DELETE RESTRICT` for profiles/platforms. Actor references use `ON DELETE SET NULL`, allowing account/employee lifecycle changes without deleting events. No activity-update or activity-delete API is part of the design.

Important indexes:

- `idx_twofa_activity_profile_created (profile_id, created_at, id)`
- `idx_twofa_activity_platform_created (platform_id, created_at)`
- `idx_twofa_activity_employee_created (employee_id, created_at)`
- `idx_twofa_activity_action_created (action, created_at)`
- `idx_twofa_activity_request (request_id)`

## Relationships

```text
users      1 ──< twofa_profiles (creator/updater/deleter)
profiles   1 ──< twofa_platforms
profiles   1 ──< twofa_profile_access >── 1 employees
users      1 ──< twofa_profile_access (grantor)
profiles   1 ──< twofa_activity_logs
platforms  1 ──< twofa_activity_logs
users/employees ──< twofa_activity_logs (actor identity)
```

The application must use soft deletion for profiles and platforms. The restrictive history foreign keys make accidental hard deletion fail rather than silently erase history.

## Permission integration

Migration 075 safely registers these permissions in the existing `permissions` table:

- `2fa.profile.create`
- `2fa.profile.view`
- `2fa.profile.edit`
- `2fa.profile.delete`
- `2fa.platform.add`
- `2fa.platform.edit`
- `2fa.platform.delete`
- `2fa.information.reveal`
- `2fa.key.reveal`
- `2fa.history.view`
- `2fa.access.manage`

No role receives these permissions automatically. Phase 7.3 must deliberately assign them through existing role-permission administration or a separately approved migration. Backend operations must ultimately require both an effective module permission and a matching profile-access row; this middleware/service behavior is intentionally outside Phase 7.2.

## Encrypted storage design

The schema is prepared for application-side AES-256-GCM authenticated encryption:

- Each sensitive field has ciphertext, its own 12-byte random IV, and a 16-byte authentication tag.
- The two fields must never reuse an IV with the same encryption key.
- `encryption_key_version` supports future version-aware reads and rotation.
- The database contains no plaintext secret column and no master-key column.
- Ciphertext is stored as binary, avoiding base64 storage expansion.
- Phase 7.3 must keep the 32-byte master key outside MySQL/source control, validate it at startup, use authenticated additional data, and never place secrets in logs or activity JSON.

Both manually entered 2FA information and the authentication key are encrypted because both are masked/revealed sensitive values.

## Verification

Verification covers:

1. Both migration copies are byte-identical.
2. The migration runner discovers 075 in filename order without runner changes.
3. All four required tables and eleven permission records are declared.
4. Primary keys, required foreign keys, unique access constraint, history-preserving delete rules, collation, indexes, and AES-GCM metadata columns are present.
5. No plaintext secret column or master-key column exists.
6. An isolated temporary local schema test creates the prerequisite existing tables, executes migration 075, inserts dummy (non-secret) encrypted byte payloads, verifies relationships and duplicate-access rejection, soft-deletes the profile, confirms history remains, and removes the temporary schema.

The isolated local MySQL verification passed on October 10, 2026 with these results:

```json
{
  "ok": true,
  "tables": 4,
  "permissions": 11,
  "duplicateAccessRejected": true,
  "historyRowsAfterSoftDelete": 1,
  "foreignKeys": 14,
  "wrongCollations": 0
}
```

The verifier used a uniquely named temporary database and dummy byte payloads, then dropped that database in a `finally` cleanup. It did not run migration 075 against the existing application database or production.

## Safe manual rollback

The project has no automated down-migration framework. Before production deployment, take and verify a database backup. If migration 075 must be rolled back and the four tables contain no data that must be retained, use this order:

```sql
START TRANSACTION;

DELETE FROM role_permissions
WHERE permission_id IN (
  SELECT id FROM permissions WHERE name LIKE '2fa.%'
);

DELETE FROM user_permission_overrides
WHERE permission_id IN (
  SELECT id FROM permissions WHERE name LIKE '2fa.%'
);

DELETE FROM permissions WHERE name IN (
  '2fa.profile.create',
  '2fa.profile.view',
  '2fa.profile.edit',
  '2fa.profile.delete',
  '2fa.platform.add',
  '2fa.platform.edit',
  '2fa.platform.delete',
  '2fa.information.reveal',
  '2fa.key.reveal',
  '2fa.history.view',
  '2fa.access.manage'
);

DELETE FROM schema_migrations
WHERE migration_name = '075_twofa_manager_foundation.sql';

COMMIT;

DROP TABLE IF EXISTS twofa_activity_logs;
DROP TABLE IF EXISTS twofa_profile_access;
DROP TABLE IF EXISTS twofa_platforms;
DROP TABLE IF EXISTS twofa_profiles;
```

MySQL DDL auto-commits, so table drops are not part of the preceding transaction. This procedure is destructive and must never be used after real 2FA Manager data exists without an approved export/retention plan. Permission deletion should use the exact name list as shown, not a broad wildcard in production automation.

## Phase 7.3 dependencies

Phase 7.3 must provide, before any profile can be used:

- AES-256-GCM utility and validated external key configuration.
- Strict Zod validation for profile names, supported platform names, custom names, and secret sizes.
- Transactional profile/platform services that always encrypt before database writes.
- Central effective-permission plus profile-access authorization.
- Owner-row creation and final-owner protection.
- Append-only activity insertion in the same transaction as mutations.
- Trusted IP, bounded user-agent, request-ID capture, and secret-safe metadata whitelisting.
- Explicit rate-limited reveal endpoints with no-store responses.
- Tests proving no list/detail query returns ciphertext or encryption metadata.

Phase 7.3 must not insert plaintext placeholders into the required ciphertext columns. Test fixtures should use generated dummy bytes and never real credentials.
