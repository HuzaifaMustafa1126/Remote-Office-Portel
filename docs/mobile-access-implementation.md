# Mobile access and responsive portal

## Behavior

`portal.access_mobile` controls phone access. Migration `018_mobile_portal_access.sql` grants it to existing CEO, ADMIN and SUPER_ADMIN roles only; it does not create roles. The built-in Employee role and custom non-admin roles have no grant by default. Multiple-role users are allowed when any role grants the permission. Removing a grant takes effect on subsequent API requests and profile refreshes.

The permission appears as **Portal Access → Access Portal on Mobile**. Changing this permission requires the existing `permissions.manage` permission plus CEO or SUPER_ADMIN membership. Other permission management behavior is preserved.

The migration has been applied to the local database. Other installations must run `npm run migrate` from `server` before deploying this frontend/backend change.

## Detection and guards

- `client/src/utils/device.js` centralizes the 768px mobile and 1024px desktop breakpoints. It combines viewport/outer-window sizes, device-pixel-ratio changes, user agent, client hints and touch points.
- Phone signals remain mobile in landscape. Recognized tablets, including iPadOS desktop user agents with multitouch, remain allowed. A narrow desktop window is restricted; the outer-window ratio avoids classifying ordinary desktop zoom as a phone where possible.
- `useDeviceType` observes resize/orientation changes with animation-frame coalescing.
- `DeviceAccessProvider` exposes the device and denial state and handles the backend's specific error centrally.
- `DeviceAccessGuard` wraps the authenticated layout, replacing it completely with the themed **Desktop Access Required** screen. The dashboard and its polling hooks are not mounted behind the screen.
- Sign Out uses the existing server logout and session cleanup. Appearance preferences are retained.
- Axios sends `X-Client-Device` and translates `403 MOBILE_ACCESS_DENIED` into the restricted screen. Stale denials from a prior viewport are ignored. Notification fetching and socket connections stop when blocked.

## Backend

`requireDeviceAccess` runs after authentication and before every protected module. It checks fresh database permissions when request headers or user-agent/client-hint signals identify a phone. A phone UA takes precedence over a contradictory `desktop` header. Notification socket handshakes enforce the same permission.

Login, `/auth/me`, heartbeat and logout remain accessible to allow authentication, refresh, expiry and logout on the restricted screen. Password changes are protected by the device rule. Existing module permissions and password-change requirements still apply.

## Responsive components and pages

- `ResponsiveTable` preserves one set of records and action handlers. At widths below 768px, each row becomes a labelled card; above that it remains a table. Table headings remain available to assistive technology.
- Cards cover employee management, dashboard employee attendance, attendance history/daily/monthly reports, leave history/review lists, payroll items/day breakdown, salary profiles/daily earnings, shift templates and company holidays.
- Dense analytics reports and audit logs retain their local horizontal scroll containers.
- The company calendar already used a dated list; on mobile it is now an agenda-style card list with full descriptions and existing Edit/Cancel actions. A new month grid was not introduced.
- The phone header shows navigation, portal title, notifications and profile. Refresh moves into the account menu. Secondary clock information stays on larger screens.
- The navigation drawer uses 85% viewport width (capped at 320px), an overlay, scrollable links, active states, profile and logout. It closes on selection/outside click/Escape, traps keyboard focus and restores focus. Closed navigation is inert.
- Shared styles improve minimum content widths, wrapping, form controls, touch targets and dialog sizing/footers. Existing chart bars use container-relative widths and theme tokens.

## Files created

- `client/src/utils/device.js`
- `client/src/hooks/useDeviceType.js`
- `client/src/context/DeviceAccessContext.jsx`
- `client/src/components/auth/DeviceAccessGuard.jsx`
- `client/src/components/common/ResponsiveTable.jsx`
- `server/src/utils/deviceAccess.js`
- `server/src/middleware/deviceAccess.middleware.js`
- `database/migrations/018_mobile_portal_access.sql`
- `client/test/device.test.js`
- `server/test/deviceAccess.test.js`
- `server/test/mobilePermission.test.js`
- `server/test/mobileRoutes.integration.js`
- `client/test/browser/mobile.audit.cjs`
- This report and `docs/mobile-browser-results.json`.

