# Phase 7.4 — 2FA Platform and Authentication-Key Management

## Overview

Phase 7.4 adds backend-only management for multiple encrypted platform credentials under an existing 2FA profile. It supports single and atomic bulk creation, safe metadata listing, partial updates, explicit credential clearing, password-confirmed authentication-key reveals, 2FA-information reveals, rate limiting, soft deletion, and dedicated activity history.

This remains a manual storage-only module. It does not generate TOTP codes, display countdowns, create QR codes, integrate with authenticator applications, or add frontend UI.

## New files

- `server/database/migrations/076_twofa_platform_credentials.sql`
- `database/migrations/076_twofa_platform_credentials.sql`
- `server/src/services/twofaPlatform.service.js`
- `server/src/controllers/twofaPlatform.controller.js`
- `server/src/utils/twofaEncryption.js`
- `server/src/utils/twofaRequest.js`
- `server/src/middleware/twofaRateLimit.middleware.js`
- `server/test/twofaPlatform.test.js`
- `server/test/twofaPlatform.integration.mjs`

## Modified files

- `server/src/routes/twofa.routes.js` adds platform and reveal endpoints.
- `server/src/services/twofa.service.js` exports its existing employee/profile-access helpers for reuse.
- `server/src/controllers/twofa.controller.js` reuses the shared 2FA request-context helper.
- `server/src/validators/twofa.validator.js` adds platform, bulk, update, clear, and reveal validation.
- `server/src/config/env.js` adds encryption version/key and batch-size configuration.
- `server/.env.example` documents the required backend-only encryption settings.
- `server/package.json` adds `npm run test:twofa-platform`.

No frontend files or existing applied migrations were edited.

## Additive database migration

Migration `076_twofa_platform_credentials.sql`:

- Adds nullable `account_label VARCHAR(100)`.
- Adds a unique `encryption_context CHAR(36)` populated with UUID values.
- Makes each credential ciphertext/IV/tag bundle nullable.
- Enforces all-or-none integrity within each encrypted bundle.
- Requires at least one credential bundle to remain present.
- Adds `(profile_id, account_label)` lookup support.

This allows one platform to contain only 2FA information, only an authentication key, or both. A completely credential-empty platform is intentionally rejected to prevent unusable records. Multiple rows with the same platform type/profile are allowed and differentiated by account label.

Both maintained migration copies are byte-identical. No production migration was executed during this phase.

## API endpoints

All endpoints inherit the existing JWT/session, device, forced-password-change, no-store, centralized error, and effective-permission middleware.

| Method | Route | Permission |
|---|---|---|
| `POST` | `/api/v1/2fa/profiles/:profileId/platforms` | `2fa.platform.add` |
| `POST` | `/api/v1/2fa/profiles/:profileId/platforms/bulk` | `2fa.platform.add` |
| `GET` | `/api/v1/2fa/profiles/:profileId/platforms` | `2fa.profile.view` |
| `PATCH` | `/api/v1/2fa/platforms/:platformId` | `2fa.platform.edit` |
| `DELETE` | `/api/v1/2fa/platforms/:platformId` | `2fa.platform.delete` |
| `POST` | `/api/v1/2fa/platforms/:platformId/reveal-2fa` | `2fa.information.reveal` |
| `POST` | `/api/v1/2fa/platforms/:platformId/reveal-key` | `2fa.key.reveal` |

Every operation also checks the active parent profile and the employee's profile-level access. Permission checks alone are insufficient. The existing permission-gated CEO role bypass remains available; Admin has no implicit bypass.

### Single creation

```json
{
  "platformName": "Instagram",
  "accountLabel": "Main Account",
  "twofaInformation": "dummy example information",
  "authKey": "dummy example key"
}
```

The safe response includes the platform ID/type/label, credential-presence booleans, creator/updater objects, and timestamps. It never includes plaintext, ciphertext, IVs, tags, encryption context, or key version.

### Bulk creation

