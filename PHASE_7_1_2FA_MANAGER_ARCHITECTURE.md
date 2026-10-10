# Phase 7.1 — 2FA Manager Project Audit and System Architecture

**Project:** Tabish Remote Base Software (the current UI branding in the repository says **Abdali Marketing Portal**)  
**Phase:** 7.1 — audit and architecture only  
**Status:** No application feature, API, migration, package, role, or database change is included in this phase.

## 1. Scope and terminology

The proposed **2FA Manager** is a storage-only module. It stores manually entered 2FA information and authentication keys for multiple platforms grouped under one profile. It will not generate TOTP codes, display countdowns, generate QR codes, integrate with authenticator applications, deliver SMS/email codes, or authenticate against third-party platforms.

In this document:

- **Verified** means confirmed from the repository.
- **Proposed** means a Phase 7.2 design decision and is not implemented yet.
- **Open question** means the repository does not determine the answer and product/deployment confirmation is required.

## 2. Existing project audit findings

### 2.1 Repository layout

**Verified**

The repository has three primary application areas:

```text
client/
  src/components/       Shared and feature UI components
  src/context/          Auth, theme, device, and notification contexts
  src/hooks/            Authentication, permissions, refresh, and feature hooks
  src/layouts/          AppLayout, Header, Sidebar
  src/pages/            Route-level React pages
  src/routes/           AppRoutes.jsx
  src/services/         Axios API wrappers
  src/theme/            Theme configuration
  src/utils/            Permission constants and shared utilities

server/
  src/config/           Environment and MySQL pool configuration
  src/controllers/      HTTP request/response adapters
  src/middleware/       Authentication, authorization, validation, cache, etc.
  src/routes/           Express route modules
  src/services/         Business logic and SQL
  src/validators/       Zod schemas
  src/scripts/          Migration and integrity scripts
  database/migrations/  Runtime migration source

database/
  migrations/           Root copy of migrations
  schema.sql
  seed.sql
  backups/
```

There are currently two migration trees: `server/database/migrations` is the directory used by `server/src/scripts/migrate.js`, while `database/migrations` is a root-level copy. Phase 7.2 must keep both in sync if the repository continues this convention, or explicitly designate and document a single canonical tree.

### 2.2 Confirmed technology and conventions

**Verified**

- Client: React 19, Vite 6, React Router 7, Axios, Tailwind CSS 4, and Lucide React.
- Server: Node.js 22, Express 5, MySQL through `mysql2/promise`, JWT, bcrypt, and Zod.
- Server code uses ECMAScript modules.
- APIs are mounted under `/api/v1`.
- Responses generally use `{ success, message?, data? }`.
- Domain structure follows route → validator/middleware → controller → service → MySQL.
- `ApiError` and the central error middleware are used for controlled failures.
- SQL parameters are passed through prepared statements.
- Mutations involving multiple records normally use a pooled connection and explicit transaction.

### 2.3 Authentication and session security

**Verified**

- `authenticate` accepts a Bearer JWT and verifies both the token and its database-backed `auth_sessions` record.
- The session and user must remain active and unexpired.
- The authenticated actor is attached as `req.user`, including `id` (user ID) and `employee_id`.
- All protected routes pass through authentication, device-access enforcement, and forced-password-change enforcement in `server/src/routes/index.js`.
- Client tokens are stored in `sessionStorage`, not persistent local storage.
- The API applies `Cache-Control: no-store` and related no-cache headers to `/api` responses.
- Helmet and an origin allowlist are enabled; production proxy trust is configurable and defaults to one Hostinger proxy hop.
- `requestSecurityMeta()` derives the client IP from Express's trusted-proxy calculation and does not trust forwarding headers directly.
- No general request-rate-limiting middleware or dependency was found.

### 2.4 Roles and permissions

**Verified**

- Existing tables are `roles`, `permissions`, `user_roles`, and `role_permissions`.
- `user_permission_overrides` supports per-user `ALLOW`, `DENY`, or inherited behavior.
- `getEffectivePermission()` correctly gives an explicit deny precedence over role access and an explicit allow precedence over role absence.
- Backend routes use `requirePermission("permission.name")`.
- The frontend receives effective permissions as part of the authenticated user and uses `PermissionGuard`, `usePermission`, and `PERMISSIONS` constants for navigation and page/action visibility.
- Direct role-name checks exist for a few exceptional CEO-only security operations, but most application authorization is permission-based.

### 2.5 Employees