## Files modified for this feature

- Client app/routing: `App.jsx`, `routes/AppRoutes.jsx`, `context/NotificationContext.jsx`.
- Client services: `services/api.js`, `services/socket.service.js`, `utils/permissions.js`.
- Layout/styles: `layouts/AppLayout.jsx`, `layouts/Header.jsx`, `layouts/Sidebar.jsx`, `index.css`.
- Shared UI: `components/common/Modal.jsx`, `components/common/PageHeader.jsx`, `components/notifications/NotificationBell.jsx`.
- Record components: `components/employees/EmployeeTable.jsx`, `components/attendance/AttendanceTable.jsx`, `components/leave/LeaveHistoryTable.jsx`.
- Pages: `AttendancePage.jsx`, `CompanyCalendarPage.jsx`, `DashboardPage.jsx`, `LeaveRequestsPage.jsx`, `MySalaryPage.jsx`, `PayrollPage.jsx`, `PermissionsPage.jsx`, `SalaryPage.jsx`, `ShiftManagementPage.jsx`.
- Server: `routes/index.js`, `routes/auth.routes.js`, `services/permission.service.js`, `services/schema.service.js`, `sockets/notification.socket.js`.
- Fresh-install defaults: `database/seed.sql`.

Earlier shift/login-notification changes and the user's calendar/login edits are separate from this feature.

## Verification

- 80 unit tests pass (client/server combined), including role/device defaults, tablet and landscape behavior, desktop resize/zoom heuristics, permission grants/revocations and admin restrictions.
- An additional integration test passes against actual Express HTTP routes and Socket.IO with a mocked database: all protected module families reject disallowed phones; allowed phones/tablets/desktops and session endpoints remain functional.
- Production frontend build and server syntax checks pass. Vite retains its bundle-size warning.
- Browser testing uses Chromium with synthetic API data, including populated management tables. The audit covers 20 portal pages plus login at **320, 375, 390, 414, 430, 768, 1024, 1280 and 1440px** (189 page/width combinations).
- CEO/Admin/Employee desktop, tablet and phone access; direct URLs; blocked-page refresh; phone login; logout with retained appearance; resize/recovery; backend-denial display; drawer navigation/focus/Escape; and Light/Dark/Black & White screens are exercised.
- Results and detected browser errors/overflow are recorded in `mobile-browser-results.json`.
- Final browser run passed with **zero page overflow issues and zero browser errors**. All role/device, login, resize, navigation and theme assertions passed.

Commands:

```sh
node --test client/test/*.test.js server/test/*.test.js
node --test server/test/mobileRoutes.integration.js
npm run build --prefix client
npm run check --prefix server
```

The browser audit expects the frontend on `http://127.0.0.1:5175`, Google Chrome at its standard macOS path, and Playwright available through `PLAYWRIGHT_MODULE` or normal module resolution. It intercepts API traffic and does not mutate employee/payroll data.

```sh
npm run dev --prefix client -- --host 127.0.0.1 --port 5175
PLAYWRIGHT_MODULE=/path/to/playwright node client/test/browser/mobile.audit.cjs
```

## Limits

Device information is client-supplied and can be spoofed. This is a UX/access-policy restriction with backend validation, not a hardware attestation mechanism. Tablet identification and zoom handling are necessarily heuristic, especially on browsers that hide device signals. Physical iOS/Android/PWA testing is still advisable; the automated browser suite uses emulation.

No standalone Tasks module is present in this repository, so there is no task-management page to convert. Break information is covered through attendance and the dashboard. No new notification delivery or payroll/attendance business rules are introduced by this feature.