```json
{
  "platforms": [
    {
      "platformName": "Google",
      "accountLabel": "Primary",
      "authKey": "dummy example key"
    },
    {
      "platformName": "Google",
      "accountLabel": "Backup",
      "twofaInformation": "dummy example information"
    }
  ]
}
```

All rows and their `PLATFORM_ADDED` events commit together. Any encryption, insert, constraint, or audit failure rolls back the complete batch. Maximum batch size defaults to 25 and is configurable with `TWOFA_PLATFORM_BATCH_MAX` from 1–100.

### Partial update and explicit clear

Omitted fields are preserved. Sensitive empty strings are invalid. Clearing must be explicit:

```json
{
  "accountLabel": "Updated Main",
  "clearTwofaInformation": true
}
```

Supported clear flags:

- `clearTwofaInformation`
- `clearAuthKey`

An update cannot supply and clear the same field simultaneously. It cannot clear the final remaining credential. Updating metadata alone preserves ciphertext byte-for-byte. A no-op metadata update does not update timestamps or produce misleading activity.

### Reveal stored 2FA information

```http
POST /api/v1/2fa/platforms/12/reveal-2fa
Content-Type: application/json

{}
```

The response data is `{ "value": "..." }`. This returns the stored manual information only; it never generates an authentication code.

### Reveal authentication key with step-up authentication

```http
POST /api/v1/2fa/platforms/12/reveal-key
Content-Type: application/json

{
  "currentPassword": "the requester's current password"
}
```

The password is compared with the authenticated user's bcrypt hash on every raw-key disclosure. It is never stored in activity history or logs. Failed verification records a safe `ACCESS_DENIED` event and returns `401 TWOFA_REAUTHENTICATION_FAILED`.

Both reveal responses explicitly set `Cache-Control: no-store`, `Pragma: no-cache`, and `Expires: 0`, in addition to the application-wide API no-store middleware. The later frontend must perform Copy using the already authorized in-memory reveal response; no unrestricted copy endpoint is necessary.

## Supported platform names

- Instagram
- Facebook
- Google
- TikTok
- YouTube
- LinkedIn
- X / Twitter
- Snapchat
- Microsoft
- Other

Values are normalized to stable database types such as `INSTAGRAM` and `X_TWITTER`. `Other` requires `customPlatformName`; custom names are rejected for standard types. Account labels are optional and duplicate platform types are allowed.

## Validation

- Platform type: required, normalized, strict supported list.
- Custom platform name: trimmed, 1–100 characters, only with `Other`.
- Account label: optional, trimmed, 1–100 characters.
- 2FA information: optional nonblank string, maximum 10,000 characters; formatting is preserved.
- Authentication key: optional nonblank string, maximum 2,000 characters; formatting is preserved and no Base32 rule is imposed.
- At least one credential is required.
- Bulk array: 1 through configured maximum; every item is strict and independently validated.
- Platform/profile IDs: positive safe integers.
- Unknown fields are rejected.
- Key reveal password: required string, maximum 72 characters.

## Encryption implementation

`twofaEncryption.js` uses Node's built-in `crypto` implementation of AES-256-GCM:

- The master key is exactly 32 random bytes encoded as standard base64.
- Every field encryption gets a fresh 12-byte random IV.
- A 16-byte GCM authentication tag detects modification.
- Authenticated additional data binds ciphertext to format version, the row's unique encryption context, field identity, and key version.
- 2FA information and authentication keys are encrypted independently and never reuse a nonce.
- Key buffers are overwritten after use where practical.
- Tampered ciphertext/tag or incorrect AAD fails closed with a generic error.
- Unknown key versions fail closed.

Required production configuration:

```text
TWOFA_ENCRYPTION_KEY=<base64 encoding of exactly 32 securely random bytes>
TWOFA_ENCRYPTION_KEY_VERSION=1
```

The key belongs only in backend Hostinger secret/environment configuration, never MySQL, Git, client `.env`, or a `VITE_*` variable. It must remain stable across restarts and be backed up in a restricted organizational secret store. Losing it makes credentials unrecoverable. Possession of both the database and master key permits decryption, so backups must be stored separately.

