# Phase 7.3 — 2FA Manager Profile Backend

## Overview

Phase 7.3 implements backend-only profile management for the storage-only 2FA Manager. It provides authenticated, permission-gated, profile-scoped CRUD APIs for profile metadata. It does not implement platform CRUD, credential storage APIs, reveal APIs, frontend UI, TOTP generation, QR codes, or access-management endpoints.

The implementation uses the Phase 7.2 tables and the existing Express, JWT/session, device-access, forced-password-change, effective-permission, Zod, MySQL pool, request-security, `ApiError`, and centralized error-handling systems.

## New files

- `server/src/routes/twofa.routes.js`
- `server/src/controllers/twofa.controller.js`
- `server/src/services/twofa.service.js`
- `server/src/services/twofaActivity.service.js`
- `server/src/validators/twofa.validator.js`
- `server/test/twofaProfile.test.js`
- `server/test/twofaProfile.integration.mjs`

## Modified files

- `server/src/routes/index.js` mounts the module at `/api/v1/2fa`.
- `server/package.json` adds `npm run test:twofa-profile`.

No frontend file, prior migration, authentication middleware, existing permission assignment, or unrelated module was changed.

## API endpoints

All routes inherit the existing global middleware chain:

1. JWT and database-backed session authentication.
2. Device-access enforcement.
3. Forced-password-change enforcement.
4. API no-store response headers.

Each route then applies its module permission and Zod validation.

| Method | Route | Permission | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/2fa/profiles` | `2fa.profile.create` | Create a profile and owner access |
| `GET` | `/api/v1/2fa/profiles` | `2fa.profile.view` | List profiles in the actor's scope |
| `GET` | `/api/v1/2fa/profiles/:id` | `2fa.profile.view` | Get one active accessible profile |
| `PATCH` | `/api/v1/2fa/profiles/:id` | `2fa.profile.edit` | Rename an active accessible profile |
| `DELETE` | `/api/v1/2fa/profiles/:id` | `2fa.profile.delete` | Soft-delete profile and child platforms |

### Create example

Request:

```http
POST /api/v1/2fa/profiles
Authorization: Bearer <session-token>
Content-Type: application/json

{
  "profileName": "Client ABC"
}
```

Response shape:

```json
{
  "success": true,
  "message": "2FA profile created successfully",
  "data": {
    "id": 15,
    "profileName": "Client ABC",
    "createdBy": {
      "userId": 4,
      "employeeId": 9,
      "name": "Employee A"
    },
    "updatedBy": {
      "userId": 4,
      "employeeId": 9,
      "name": "Employee A"
    },
    "platformCount": 0,
    "createdAt": "2026-10-10 10:00:00",
    "updatedAt": "2026-10-10 10:00:00"
  }
}
```

Dates follow the existing MySQL pool's `dateStrings` behavior and Pakistan SQL-session timezone.

### List example

```http
GET /api/v1/2fa/profiles?search=client&page=1&limit=10&sortBy=updatedAt&sortOrder=DESC
```

Response data contains:

```json
{
  "rows": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "pages": 1
  }
}
```

Each row contains profile metadata and an aggregate active-platform count. Platform secrets, ciphertext, IVs, tags, and key versions are never selected by these queries.

### Update example

```http
PATCH /api/v1/2fa/profiles/15
Content-Type: application/json