**Verified**

- `employees.id` is `BIGINT UNSIGNED`.
- A `users` record optionally references an employee and is the authenticated account.
- Services distinguish actor user ID (`req.user.id`) from employee ID (`req.user.employee_id`).
- Employee status and user status are both modeled; an active authenticated account is required by the auth middleware.

### 2.6 Database configuration and migrations

**Verified**

- The server uses a `mysql2/promise` pool with prepared statements, connection limits, keepalive, `dateStrings`, and Pakistan time (`+05:00`) at driver and SQL-session level.
- The canonical schema charset/collation is `utf8mb4` / `utf8mb4_unicode_ci`.
- IDs are generally `BIGINT UNSIGNED AUTO_INCREMENT`.
- Timestamps generally use `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`, with `ON UPDATE CURRENT_TIMESTAMP` where appropriate.
- Foreign-key delete actions are explicitly chosen per relationship.
- Migrations are numbered, additive `.sql` files. The latest existing migration is `074_company_policies.sql`; the next migration should therefore be `075_...sql` unless another phase lands first.
- Deployed migrations are not edited. The runner records filenames in `schema_migrations`.
- Historical migrations through the configured protected boundary have structural replay checks. A new migration should be restart-safe where practical and the migration-safety boundary/audit coverage must be reviewed when it is added.

### 2.7 Existing audit logging

**Verified**

The global `audit_logs` table stores actor user/employee IDs, action, entity type/ID, description, optional old/new JSON values, optional reason fields, and creation time. Audit events are commonly inserted in the same transaction as the mutation.

The global audit UI is protected by `audit.view`. Global audit history can be permanently cleaned by a CEO-only operation. Its current query model does not support profile ACL filtering, a separate platform ID, structured changed-field names, or IP address. The audit category validator and the service category list are also not fully aligned for newer categories, which should not be copied into the new module.

**Architectural consequence:** global `audit_logs` cannot be the only activity-history store for 2FA profiles. Profile-authorized employees need scoped history without receiving access to all system audit records, and 2FA history must remain available after a soft-deleted profile. A dedicated append-only history table is recommended.

### 2.8 Frontend architecture and reusable UI

**Verified**

- `AppRoutes.jsx` provides protected routes and permission gates.
- `Sidebar.jsx` defines grouped navigation and filters entries using effective permissions.
- Existing common components include `Button`, `Input`, `PasswordInput`, `Modal`, `PageHeader`, `ResponsiveTable`, `EmptyState`, `Loader`, status badges, and refresh controls.
- Theme tokens such as `bg-surface`, `border-border`, `text-muted-foreground`, and primary/danger variants are used consistently.
- `Modal` uses the native dialog element and restores focus; `ResponsiveTable` provides mobile-labelled rows.
- Feature API wrappers live in `client/src/services` and use the shared Axios instance.

### 2.9 Relevant limitations found

**Verified**

- No encryption-at-rest utility or encryption-key environment variable exists.
- No rate limiter exists.
- The global audit helper only supports a subset of the global table's structured fields.
- Some newer services insert audit SQL directly rather than through a single comprehensive audit abstraction.
- The current company-policy CRUD service is simple but does not supply the transactional authorization/history behavior needed here.

## 3. Recommended module structure

**Proposed**

Follow the existing feature organization without adding a new framework or package:

```text
server/src/
  routes/twofaManager.routes.js
  controllers/twofaManager.controller.js
  services/twofaManager.service.js
  services/twofaAuthorization.service.js
  services/twofaActivity.service.js
  validators/twofaManager.validator.js
  utils/fieldEncryption.js
  middleware/sensitiveActionRateLimit.middleware.js

client/src/
  pages/TwoFAManagerPage.jsx
  components/twofa/TwoFAProfileForm.jsx
  components/twofa/TwoFAProfileDetails.jsx
  components/twofa/TwoFAPlatformFields.jsx
  components/twofa/TwoFAActivityHistory.jsx
  components/twofa/TwoFAAccessManager.jsx
  components/twofa/MaskedSecretField.jsx
  services/twofaManager.service.js
```

The route module should be mounted as `/api/v1/2fa-manager`, while the React page should use `/2fa-manager`. File names may use `twoFa` instead of `twofa` if the team prefers that casing; Phase 7.2 should choose one spelling and use it consistently.

## 4. Proposed database architecture

No migration is created in Phase 7.1. The following is the proposed logical model for a future numbered migration.