If configuration is absent or malformed, credential operations fail closed with `503 TWOFA_ENCRYPTION_UNAVAILABLE`. Phase 7.4 supports version-aware reads but does not implement a rotation job or multiple historical keys.

## Rate limiting

Both reveal routes use a dedicated limiter keyed by authenticated user, resolved client IP, and reveal action. The default is five attempts per 60 seconds per action. It rejects excess attempts with `429 TWOFA_REVEAL_RATE_LIMITED`.

The limiter is deliberately dependency-free and in-memory. It is suitable for the current single-process deployment assumption, resets on restart, and is not shared across multiple Node processes. Phase 7.5/deployment review must replace it with shared persistence if Hostinger runs more than one process.

## Activity history

The existing dedicated `twofa_activity_logs` writer records:

- `PLATFORM_ADDED` for each single/bulk row.
- `PLATFORM_UPDATED` for type/custom-name/account-label changes.
- `TWOFA_UPDATED` for replacement or clearing.
- `AUTH_KEY_UPDATED` for replacement or clearing.
- `TWOFA_REVEALED` and `AUTH_KEY_REVEALED` before plaintext is returned.
- `PLATFORM_REMOVED` on soft deletion.
- `ACCESS_DENIED` for profile-scope reveal/mutation denials and failed key reauthentication.

Mutation events share the database transaction. Reveal auditing must commit successfully before disclosure. History contains field names, platform type/account label where safe, operation identifiers, actor IDs, request ID, IP, and user-agent—but never submitted/revealed values, ciphertext, IVs, tags, passwords, or key material.

## Soft deletion

Deleting one platform sets its `deleted_at`, `deleted_by`, and `updated_by`. It does not modify sibling platforms. Deleted rows:

- Are excluded from list queries.
- Cannot be updated.
- Cannot be revealed.
- Retain their activity history.

Deleting a profile through Phase 7.3 continues to soft-delete all active child platforms in the same transaction.

## Test results

Unit tests cover:

- AES-256-GCM round trip, random IVs, tamper rejection, and AAD binding.
- Supported/custom platform validation, duplicate platform acceptance, partial updates, and explicit clearing.
- Reveal rate limiting.
- Permission declarations and explicit no-store headers.

The isolated MySQL integration suite creates a uniquely named temporary local database, applies migrations 075 and 076, uses dummy credentials only, and removes the database afterward. It covers:

- Single and bulk creation.
- Duplicate platform types and account labels.
- Ciphertext-at-rest checks and absent-field bundles.
- Safe platform-list response shape.
- Unauthorized creation/reveal denial.
- Metadata updates preserving encrypted bytes.
- Credential replacement and authorized decryption.
- Wrong-password rejection and correct-password reveal.
- Explicit clear and final-credential protection.
- Complete bulk rollback when activity insertion is forced to fail.
- Single-platform soft deletion without affecting siblings.
- Deleted credential inaccessibility and retained history.
- Activity coverage and absence of known dummy secrets/passwords from history.

No existing application or production database is changed by these tests.

## Known limitations

- Permission records must still be assigned through existing role administration.
- Profile sharing/access-management APIs remain Phase 7.5.
- The rate limiter is process-local.
- Key rotation/re-encryption is not implemented. Do not change the production key/version until a controlled rotation procedure exists.
- Reveal values are necessarily plaintext in the authorized HTTPS response and process memory briefly; clients must keep them memory-only and remask promptly.
- Copy behavior belongs to the future frontend and must use an authorized reveal response.

## Phase 7.5 dependencies

Phase 7.5 should add profile-access management without weakening the current two-layer authorization model. It must preserve owner access, prevent removal of the last owner, validate active employees, record `ACCESS_GRANTED`/`ACCESS_REVOKED`, and ensure access revocation immediately blocks platform listing, mutation, and reveal operations.