{
  "profileName": "Client ABC Updated"
}
```

If the trimmed name is unchanged, the API returns the current profile with `changed: false`, does not update `updated_by`/`updated_at`, and does not write a misleading `PROFILE_UPDATED` event.

### Delete example

```http
DELETE /api/v1/2fa/profiles/15
```

Successful response data is `{ "id": 15 }`. The profile and its active platform rows are soft-deleted in one transaction. Activity rows and access records remain preserved.

## Validation rules

### Profile name

- Required string.
- Trimmed server-side.
- Minimum one non-whitespace character.
- Maximum 150 characters.
- Request bodies are strict; unsupported fields such as `createdBy`, `updatedBy`, or `deletedAt` are rejected.

### Profile ID

- Coerced from the route string.
- Positive safe integer.
- Invalid IDs are rejected before SQL execution.

### List query

- `search`: optional trimmed string, maximum 150 characters.
- `page`: positive integer, default `1`.
- `limit`: 1–100, default `20`.
- `sortBy`: `createdAt`, `updatedAt`, or `profileName`.
- `sortOrder`: `ASC` or `DESC`.
- Unknown query parameters are rejected.

Sort identifiers are mapped through a server-owned allowlist. User input is never interpolated as an arbitrary SQL identifier.

## Authorization model

Every endpoint requires the route-specific effective permission through the existing `requirePermission` middleware. The service also requires `req.user.employee_id`; request bodies cannot supply actor identity.

For an individual profile, access is allowed when one of these is true:

1. The authenticated user created the profile.
2. Their employee has a `twofa_profile_access` row for the profile.
3. The authenticated user has the existing `CEO` role.

The CEO bypass does not bypass route permission middleware: the CEO must still be assigned the relevant `2fa.*` permission. Admin has no implicit bypass and follows configured permissions plus profile access.

List queries apply the same scope in SQL. Inaccessible and nonexistent/deleted profile requests return the same `404 TWOFA_PROFILE_NOT_FOUND` response to prevent profile enumeration. Frontend visibility is not treated as an authorization control.

Phase 7.2 intentionally assigned no permissions to roles. Deployment must assign the desired `2fa.*` permissions through the existing role/permission system before these routes become usable.

## Database operations

### Create

One transaction:

1. Inserts `twofa_profiles` using authenticated user ID for `created_by` and `updated_by`.
2. Inserts an `OWNER` row for the authenticated employee.
3. Inserts `PROFILE_CREATED` activity.
4. Reads and returns the presentation-safe profile.
5. Commits, or rolls everything back on any failure.

Profiles can exist without platforms, as required for Phase 7.3.

### List/details

- Always require `deleted_at IS NULL`.
- Use joins for creator/updater names.
- Use one correlated aggregate for active platform count, avoiding per-row application queries.
- List count and page queries share the same scope/search predicate.
- No credential storage columns are selected.

### Update

- Locks the active profile using `FOR UPDATE`.
- Rechecks profile access inside the transaction.
- Updates only `profile_name`, `updated_by`, and `updated_at`.
- Writes `PROFILE_UPDATED` with `changed_fields: ["profile_name"]`.
- Does not write old/new profile names to activity metadata.
- Commits update and activity together.

### Delete

- Locks the active profile using `FOR UPDATE`.
- Rechecks access inside the transaction.
- Soft-deletes all active child platforms and records the deleting/updating user.
- Soft-deletes the profile and records the deleting/updating user.
- Writes `PROFILE_DELETED` in the same transaction.
- Does not delete profile access or history.

## Activity logging

`twofaActivity.service.js` is an extensible, dedicated writer for `twofa_activity_logs`. Phase 7.3 records:

- `PROFILE_CREATED`
- `PROFILE_UPDATED`
- `PROFILE_DELETED`
- `ACCESS_DENIED` for real active profiles rejected by profile-scope checks

Events include the authenticated user and employee IDs, trusted request IP, bounded parsed user-agent value, a server-generated UUID request ID, status, changed-field names, and whitelisted non-sensitive metadata.

Denied access uses safe operation values such as `VIEW_PROFILE`; it never stores request bodies or names. Nonexistent/deleted IDs cannot receive an activity row because history requires a valid profile foreign key, and no extra lookup result is exposed to the caller.

Mutation activity is written in the same transaction. If required history insertion fails, the profile mutation rolls back. A successful unchanged update produces no event.

## Error behavior

- Authentication errors are handled by existing auth middleware (`401`).
- Missing effective permissions use existing permission middleware (`403`).
- Invalid bodies, IDs, and queries use existing validation middleware (`400`).
- Missing, deleted, and inaccessible profiles return the same safe `404`.
- Database errors and transaction failures flow to the centralized error handler without exposing SQL or configuration in production.
- Row locks serialize conflicting profile update/delete operations.

## Test results

### Unit/static tests

`server/test/twofaProfile.test.js` verifies:

- Trimming and profile-name length rules.
- Strict body rejection.
- ID, search, pagination, and sort validation.
- SQL-injection-like sort values are rejected.
- All route permission gates are declared.
- Unauthenticated requests are rejected by the existing authentication middleware.

### Isolated MySQL integration tests

`server/test/twofaProfile.integration.mjs` creates a uniquely named temporary local database, applies migration 075, uses dummy metadata/cipher bytes only, and removes the database in `finally` cleanup. It verifies:

- Profile creation, owner assignment, authenticated creator identity, and creation activity.
- Employee-scoped listing, CEO visibility, search, pagination, and sorting.
- Authorized details and indistinguishable unauthorized 404 behavior.
- `ACCESS_DENIED` history.
- Authorized and unauthorized updates/deletes.
- Last-editor attribution and safe changed fields.
- No event for an unchanged name.
- Profile and child-platform soft deletion.
- Deleted-profile inaccessibility and retained history.
- Full creation rollback when activity insertion is deliberately forced to fail.

No existing application or production database is modified by the integration suite.

## Known limitations and intentional phase boundaries

- Platform CRUD and encryption are Phase 7.4; profile APIs cannot store plaintext credentials.
- Employee access management endpoints are not implemented yet; tests seed access directly to verify Phase 7.3 scope enforcement.
- There is no activity-history API/UI yet.
- Permission records exist, but role assignment remains an explicit deployment/administrative task.
- `ACCESS_DENIED` covers profile-scope denial after route permission succeeds. General JWT/permission denials remain handled by existing middleware and are not duplicated into profile history.
- The current CEO bypass follows the repository's existing CEO-role check. All other behavior remains permission-based.

## Phase 7.4 dependencies

Phase 7.4 platform APIs must:

1. Reuse the same active-profile authorization logic or extract it into a shared exported helper without weakening it.
2. Validate that every platform ID belongs to the requested active profile.
3. Implement AES-256-GCM encryption before database insertion using an external, validated key.
4. Never return ciphertext/IV/tag/key-version fields through ordinary profile or platform responses.
5. Write `PLATFORM_ADDED`, `PLATFORM_UPDATED`, `PLATFORM_REMOVED`, `TWOFA_UPDATED`, and `AUTH_KEY_UPDATED` in the same transaction as mutations.
6. Keep reveal endpoints out unless explicitly included in that phase and protected by their separate permissions/rate limiting.
7. Preserve the current profile soft-delete rule so child credentials remain inaccessible.
