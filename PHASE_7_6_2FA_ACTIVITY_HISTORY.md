# Phase 7.6 — 2FA Activity History

## Completed features

Phase 7.6 completes the dedicated, storage-only 2FA audit trail. Profile, platform, credential update/reveal, employee-access, and meaningful authorization-denial events use one validated logging service. No TOTP generation or frontend history interface is included.

## Activity definitions

The centralized action set contains:

- `PROFILE_CREATED`, `PROFILE_UPDATED`, `PROFILE_DELETED`
- `PLATFORM_ADDED`, `PLATFORM_UPDATED`, `PLATFORM_REMOVED`
- `TWOFA_UPDATED`, `AUTH_KEY_UPDATED`
- `TWOFA_REVEALED`, `AUTH_KEY_REVEALED`
- `ACCESS_GRANTED`, `ACCESS_UPDATED`, `ACCESS_REVOKED`, `ACCESS_DENIED`

Each record contains the actor identifiers and immutable employee-name, profile-name, and optional platform-name snapshots; status; changed field names; stored timestamp; trusted client IP; user agent; request ID; and allowlisted safe metadata.

## Logging architecture and security

`recordTwofaActivity()` validates action names, resolves snapshots inside the caller's database transaction, strips non-allowlisted metadata, and rejects unsupported events. Passwords, credential values, ciphertext, tokens, and authentication keys cannot be included in metadata.

Mutations and their audit insert commit together. An audit failure rolls back the mutation. Reveal events are inserted before transaction commit and before the plaintext result is returned, so disclosure fails closed if auditing fails. Bulk platform creation emits one event per platform under the same request ID.

Profile renames, platform renames/removal, soft deletion, and employee renames/deletion do not erase historical context. Actor foreign keys use `SET NULL`, while immutable snapshots remain. Employee profile-access rows are removed when the employee is deleted. The general `audit_logs` cleanup operates on a different table and does not remove dedicated 2FA history.

Recommended retention is at least one year, or longer when organizational security/compliance policy requires it. Phase 7.6 does not add automatic cleanup.

## History APIs

Both endpoints require authentication, an active employee, and `2fa.history.view`:

- `GET /api/v1/2fa/profiles/:profileId/history`
- `GET /api/v1/2fa/history`

Profile history requires view capability for that profile and remains available after profile soft deletion. CEO users retain full profile scope but do not bypass the module permission. Global history returns all profiles for CEO users and only explicitly viewable profiles for other authorized employees; Admin receives no implicit global bypass.

Supported query parameters are `profileId` (global only), `platformId`, `employeeId`, `action`, `status`, `dateFrom`, `dateTo`, `search`, `page`, and `limit`. Dates use `YYYY-MM-DD`; limits default to 20 and are capped at 100. Search covers only snapshot names. Results sort by stored timestamp and event ID, newest first, and timestamps are serialized as UTC ISO values.

## Database changes

Migration `078_twofa_activity_history_snapshots.sql` adds the three snapshot columns and composite indexes for status/profile/employee/action time-based queries. It also changes historical actor references to nullable `SET NULL` relationships so employee deletion cannot destroy or block history preservation.

## Files

New files:

- `server/database/migrations/078_twofa_activity_history_snapshots.sql`
- `database/migrations/078_twofa_activity_history_snapshots.sql`
- `server/src/services/twofaHistory.service.js`
- `server/src/controllers/twofaHistory.controller.js`
- `server/test/twofaHistory.test.js`

Modified files include the centralized activity service, request-context helper, 2FA validators/routes, profile/platform presentation joins, integration tests, and package scripts.

## Tests

Coverage includes action/filter validation, metadata redaction, permission middleware, isolation from general audit cleanup, snapshot retention after rename/deletion, profile/global authorization, pagination/filtering/sorting, mutation rollback when audit insertion fails, reveal failure when audit insertion fails, and absence of secrets in stored activity.

## Known limitations and Phase 7.7 dependencies

No history UI is included. Request IDs correlate bulk activity, but this phase does not implement general API idempotency or replay stored HTTP responses. Phase 7.7 may consume these APIs for a timeline, filters, local-time display, and human-friendly relative dates without replacing the stored event timestamp.
