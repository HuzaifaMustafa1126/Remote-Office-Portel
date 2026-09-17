# Remote Office Portal

Remote Office Portal is a full-stack workforce management system for remote and hybrid teams. It combines attendance, task management, leave, payroll, employee administration, notifications, work notes, team availability, security monitoring, and reporting in one permission-controlled application.

The project contains separate CEO/Admin and employee experiences. Sensitive access rules are enforced by the backend as well as represented in the interface.

## Current Status

Implemented modules include:

- JWT authentication, password management, and server-side sessions
- Role permissions and per-user permission overrides
- Employee profiles, shifts, salaries, and device access controls
- Attendance, overnight shifts, breaks, late policy, and attendance history
- Leave requests, approval workflows, holidays, and company calendar
- Payroll generation, adjustments, deductions, approval, and employee salary views
- Task board, list view, details drawer, filters, analytics, and administration
- Open and direct task assignment, claiming, review, revision, archive, and deletion flows
- Server-authoritative task work sessions integrated with attendance, breaks, presence, and recovery
- Task comments, attachments, activity history, completion evidence, and notifications
- Work Notes with visibility, organization, task links, images, and collaboration controls
- Team availability, custom availability states, Namaz status, and ongoing-work display
- In-app and desktop notifications, notification policies, preferences, and managed sounds
- Login activity, IP/device details, audit logs, dashboards, and reports
- Responsive CEO/Admin access and permission-controlled employee mobile access
- Configurable dashboard auto-refresh and Socket.IO updates

## Technology

### Client

- React 19
- Vite 6
- React Router 7
- Tailwind CSS 4
- Axios
- Socket.IO Client
- GSAP
- Lucide React

### Server

- Node.js 22
- Express 5
- MySQL with `mysql2/promise`
- JWT and bcrypt
- Zod request validation
- Socket.IO
- Helmet, CORS, and Morgan

## Repository Layout

```text
.
├── client/                  React application
│   └── src/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       ├── routes/
│       ├── services/
│       └── utils/
├── server/                  Express API
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── scripts/
│       ├── services/
│       ├── utils/
│       └── validators/
├── database/
│   ├── migrations/          Versioned migrations 001–042
│   ├── schema.sql
│   └── seed.sql
├── docs/
└── deployment/             Generated deployment archives
```

## Main Application Routes

| Route | Purpose |
| --- | --- |
| `/` | Role-specific dashboard |
| `/attendance` | Company attendance management |
| `/attendance/history` | Employee attendance history |
| `/employees` | Employee management |
| `/leave` | Employee leave requests |
| `/leave-requests` | Management leave review |
| `/tasks` | Task dashboard, board, and list |
| `/tasks/employees/:employeeId` | Authorized employee task performance |
| `/notes` | Work Notes |
| `/company-calendar` | Holidays and working calendar |
| `/shifts` | Shift management |
| `/salary`, `/my-salary`, `/payroll` | Salary and payroll workflows |
| `/notifications` | Notification center |
| `/notification-settings` | Personal notification preferences |
| `/login-security` | Authorized login/session monitoring |
| `/settings/attendance-policy` | Attendance and late policy |
| `/settings/notification-permissions` | Company notification policy |
| `/settings/task-management` | Task settings |
| `/settings/appearance` | Portal appearance |

The API is mounted under `/api/v1`. Public health endpoints are available at `/api/v1/health` and `/api/v1/health/database`. Other API routes require authentication and pass through device-access and password-change middleware.

## Task Management

Task Management supports:

- Dashboard, board, paginated list, search, and combined filters
- Company and personal analytics with date ranges
- Draft, scheduled, open, direct, and claimed tasks
- Priorities, deadlines, assignment history, and status history
- Task details drawer with comments, activity, images, and attachments
- Completion-image requirements and review-required workflows
- Changes Required reasons, revision deadlines, and reference images
- Safe drag and drop backed by the normal transition endpoint
- Deadline changes, reassignment, duplication, archive, restore, and controlled deletion
- Bulk management with eligibility and partial-success results
- Employee privacy and server-side permission checks

Task transitions remain server-authoritative. Starting or resuming work checks the assignee, attendance state, approved leave, active break, and competing active task session. Assigned CEO/Admin users can follow the employee workflow on their own tasks without bypassing review or completion-image requirements.

Task work sessions use server timestamps and preserve contributor history. Attendance clock-out, breaks, stale presence, and multi-tab/device recovery integrate with sessions without using a browser-owned timer as the source of truth.

## Work Notes

The Notes module supports personal and authorized shared work knowledge:

- Create, edit, view, organize, pin, and search notes
- Importance and visibility controls
- Task-related notes and captured task-completion notes
- Images and attachments
- Categories, tags, bookmarks, revisions, comments, relations, and mentions where permitted
- CEO-only and employee collaboration permissions

All note APIs derive ownership from the authenticated user and validate access on the server.

## Notifications

The notification system provides:

- In-app notification center and unread counts
- Desktop notifications and managed audio playback
- Personal category/event preferences
- Company policies by audience, role, and selected employee
- Built-in and uploaded sounds, volume levels, previews, defaults, and event/category assignment
- Socket.IO delivery with backend-created notification records
- Idempotent event keys to prevent duplicate delivery
- Click-through navigation to related tasks and other resources