### 4.1 `twofa_profiles`

| Column | Proposed type/behavior | Rationale |
|---|---|---|
| `id` | `BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY` | Existing ID convention |
| `profile_name` | `VARCHAR(200) NOT NULL` | Human-readable grouping |
| `created_by` | `BIGINT UNSIGNED NOT NULL` → `users.id` | Actual authenticated creator |
| `updated_by` | `BIGINT UNSIGNED NOT NULL` → `users.id` | Last authenticated updater |
| `created_at` | `TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP` | Existing convention |
| `updated_at` | timestamp with automatic update | Existing convention |
| `deleted_at` | `DATETIME NULL` | Soft deletion preserves history |
| `deleted_by` | `BIGINT UNSIGNED NULL` → `users.id` | Attribution for deletion |

Recommended indexes: `(deleted_at, updated_at, id)`, `(created_by, deleted_at)`, and a search-supporting index beginning with `profile_name` if query plans justify it. Do not make profile names globally unique; different clients or employees may legitimately use the same name.

### 4.2 `twofa_platforms`

| Column | Proposed type/behavior | Rationale |
|---|---|---|
| `id` | `BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY` | Existing convention |
| `profile_id` | `BIGINT UNSIGNED NOT NULL` → profile | Parent relationship |
| `platform_type` | enum or constrained string for supported choices | Stable filtering |
| `custom_platform_name` | `VARCHAR(100) NULL` | Required only for `OTHER` |
| `twofa_ciphertext` | `MEDIUMBLOB NOT NULL` | Encrypted 2FA information |
| `twofa_iv` | `BINARY(12) NOT NULL` | AES-GCM nonce |
| `twofa_auth_tag` | `BINARY(16) NOT NULL` | AES-GCM integrity tag |
| `auth_key_ciphertext` | `BLOB NOT NULL` | Encrypted authentication key |
| `auth_key_iv` | `BINARY(12) NOT NULL` | Independent nonce |
| `auth_key_auth_tag` | `BINARY(16) NOT NULL` | Integrity tag |
| `encryption_key_version` | `SMALLINT UNSIGNED NOT NULL` | Future key rotation |
| `created_by`, `updated_by` | foreign keys to `users.id` | Actor attribution |
| `created_at`, `updated_at` | standard timestamps | Existing convention |
| `deleted_at`, `deleted_by` | nullable soft-delete metadata | Preserve history and recoverability |

Use separate random IVs for the two encrypted fields. AAD should bind each ciphertext to immutable context such as a format version, profile ID, platform ID, and field name. Since IDs are only known after insertion, the service can insert the non-secret row first inside a transaction, encrypt with the generated ID in AAD, then update the ciphertext columns before commit. Alternatively, use a generated UUID identifier available before insertion; that would be a deliberate departure from the existing numeric-ID convention and is not recommended solely for this purpose.

Store platform type values such as `GOOGLE`, `FACEBOOK`, `INSTAGRAM`, `TIKTOK`, `YOUTUBE`, `LINKEDIN`, `X_TWITTER`, and `OTHER`. Preserve a separate custom label rather than overloading the type column. Duplicate platforms within one profile should be allowed unless product requirements explicitly prohibit them (for example, two Google accounts may be valid).

### 4.3 `twofa_profile_access`

| Column | Proposed type/behavior | Rationale |
|---|---|---|
| `id` | `BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY` | Existing convention |
| `profile_id` | profile FK | Scoped resource |
| `employee_id` | employee FK | Access is granted to an employee |
| `access_type` | `ENUM('OWNER','GRANTED')` | Protect creator ownership while keeping access simple |
| `granted_by` | user FK | Authenticated grantor |
| `created_at` | timestamp | Attribution |

Use `UNIQUE(profile_id, employee_id)` plus an index on `(employee_id, profile_id)`. Profile creation inserts an `OWNER` row for the creator's employee in the same transaction. Removing access must not remove the final owner. If ownership transfer is not required, the original owner row should be immutable except during profile deletion.

This design deliberately does not add per-profile viewer/editor roles. Whether a user may view, edit, reveal, delete, or manage access remains controlled by global effective permissions; the access row only identifies which profiles are in scope. This is the simplest model matching the requested behavior.

### 4.4 `twofa_activity_logs`

