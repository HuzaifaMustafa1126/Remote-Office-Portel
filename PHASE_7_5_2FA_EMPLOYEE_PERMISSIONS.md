# Phase 7.5 — 2FA Employee Permissions

## Scope

Phase 7.5 adds employee-level access management to existing 2FA profiles. It does not add frontend screens, activity-history APIs, TOTP generation, or encryption changes.

## Authorization model

Every request still requires its module permission through the existing permission middleware. Profile-level authorization is an additional requirement and never replaces module authorization.

Each `twofa_profile_access` row now carries four independent capabilities:

- `can_view`
- `can_edit`
- `can_reveal_twofa`
- `can_reveal_auth_key`

Edit and reveal capabilities require view capability. Profile creators receive an `OWNER` row with all four capabilities, but still need the corresponding module permissions. Existing owners are backfilled with all four capabilities; existing granted employees remain view-only.

The centralized `twofaAuthorization.service.js` applies these rules to profiles, platform mutations, and both reveal paths. Access management requires `2fa.access.manage` plus `can_edit` on that profile. CEO users bypass only the profile row/capability check; the route-level module permission and security controls still apply. Admin users have no implicit bypass.

Employee status is checked at request time. Inactive employees lose access immediately, and access can only be granted to active employees. Revocation deletes the access row and therefore takes effect on the next request without cache delay.

Managers cannot grant a module or profile capability that they do not themselves hold. Owner rows cannot be edited or revoked; ownership transfer is outside this phase.

## API

All routes are under `/api/v1/2fa` and require `2fa.access.manage`:

- `GET /profiles/:profileId/access`
- `POST /profiles/:profileId/access`
- `PATCH /profiles/:profileId/access/:employeeId`
- `DELETE /profiles/:profileId/access/:employeeId`

Grant body:

```json
{
  "employeeId": 42,
  "permissions": {
    "canView": true,
    "canEdit": false,
    "canRevealTwofa": true,
    "canRevealAuthKey": false
  }
}
```

Update uses the same complete `permissions` object. Complete replacement avoids ambiguous partial capability changes. Duplicate grants return `409`; missing or inactive employees are rejected; inaccessible profiles use the existing non-enumerating `404` behavior.

## Audit and transactions

Grant, update, and revoke run in database transactions and emit `ACCESS_GRANTED`, `ACCESS_UPDATED`, and `ACCESS_REVOKED`. Events identify the target employee and changed capability names but never contain credential plaintext. Denials emit `ACCESS_DENIED` after rollback so the denial remains durable.

## Deployment

Run migration `077_twofa_employee_access_capabilities.sql` with the normal migration runner before deploying application code. The migration is mirrored in both migration directories used by this repository.

Recommended verification:

```bash
cd server
npm run migrations:audit
npm run migrate
npm run migrations:verify
npm run test:twofa-access
npm run test:twofa-profile
npm run test:twofa-platform
```