Task notification policy events are installed idempotently. Existing policy IDs and administrator-configured channel and permission values are preserved when migrations are rerun.

Browsers may block sound until the first user interaction. The client unlocks audio from normal interaction while in-app delivery remains available.

## Database and Migrations

The database uses `utf8mb4_unicode_ci` as its canonical collation. Migration `042_normalize_database_collations.sql` converts and verifies actual table and text-column collations to prevent mixed-collation query errors.

There are currently 42 numbered migrations:

- `001–013`: core schema, attendance, leave, calendar, notifications, shifts, payroll, and sessions
- `014–023`: password history, permission repairs, mobile access, attendance policies, notification policies, and overrides
- `024–034`: task management, analytics, collaboration, task sessions/presence, availability, login security, and notification upgrades
- `035–040`: Work Notes and task-note integration
- `041`: Namaz and ongoing-work support
- `042`: database collation normalization and verification

The migration runner handles fresh databases and existing databases whose schema exists but migration history is missing or incomplete:

```bash
cd server
npm run migrations:audit
npm run migrate
npm run migrations:verify
```

For an existing schema, migrations `001–040` are recorded only after all missing durable footprints pass structural checks. Unsafe legacy SQL is not replayed blindly. Migration `041` runs when required, while `042` performs and verifies the required collation work before it is recorded.

Never copy a local `schema_migrations` table into production and never manually mark an unverified migration complete.

## Local Setup

Requirements:

- Node.js 22
- npm
- MySQL 8-compatible server

Create the database:

```sql
CREATE DATABASE remote_office_portal
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Create `server/.env`:

```env
NODE_ENV=development
PORT=4000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=remote_office_portal

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=8h

CORS_ORIGIN=http://localhost:5173
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:4000/api/v1
```

Install and start the backend:

```bash
cd server
npm install
npm run migrate
npm run seed:admin
npm run dev
```

Install and start the frontend in another terminal:

```bash
cd client
npm install
npm run dev
```

Default local addresses:

- Client: `http://localhost:5173`
- API: `http://localhost:4000/api/v1`

## Validation

Backend syntax and test suite:

```bash
cd server
npm run check
node --test test/*.test.js
```

Frontend production build:

```bash
cd client
npm run build
```

The current backend suite covers device access, availability, authentication notifications, permission rules, notification validation, login security, payroll classification, task validation/workflows, task collaboration, presence recovery, task sessions, break integration, and Work Notes validation.

## Production Deployment

Current production domains:

- Portal: `https://portel.abdalimarketing.com`
- API: `https://backend.abdalimarketing.com`

Production secrets must be configured in the active backend build and must never be committed:

```env
NODE_ENV=production
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_hosting_database_user
DB_PASSWORD=your_hosting_database_password
DB_NAME=your_hosting_database_name
JWT_SECRET=your_existing_production_jwt_secret
JWT_EXPIRES_IN=8h
CORS_ORIGIN=https://portel.abdalimarketing.com
TRUST_PROXY_HOPS=1
IP_DIAGNOSTICS=false
```

`TRUST_PROXY_HOPS=1` matches Hostinger's managed reverse proxy directly in
front of the Node process. Keep the application port inaccessible from the
public internet. For one controlled login, `IP_DIAGNOSTICS=true` logs only
Express/socket IP resolution plus `X-Forwarded-For` and `X-Real-IP`. If
`req.ips` proves that Hostinger supplies an additional proxy hop, set the
verified hop count explicitly and immediately turn diagnostics back off.

On Hostinger, the active backend is normally under:

```text
~/domains/backend.abdalimarketing.com/hbuilds/current/nodejs
```

After deploying backend code:

```bash
cd ~/domains/backend.abdalimarketing.com/hbuilds/current/nodejs
export PATH="/opt/alt/alt-nodejs22/root/usr/bin:$PATH"
hash -r
chmod 600 .env
npm run migrations:audit
npm run migrate
npm run migrations:verify
```

Restart the Node application from the Hostinger dashboard after migration. Expected startup state:

```text
Database schema is current.
```

Each Hostinger deployment can create a new version directory. Confirm that the active build has its protected `.env`; otherwise the server may fall back to local development database values.

## Security and Data Safety

- Keep `.env`, database dumps, uploaded private files, and deployment credentials out of source control.
- Use backend permissions for every protected operation.
- Do not trust frontend user, employee, assignee, or resource IDs.
- Use parameterized SQL and Zod input validation.
- Do not reset, truncate, or replace the production database during deployment.
- Take a production backup before migration work.
- Preserve task contributions, audit history, payroll records, and notification preferences during upgrades.
- Restrict private attachments through the existing authorized serving path.

## Supporting Documentation

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/database.md`](docs/database.md)
- [`docs/modules.md`](docs/modules.md)
- [`docs/roles-permissions.md`](docs/roles-permissions.md)
- [`docs/APPEARANCE.md`](docs/APPEARANCE.md)
- [`docs/TASK_TIME_TRACKING_PHASE_3_1.md`](docs/TASK_TIME_TRACKING_PHASE_3_1.md)
- [`docs/mobile-access-implementation.md`](docs/mobile-access-implementation.md)

## License

Private project. All rights reserved.