| Column | Proposed type/behavior | Rationale |
|---|---|---|
| `id` | `BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY` | Existing convention |
| `profile_id` | `BIGINT UNSIGNED NOT NULL` | Stable profile identity after soft deletion |
| `platform_id` | `BIGINT UNSIGNED NULL` | Affected platform, when applicable |
| `actor_user_id` | `BIGINT UNSIGNED NULL` → user, `ON DELETE SET NULL` | Actual account |
| `employee_id` | `BIGINT UNSIGNED NULL` → employee, `ON DELETE SET NULL` | Required employee attribution |
| `action` | bounded enum or `VARCHAR(80)` | Machine-readable event |
| `changed_fields` | `JSON NULL` | Field names only, never values |
| `event_details` | `JSON NULL` | Non-sensitive IDs/labels and access changes |
| `ip_address` | `VARCHAR(45) NULL` | IPv4/IPv6 from trusted request metadata |
| `created_at` | timestamp | Event time |

Recommended indexes: `(profile_id, created_at, id)`, `(employee_id, created_at)`, `(action, created_at)`, and optionally `(platform_id, created_at)`.

Activity rows should be append-only through application code. There should be no ordinary update/delete API. Use soft deletion for profiles/platforms so history remains resolvable. Avoid cascading history deletion. If a hard-delete compliance process is ever added, it must be separately authorized and explicitly handle retention requirements.

### 4.5 Relationship overview

```text
users ──< twofa_profiles.created_by / updated_by / deleted_by
employees ──< twofa_profile_access >── twofa_profiles
twofa_profiles ──< twofa_platforms
twofa_profiles ──< twofa_activity_logs
twofa_platforms ──< twofa_activity_logs (logical/nullable reference)
users/employees ──< twofa_activity_logs actor attribution
```

For history preservation, `twofa_activity_logs.profile_id` and `platform_id` may be retained as logical IDs rather than cascading foreign keys. If foreign keys are used, use `RESTRICT` with soft deletion for profiles and `SET NULL` only if losing the platform reference is acceptable. The recommended implementation is soft deletion plus non-cascading FKs.

## 5. Profile and multiple-platform behavior

**Proposed**

### Create

- Accept one profile name and an array of one or more platforms.
- Validate the complete payload with Zod, including a reasonable maximum platform count (recommended: 25 per request), string lengths, supported types, and custom-name rules.
- Begin a transaction; create the profile, owner access, and all encrypted platform rows; append activity events; commit atomically.
- Create one `PROFILE_CREATED` event and one `PLATFORM_ADDED` event per platform. The profile event should not redundantly list secret fields.

### Update

- Profile-name updates and platform mutations should be explicit operations, not a single ambiguous replace-all payload.
- Lock the profile/access record during sensitive mutations to prevent conflicting access or deletion changes.
- Detect changed field names server-side. Log `TWOFA_INFORMATION_UPDATED` and/or `AUTH_KEY_UPDATED` without old/new values.
- Treat blank secret fields in an edit form as “leave unchanged”; use a deliberate replacement flag or non-empty supplied value to rotate a secret.
- Soft-delete removed platforms and log `PLATFORM_REMOVED` with only the platform label/ID.

### View and list

- List responses contain profile metadata, permitted platform labels/types, counts, creator/updater display names, and timestamps—never ciphertext, IVs, tags, plaintext, or reversible previews.
- Detail responses return the same metadata and masked placeholders such as `••••••••`; masking is presentation, not partial decryption.
- Search operates on profile name and non-secret platform label/type only.
- Platform filtering uses the normalized platform type and custom label where appropriate.
- By default, exclude soft-deleted profiles and platforms.

### Reveal and copy

- Reveal is an explicit `POST` action, never part of ordinary detail loading.
- The backend re-checks global reveal permission and profile access immediately before decryption.
- A successful reveal writes its activity event in the same request before returning plaintext.
- The response remains covered by the existing global no-store middleware and should also explicitly set `Cache-Control: no-store` defensively.
- The frontend holds plaintext only in component memory, never local/session storage, URL state, analytics, error messages, or debug logs. Automatically remask on modal/detail close, navigation, visibility loss, and after a short interval (recommended 30 seconds).
- Copy uses the already revealed in-memory value and the Clipboard API. The required history event is the reveal; do not create duplicate reveal events for render and copy. If product owners later require copy auditing, add a distinct `*_COPIED` event.

## 6. Permission and authorization design

### 6.1 Proposed permissions

Add permissions through the normal migration/roles UI, not a parallel role system:

