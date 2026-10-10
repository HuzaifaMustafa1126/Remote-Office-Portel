# Phase 7.7 — 2FA Manager Frontend UI

## Completed features

Phase 7.7 adds the complete React interface for the storage-only 2FA Manager. It includes permission-aware navigation, searchable profile management, dynamic multi-platform creation, profile details, platform credential controls, employee access management, and activity history. It does not generate TOTPs, QR codes, countdowns, or authenticator integrations.

## Routes and navigation

- `/2fa-manager` — searchable, sortable, paginated profile list
- `/2fa-manager/:profileId` — profile details with Platforms, Activity History, and Employee Access tabs

The sidebar item and both routes require `2fa.profile.view`. Existing mobile access enforcement remains outside and around these routes through `DeviceAccessGuard`.

## New frontend files

- `client/src/services/twofa.service.js`
- `client/src/pages/TwofaManagerPage.jsx`
- `client/src/pages/TwofaProfilePage.jsx`
- `client/src/components/twofa/ProfileCreateModal.jsx`
- `client/src/components/twofa/PlatformFields.jsx`
- `client/src/components/twofa/PlatformsTab.jsx`
- `client/src/components/twofa/AccessTab.jsx`
- `client/src/components/twofa/HistoryTab.jsx`
- `client/test/twofa.test.js`

The existing routes, sidebar, permission constants, and package scripts were extended without changing unrelated page behavior.

## Profile and platform workflows

The profile page supports search, sorting, pagination, loading skeletons, retryable errors, responsive records, and an empty state. Add Profile accepts one or more platform sections and uses the actual create-profile and bulk-platform endpoints.

Because the backend exposes these as two operations, the modal records the successfully created profile ID. If platform creation fails, the entered credential fields remain in component memory and the action changes to **Retry Platforms**; retrying does not create another profile.

The detail page supports profile rename and soft-delete confirmation. Platforms render as responsive cards. Add Platform supports bulk entry. Edit Platform never fetches existing plaintext credentials and uses explicit Replace or Clear controls, preserving omitted credentials.

## Credential reveal and copy

Credentials are masked initially and fetched only through the dedicated reveal endpoints. Authentication-key reveal and copy require current-password reauthentication. Revealed values live only in component state, clear after 60 seconds, and clear when the platform tab unmounts. They are never written to local storage, session storage, URLs, logs, analytics, or the API cache.

Copy uses the same reveal flow when a value is not already temporarily visible. The UI explains that clipboard contents are controlled by the user's device.

## Employee access

The Employee Access tab lists owner/granted records and the four independent capabilities. Grant Access reuses the existing active-employee API and Phase 7.5 endpoints. Capability controls automatically enforce the view dependency. Owner controls are read-only, revocation requires confirmation, requests are disabled while saving, and backend privilege-escalation rules remain authoritative.

## Activity history

The Activity History tab uses the Phase 7.6 profile-history endpoint. It shows immutable employee/platform context, safe descriptions, changed field names, accurate stored timestamps formatted with the application's `en-PK` locale, newest-first pagination, and employee/platform/action/date filters. No secret-bearing metadata is rendered.

## Permission-aware behavior

Module permissions control navigation, route access, tabs, and actions. Profile details also consume backend `capabilities` so resource-level edit/reveal/access controls are hidden when unavailable. The server remains authoritative, and API denial messages are handled without exposing stack traces.

## Responsive and accessible behavior

The interface uses existing theme tokens, buttons, dialogs, responsive tables, focus styles, and reduced-motion behavior. Layouts collapse to single-column cards/forms, tabs scroll safely on narrow screens, dialogs use the existing native accessible dialog wrapper, labels are explicit, and icon actions include accessible names.

## API integrations

The centralized frontend service covers profile CRUD; single/bulk platform operations; both reveal flows; access list/grant/update/revoke; and profile/global history. It uses the existing Axios instance, authentication interceptor, configured API base URL, and mobile policy headers.

## Testing results

`npm run test:twofa` verifies endpoint coverage, permission-protected navigation, masked and temporary credential behavior, absence of browser-storage persistence, partial-failure retry safety, and permission-aware tabs. The production Vite build also passes.

## Known limitations and Phase 7.8 dependencies

The current employee picker depends on the existing `employees.view_all` API permission in addition to `2fa.access.manage`; deployments should assign both to access administrators. The global history API is integrated in the service but Phase 7.7 exposes profile-scoped history in the UI. Browser-driven authenticated end-to-end tests will benefit from a dedicated seeded test account/environment in Phase 7.8. The existing bundle-size warning predates route-level code splitting and can be addressed separately without changing this module's behavior.
