# Appearance system

Open **Settings → Appearance** from the sidebar, header account menu, or Account Settings. All authenticated users can access it without an appearance permission. The existing mandatory password-change flow still takes precedence.

## Features

- Light, Dark, System, and designed Black & White modes.
- Eight built-in accent palettes, each with an eight-color strip, selected state, favorite toggle, preview, and action menu.
- Select applies and saves immediately. Preview changes the whole application temporarily; Apply saves, Cancel restores the saved preference. Save Changes also applies an active preview.
- Custom themes support nine semantic color fields, six-digit HEX input, color pickers, name editing via Customize, duplication, and an immediate local preview. Text/background contrast is checked before saving.
- System mode subscribes to device color-scheme changes. Color transitions respect reduced motion.
- Attendance and leave statuses retain explicit text and now include non-color symbols. Monochrome warning, success, and danger treatments use distinct borders. Charts have semantic series colors.

## Architecture

`client/src/theme/theme.js` is the central palette registry, preference validator, contrast helper, and token resolver. `ThemeProvider` sits inside the existing auth provider, above all routes, so the login screen, layout, page content, dialogs, and notification overlays share one appearance.

`client/src/index.css` exposes semantic tokens to Tailwind through `@theme inline`. Components use `bg-surface`, `text-foreground`, `text-primary-text`, `border-border`, status tokens, and chart tokens. Primary fill and primary text have separate tokens so pale dark-mode accents and custom colors remain legible. Inverse hero surfaces and sidebar text have their own foregrounds.

Black & White mode uses explicit neutral token values, not a filter. The Black & White palette also supplies neutral values in Light/Dark modes. Palette swatches and color-picker controls intentionally show the candidate colors even while the rest of the interface is monochrome.

The blocking `public/appearance-init.js` applies a validated cached paint snapshot before React and styles load. React initializes from the saved preference before rendering and resolves the current OS setting. Temporary previews are not cached. No appearance data changes attendance, payroll, leave, or other business rules.

## Persistence

No appearance preference API/table existed, so this implementation uses the requested localStorage fallback:

- `remote-office-appearance:v1:<user-id>` — mode, selected palette, custom themes, favorites.
- `remote-office-appearance:v1:<user-id>:paint` — startup paint snapshots for light/dark system preferences.
- `remote-office-appearance:last-user` — last signed-in account for initial paint and the login screen.

Preferences survive reload, logout/login, and browser restart. A different account loads its own saved preferences or the System/Purple default. Storage events synchronize the same account between tabs. Unavailable storage shows a notice and permits in-memory use. Reset restores System/Purple while retaining custom palettes and favorites.

**Database migration:** none. **New API endpoints:** none. **New production dependencies:** none. No backend files were modified for this appearance task; existing backend edits in the workspace belong to earlier work.

## Files created

- `client/src/theme/theme.js`
- `client/src/context/ThemeContext.jsx`
- `client/src/pages/AppearancePage.jsx`
- `client/src/components/appearance/ThemePreview.jsx`
- `client/src/components/appearance/ThemePreviewBar.jsx`
- `client/src/components/appearance/CustomThemeModal.jsx`
- `client/public/appearance-init.js`
- `client/test/theme.test.js`
- `docs/APPEARANCE.md`

## Files modified

Application wiring: `client/index.html`, `src/main.jsx`, `src/App.jsx`, `src/index.css`, `src/routes/AppRoutes.jsx`.

Navigation and settings: `src/layouts/Header.jsx`, `src/layouts/Sidebar.jsx`, `src/pages/AccountSettingsPage.jsx`.

Semantic color migration covers the existing page/component files under:

- `src/components/common` (buttons, inputs, modal, badges, refresh, loading and empty states)
- `src/components/attendance`, `calendar`, `dashboard`, `employees`, `leave`, `notifications`
- All existing page UIs: login, dashboard, attendance/history, employees/profile, leave/review, payroll/salary, calendar, reports, notifications/preferences, audit logs, roles, permissions, shifts, account settings, and not-found.

The shared Modal now uses the browser dialog primitive for focus containment, Escape dismissal, return focus, and themed backdrop; its props and caller behavior are retained.

Hardcoded neutral surfaces/borders/text were replaced by semantic surface, border, foreground, and muted tokens. Indigo/purple branding was converted to primary/accent tokens. Red, emerald, amber, and informational treatments retain distinct semantic status families. Existing dashboard bar colors use `chart-1` through `chart-5`. Print colors remain intentionally black on white.

## Verification

- `node --test client/test/theme.test.js`: 34 tests covering every built-in mode/palette combination, text contrast, monochrome neutrality, system behavior, malformed storage, and per-account isolation.
- `npm run build --prefix client`: production build passes. Vite still reports its >500 kB bundle advisory.
- `git diff --check`: passes.
- Headless Chrome with mocked API responses: mode selection, OS changes, preview/cancel/apply, reload persistence, favorite toggle, custom creation/duplication, keyboard Escape, reset, and 390px mobile width.
- All 20 existing authenticated routes checked in each of the four modes (80 route checks), plus login persistence and calendar dialogs in all four modes. Account switching in one browser confirmed independent preferences.
- Browser screenshots reviewed for the Appearance page and Dashboard in Light, Dark, and Black & White. Route audit uses fixtures rather than production data; it does not exercise business mutations.

## Limits

- Browser-local preferences do not sync to another device/browser and are removed if site storage is cleared.
- Optional company-wide default storage is not implemented. Reset uses the application default.
- There is no task page/router in this checkout to migrate. New screens should use semantic tokens.
- Native date-picker popup rendering follows the browser's color-scheme support.
- Not deployed; deploy the frontend build, including `appearance-init.js`.