| Permission | Purpose |
|---|---|
| `twofa.profile.view` | Enter module and view profiles within ACL scope |
| `twofa.profile.view_all` | Bypass per-profile scope for global oversight |
| `twofa.profile.create` | Create profiles |
| `twofa.profile.update` | Edit an authorized profile/platform |
| `twofa.profile.delete` | Soft-delete an authorized profile |
| `twofa.secret.reveal` | Reveal either encrypted field on an authorized profile |
| `twofa.history.view` | View history for an authorized profile |
| `twofa.access.manage` | Add/remove profile access |

`twofa.profile.view_all` is the clean permission-based mechanism for the CEO requirement and for any explicitly authorized administrator. Do not hard-code Admin as universally privileged. Assign all permissions to CEO in the migration. Admin behavior remains determined by assigned role permissions/overrides, as requested.

The default Employee role may receive `view`, `create`, `update`, `reveal`, and `history.view` only if that matches the intended organization policy. Regardless of role permissions, employees see only profiles they own or have been granted. Delete and access-management defaults are product decisions; least privilege suggests keeping them off the default Employee role unless explicitly requested.

### 6.2 Mandatory two-layer check

Every resource operation must pass both layers:

1. **Capability:** `requirePermission()` or equivalent effective-permission check.
2. **Scope:** the actor's employee has a non-deleted profile-access row, unless the actor has `twofa.profile.view_all`.

The service—not only the UI—must apply this rule to list, detail, update, delete, reveal, history, and access-management queries. Resource-not-visible cases should return `404` to avoid confirming that a secret profile exists; capability failures can remain `403`.

Frontend permission checks are only presentation controls and are not security boundaries.

### 6.3 CEO, Admin, and Employee result

- **CEO:** receives all module permissions, including `view_all`; can perform all specified actions.
- **Admin:** can perform only operations granted through existing role permissions or overrides. Without `view_all`, profile ACL still applies.
- **Employee:** can create if granted `twofa.profile.create`; the creator receives owner access. They may view/edit/reveal/history only for profiles in their ACL and only when they hold the corresponding global permission.

## 7. Activity-history design

### 7.1 Canonical events

| Event | Platform required | Safe changed/details content |
|---|---:|---|
| `PROFILE_CREATED` | No | profile ID/name if name is not considered sensitive |
| `PROFILE_NAME_CHANGED` | No | `changed_fields: ["profile_name"]`; no old/new name if client names are sensitive |
| `PLATFORM_ADDED` | Yes | platform ID/type/custom label |
| `PLATFORM_REMOVED` | Yes | platform ID/type/custom label |
| `TWOFA_INFORMATION_UPDATED` | Yes | `changed_fields: ["twofa_information"]` |
| `AUTH_KEY_UPDATED` | Yes | `changed_fields: ["authentication_key"]` |
| `TWOFA_INFORMATION_REVEALED` | Yes | IDs/type only |
| `AUTH_KEY_REVEALED` | Yes | IDs/type only |
| `PROFILE_DELETED` | No | IDs only |
| `PROFILE_ACCESS_CHANGED` | No | target employee ID and `GRANTED`/`REVOKED` |

Never store secret values, masked fragments, hashes of secrets, IVs, tags, ciphertext, request bodies, or secret lengths in history. Hashes/lengths can still leak information and provide offline comparison signals.

### 7.2 Transaction and failure semantics

- Create/update/delete/access-change events are inserted in the same database transaction as the mutation.
- A reveal event should be recorded before returning plaintext. If event insertion fails, fail closed and do not return the secret.
- Record the actual `req.user.id`, `req.user.employee_id`, trusted request IP, server timestamp, profile ID, and platform ID.
- History queries join current actor/employee display information but tolerate deleted/deactivated users through nullable actor FKs.
- Ordinary users receive no history mutation endpoint.

### 7.3 Dedicated versus global audit log

Use `twofa_activity_logs` as the canonical, profile-scoped history. Do not double-write every event into `audit_logs`; that creates duplicate sources of truth and increases the risk that global audit JSON accidentally receives secrets. A future security policy may choose to write only a small subset of high-level events (for example, repeated denied reveals) to the global security audit, but that is outside this phase.

## 8. Frontend page architecture

### 8.1 `/2fa-manager` main screen

- `PageHeader`: title, concise description, and permission-gated **Add New Profile** action.
- Search by profile name or non-secret platform label.
- Platform-type filter.
- Responsive profile list using a simple table on desktop and the existing responsive table behavior on mobile.
- Rows show profile name, platform labels/count, owner/creator, last update, and permitted actions.
- Empty, loading, error, and no-search-results states should reuse existing components/theme tokens.

### 8.2 Create/edit profile modal

- Reuse `Modal`, `Input`, and `Button`.
- Maintain `platforms[]` in component state, each with a stable client-only key.
- Each platform block contains platform type, conditional custom name, 2FA information, and authentication key.
- **Add Another Platform** appends a block; remove is allowed while keeping at least one platform during creation.
- Use password-style controls for sensitive input, prevent browser autofill where supported (`autoComplete="off"`/`"new-password"` as appropriate), and do not repopulate existing secrets during edit.
- Disable submit during save and show field-level validation where practical.

### 8.3 Profile details

- Display profile metadata and a compact list of platforms.
- Each sensitive field is masked by default with separate **Reveal** and **Copy** controls.
- Copy is unavailable until a successful reveal or can perform reveal-and-copy as one explicit user action, producing one reveal audit event.
- Editing/add/remove actions are permission-gated but remain server-authorized.
- Access management appears only with `twofa.access.manage`.

### 8.4 Activity history

- Use `ResponsiveTable` or a simple responsive timeline.
- Show employee, action label, platform label, server timestamp rendered in the application time convention, and sanitized details.
- Paginate on the server; do not load unbounded history.
- History remains visible for soft-deleted profiles to users who retained appropriate access/oversight permission.

### 8.5 Routing/navigation integration

- Add `TWOFA_*` constants to `client/src/utils/permissions.js`.
- Add a lazy or direct route in `AppRoutes.jsx` gated by `twofa.profile.view`.
- Add a Sidebar item under **MANAGEMENT** (recommended) with a Lucide shield/key icon and the same view permission.
- Do not redesign unrelated pages or navigation groups.

## 9. Backend API plan

All endpoints are under `/api/v1/2fa-manager`, pass through the existing global authentication/device/password middleware, use Zod validation, and return the existing response envelope.

### 9.1 Profiles

| Method and route | Permission | Behavior |
|---|---|---|
| `GET /profiles` | `twofa.profile.view` | Paginated ACL-filtered list; search/platform filters |
| `POST /profiles` | `twofa.profile.create` | Atomic profile + owner + multiple platforms + history |
| `GET /profiles/:profileId` | `twofa.profile.view` + scope | Metadata only; secrets masked/absent |
| `PATCH /profiles/:profileId` | `twofa.profile.update` + scope | Rename profile only |
| `DELETE /profiles/:profileId` | `twofa.profile.delete` + scope | Soft-delete profile/platforms and log |

### 9.2 Platforms

| Method and route | Permission | Behavior |
|---|---|---|
| `POST /profiles/:profileId/platforms` | `twofa.profile.update` + scope | Add and encrypt platform |
| `PATCH /profiles/:profileId/platforms/:platformId` | same | Update label and/or supplied sensitive fields |
| `DELETE /profiles/:profileId/platforms/:platformId` | same | Soft-delete and log |

Reject cross-profile platform IDs by querying on both `profile_id` and platform ID.

### 9.3 Sensitive reveal

| Method and route | Permission | Behavior |
|---|---|---|
| `POST /profiles/:profileId/platforms/:platformId/reveal` | `twofa.secret.reveal` + scope | Body contains `field: "TWOFA_INFORMATION" | "AUTH_KEY"`; rate-limit, decrypt, audit, return one value |

A single typed reveal route centralizes security logic while still producing distinct event types. It must not accept arbitrary database field names.

### 9.4 History and access

| Method and route | Permission | Behavior |
|---|---|---|
| `GET /profiles/:profileId/activity` | `twofa.history.view` + scope | Paginated immutable history |
| `GET /profiles/:profileId/access` | `twofa.access.manage` + scope | Authorized employees; no secrets |
| `PUT /profiles/:profileId/access` | `twofa.access.manage` + scope | Replace/grant/revoke validated employee access atomically |
| `GET /eligible-employees` | `twofa.access.manage` | Minimal active-employee selector data |

The access update payload should be an explicit list of employee IDs or `grantEmployeeIds`/`revokeEmployeeIds`, with strict maximum lengths and duplicate removal. The service must prevent loss of the final owner and prevent grants to inactive/nonexistent employees.

## 10. Sensitive-information storage approach

### 10.1 Cryptography

**Proposed**

Use Node's built-in `node:crypto` with **AES-256-GCM**:

- 32-byte random master key supplied outside the database.
- Fresh cryptographically random 12-byte IV for every field encryption.
- 16-byte authentication tag stored alongside ciphertext.
- Authenticated additional data binds ciphertext to format version, record identity, and field name.
- Decryption rejects modified ciphertext/tag/AAD.
- A key-version column enables controlled rotation later without an encryption-management UI.

No package installation is necessary. Do not use reversible encodings, deterministic encryption, ECB/CBC without authentication, JWT secrets as encryption keys, passwords as encryption keys, or application-generated “custom crypto.”

Encrypt both `twofa_information` and `authentication_key`. Although the brief explicitly calls out authentication keys, the UI requirements treat both fields as revealable sensitive information; encrypting only one would leave the other exposed in database dumps.

### 10.2 Key configuration

Add future environment values such as:

- `TWOFA_ENCRYPTION_KEY` — base64-encoded 32 random bytes.
- `TWOFA_ENCRYPTION_KEY_VERSION` — positive integer, initially `1`.

Validate exact decoded key length in `env.js` and fail application startup in production if missing or malformed. Keep the key in Hostinger environment/config outside source control and outside MySQL. Restrict access to the deployment configuration and backups.

The key must be backed up in a secure organizational secret store. Losing it makes stored secrets unrecoverable. Rotating it requires a separately designed, resumable re-encryption procedure; Phase 7.2 should support versioned reads but need not build a UI or automatic rotation job.

### 10.3 Secret handling controls

- Never select ciphertext in list queries unless a reveal/update operation needs it.
- Never return encryption metadata to the client.
- Never log request bodies for these routes.
- Keep generic error messages for decrypt failures and record operational detail only in protected server logs without secret material.
- Apply existing no-store headers and explicitly no-store reveal responses.
- Redact secrets from error objects and validation messages.
- Require HTTPS in production; the repository assumes deployment TLS but does not itself terminate/verify HTTPS.
- Rate-limit reveal attempts by user plus IP and preferably profile/platform. No existing limiter was found; Phase 7.2 should add a small scoped middleware without adding a package, or obtain approval for a maintained limiter dependency in a later phase. In-memory limiting is acceptable only for a single Node process and resets on restart; a multi-process deployment needs shared storage.
- Consider a recent-password confirmation for reveals as a later hardening option. It is not present in current architecture and should not be silently invented in Phase 7.2.

## 11. Integration requirements

Phase 7.2 will need to integrate with:

1. `server/src/config/env.js` for encryption configuration.
2. `server/src/routes/index.js` for the route mount.
3. Existing authentication, device-access, password-change, validation, error, no-store, trusted-IP, and effective-permission services.
4. `permissions`, `role_permissions`, and user overrides through a new numbered migration.
5. The migration runner and both currently maintained migration directories.
6. `client/src/routes/AppRoutes.jsx`, `Sidebar.jsx`, and permission constants.
7. Existing common UI components and theme tokens.
8. Active employee lookup for profile-access management.
9. Repository test conventions, plus focused crypto, authorization, validation, transactional history, and secret-leak tests.

The implementation must not reuse JWT_SECRET for encryption, bypass service-layer ACL queries, or depend on frontend masking for confidentiality.

## 12. Risks and recommendations

| Risk | Impact | Recommendation |
|---|---|---|
| Encryption key loss | All stored secrets become unrecoverable | Secure backup, startup validation, documented recovery ownership |
| Encryption key exposed with DB backup | Secrets can be decrypted | Store separately; restrict deployment/environment access |
| Authorization drift | Employees see unrelated profiles | Centralize `assertProfileAccess`/scoped query helpers and test every endpoint |
| Secret leakage into logs/history/errors | Long-lived confidentiality breach | Whitelist safe history fields; never pass request bodies to loggers |
| Reveal enumeration/brute force | Excessive secret exposure attempts | User/IP rate limiting, audit every successful reveal, optionally monitor denied attempts globally |
| Race between access revocation and reveal | Revoked employee reveals stale access | Perform current permission + ACL check in the reveal request/transaction |
| Browser persistence | Plaintext remains after use | Memory-only state, automatic remask, clipboard UX warning, no cache/storage |
| Global audit cleanup | Required module history could disappear | Dedicated append-only activity table excluded from global cleanup |
| Soft-deleted resource visibility | History becomes inaccessible or data leaks | Explicit deleted-resource authorization and CEO oversight queries |
| Two migration directories | Production/source drift | Update both atomically or establish one canonical source before migration creation |
| MariaDB/MySQL differences | JSON/type/DDL behavior differs on Hostinger | Use repository-compatible SQL and test against the deployed engine/version |
| In-memory rate limiter with multiple processes | Limits can be bypassed per process | Confirm Hostinger process count; use shared persistence if more than one |
| Existing actor without employee ID | ACL ownership cannot be created | Decide whether non-employee service/admin accounts may use this module; otherwise reject cleanly |

## 13. Open questions

1. **Product/repository naming:** should user-facing text say “Tabish Remote Base Software” or retain the repository's current “Abdali Marketing Portal” branding?
2. **Employee default permissions:** should the default Employee role receive delete and access-management permissions, or only create/view/update/reveal/history?
3. **Ownership transfer:** can an owner transfer ownership or can only CEO/global administrators do so?
4. **Deleted-profile history:** should former grantees retain history access after deletion, or only owners and `view_all` users?
5. **Profile names:** are client/profile names themselves confidential? If yes, activity details and operational logs should omit names and search behavior may need additional review.
6. **Secret size limits:** recommended defaults are 10,000 characters for 2FA information and 2,000 for an authentication key, but product confirmation is needed.
7. **Hostinger topology:** is the backend always one Node process? This determines whether an in-memory reveal limiter is sufficient.
8. **Key custody:** who owns backup, access, and recovery of the production encryption key?
9. **Reauthentication:** is the current active JWT session sufficient for reveal, or should a later phase add password reconfirmation?

None of these questions blocks the architectural model. Phase 7.2 should resolve them before finalizing migration defaults and authorization tests.

## 14. Phase 7.2 implementation checklist

### Database and migration

- [ ] Confirm open product/security decisions.
- [ ] Choose the next available migration number at implementation time.
- [ ] Create the four tables, indexes, non-cascading history relationships, and permission seed data.
- [ ] Assign all module permissions to CEO; confirm defaults for Admin/Employee.
- [ ] Keep both migration trees synchronized or document the canonical tree.
- [ ] Update migration safety/audit coverage as required by the current runner.
- [ ] Verify migration on an empty database and a production-like database.

### Backend

- [ ] Add and validate versioned encryption environment configuration.
- [ ] Implement focused AES-256-GCM encrypt/decrypt helpers with AAD and zero secret logging.
- [ ] Add strict Zod schemas and parameter validators.
- [ ] Implement centralized capability + profile-scope authorization.
- [ ] Implement transactional profile, platform, access, and history services.
- [ ] Implement explicit rate-limited reveal flow that fails closed if audit insertion fails.
- [ ] Mount routes under `/api/v1/2fa-manager`.
- [ ] Ensure list/detail APIs never select or return secrets/cipher metadata.
- [ ] Add query pagination and bounded search/filter inputs.

### Frontend

- [ ] Add permission constants, route gate, and Sidebar item.
- [ ] Add the API service wrapper.
- [ ] Build the main page using existing theme/components.
- [ ] Build multi-platform create/edit form with safe blank-secret update semantics.
- [ ] Build details, masked fields, reveal/copy, automatic remasking, access manager, and history.
- [ ] Verify responsive and keyboard-accessible behavior.
- [ ] Confirm no secret enters storage, URLs, console output, or analytics.

### Tests and operational verification

- [ ] Unit-test encryption round trips, random IVs, tamper rejection, wrong-key behavior, and AAD binding.
- [ ] Test every endpoint for missing permission, explicit deny override, missing ACL, `view_all`, inactive employee, cross-profile IDs, and soft-deleted resources.
- [ ] Test that mutations and history commit/rollback together.
- [ ] Test that activity rows contain field names but never plaintext, ciphertext, hashes, or secret fragments.
- [ ] Test reveal rate limiting and no-store headers.
- [ ] Test list/detail responses for absence of sensitive columns.
- [ ] Run existing backend/client tests and production builds.
- [ ] Test migration, rollback/recovery plan, environment-key provisioning, and Hostinger restart procedure in staging.
- [ ] Perform a final source/log/network-response search for known test-secret values.

---

**Phase 7.1 conclusion:** the existing authentication, effective-permission, API, validation, database-pool, trusted-IP, no-store, and UI systems can be reused. The new module requires a profile ACL layer, dedicated immutable profile activity history, and a small built-in encryption utility. No separate role system, encryption dashboard, TOTP engine, or third-party authentication integration is warranted.
