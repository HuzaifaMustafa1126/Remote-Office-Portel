# Remote Office Portal

A full-featured remote office management platform for attendance, breaks, tasks, leave, payroll, employee management, company calendar, permissions, notifications, and administrative monitoring.

The system is designed for organizations that need a centralized portal for managing employees working remotely or in hybrid environments.

---

## Overview

The Remote Office Portal provides separate experiences for administrators and employees.

Administrators can manage employees, attendance rules, shifts, salaries, leave approvals, notification permissions, holidays, tasks, payroll, and security settings.

Employees can clock in and out, manage breaks, work on tasks, request leave, view attendance history, check salary information, receive notifications, and access company calendar events.

---

## Technology Stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Axios
- GSAP for selected animations

### Backend

- Node.js
- Express.js
- JWT authentication
- bcrypt password hashing
- Zod validation
- mysql2/promise

### Database

- MySQL

### Deployment

Typical production setup:

- Frontend: `portal.yourdomain.com`
- Backend/API: `backend.yourdomain.com`
- Database: MySQL attached to the backend

---

## Project Structure

```text
remote-office-portal/
│
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   └── utils/
│   └── package.json
│
├── server/                 # Node.js / Express backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── scripts/
│   │   └── server.js
│   └── package.json
│
├── database/
│   ├── migrations/
│   ├── schema.sql
│   └── seed.sql
│
├── docs/
└── README.md
```

---

# Main Modules

## 1. Authentication & Security

The portal uses secure JWT-based authentication.

Features include:

- Login
- Logout
- Password hashing with bcrypt
- Protected API routes
- Role-based access control
- Permission-based access control
- Password change
- Session handling
- Login activity tracking
- IP address logging
- Device/browser information
- Unauthorized access protection
- Mobile access restrictions

### Mobile Access

CEO/Admin can be allowed to access the portal from mobile devices.

Normal employees can be restricted from mobile access unless permission is explicitly granted.

If mobile access is not allowed, the portal can display a message asking the employee to use a laptop or desktop.

---

# 2. Roles & Permissions

The system supports role-based and permission-based access.

Typical roles:

- CEO
- Admin
- Employee

The permission system can control access to:

- Attendance
- Tasks
- Leave
- Payroll
- Employees
- Company Calendar
- Notifications
- Reports
- Security features
- Mobile access

Permissions must always be enforced on the backend, not only hidden in the UI.

---

# 3. Employee Management

CEO/Admin can manage employee accounts.

Features include:

- Create employee
- Edit employee
- Delete/disable employee
- Change employee password
- Assign role
- Assign permissions
- Assign shift
- Set salary
- Configure mobile access
- Configure notification access

---

# 4. Attendance Management

Employees can:

- Clock In
- Clock Out
- View attendance status
- View daily history
- View monthly history

Administrators can:

- View all attendance
- Monitor late arrivals
- Monitor early clock-outs
- View absences
- Configure shift timings
- Configure grace periods
- Review attendance reports

---

## Shift Rules

The system supports custom shifts per employee.

Example:

```text
Shift Start: 6:00 PM
Shift End: 3:00 AM
Break: 1 Hour
Target Work Duration: 9 Hours
Grace Period: 10–15 Minutes
```

Shift values should be dynamic and stored in the database.

Do not hardcode shift timings in frontend logic.

---

# 5. Break Management

Employees can:

- Start Break
- End Break

The system tracks:

- Break start time
- Break end time
- Break duration
- Excessive break duration

Notifications can be generated for:

- Break Started
- Break Ended
- Break Exceeded

---

# 6. Leave Management

Employees can submit leave requests.

CEO/Admin can:

- Approve leave
- Reject leave
- Review leave history
- Apply leave rules
- Review salary deductions

Supported notification events include:

- Leave Requested
- Leave Approved
- Leave Rejected
- Leave Cancelled
- Upcoming Leave
- Leave Deduction

The system should respect existing leave/payroll rules and avoid duplicate deduction logic.

---

# 7. Company Calendar & Holidays

The Company Calendar supports:

- Weekly Off
- Public Holiday
- Company Holiday
- Special Off Day
- Custom company events

Default weekly off can be configured.

Example:

```text
Sunday = Weekly Off
Monday–Saturday = Working Days
```

Holiday/off days should be excluded from:

- Absence calculations
- Attendance penalties
- Leave deductions
- Payroll deductions

Notification events may include:

- Holiday Created
- Holiday Updated
- Holiday Cancelled
- Special Off Day Added
- Weekly Off Changed
- Company Announcement

---

# 8. Task Management

The Task Management module supports both assigned tasks and open tasks.

### Task Features

- Create Task
- Create Open Task
- Assign Task
- Reassign Task
- Claim Open Task
- Start Task
- Pause Task
- Resume Task
- Submit Task
- Request Changes
- Complete Task
- Reopen Task
- Update Task
- Change Deadline
- Change Priority
- Add Comment
- Delete Task
- Due Soon reminders
- Overdue alerts

---

## Open Task Flow

```text
CEO/Admin creates Open Task
        ↓
Eligible employees receive notification
        ↓
Employee claims task
        ↓
Task becomes assigned to employee
        ↓
Creator/CEO/Admin receives claim notification
```

Open Task claiming must be atomic so two employees cannot successfully claim the same task.

---

## Task Notification Events

Typical event types:

```text
OPEN_TASK_CREATED
TASK_CLAIMED
TASK_ASSIGNED
TASK_REASSIGNED
TASK_UPDATED
TASK_STARTED
TASK_PAUSED
TASK_RESUMED
TASK_SUBMITTED
TASK_CHANGES_REQUIRED
TASK_COMPLETED
TASK_REOPENED
TASK_DEADLINE_CHANGED
TASK_PRIORITY_CHANGED
TASK_COMMENT
TASK_DUE_SOON
TASK_OVERDUE
TASK_DELETED
```

Task notifications should be generated only after the related database action succeeds.

---

# 9. Payroll & Salary Management

CEO/Admin can:

- Set employee salary
- Generate payroll
- Apply attendance deductions
- Apply leave deductions
- Apply bonuses
- Apply overtime
- Finalize payroll
- Generate payslips

Employees can view:

- Daily salary calculation
- Current payroll progress
- Deductions
- Bonuses
- Final salary
- Payslip status

---

## Salary Period

The portal may use a custom salary period.

Example:

```text
Salary Month:
5th of current month → 5th of next month
```

Payroll calculations should respect:

- Working days
- Weekly off
- Holidays
- Attendance
- Leave
- Grace period
- Shift timing
- Approved/unapproved leave rules

---

# 10. Notification System

The portal contains a centralized notification system.

Supported delivery methods:

- In-App Notifications
- Desktop Notifications
- Notification Sound
- Unread Counter
- Notification History
- Role-based notification permissions
- Employee-specific notification permissions

Notifications should be generated by the backend after the business operation succeeds.

Example:

```text
Leave Approved
      ↓
Database updated
      ↓
Notification created
      ↓
Recipient permission checked
      ↓
Realtime delivery
      ↓
Bell counter updated
      ↓
Desktop alert
      ↓
Sound
```

---

# 11. Notification Permissions

Route:

```text
/settings/notification-permissions
```

This page is for CEO/Admin.

It controls:

> Which notification events each role or employee group is allowed to receive.

This page is different from personal notification settings.

Recommended categories:

- Attendance
- Break
- Leave
- Tasks
- Company & Calendar
- Payroll & Salary
- Security

The permission system should support:

- Role-level permissions
- Employee-specific overrides
- Category toggles
- Individual event toggles
- Enable All
- Disable All
- Search/filter
- Persistent database values

---

# 12. Notification Sound Manager

Administrators can configure notification sounds.

Supported features:

- Upload sound
- MP3
- WAV
- OGG
- Preview sound
- Set default sound
- Set volume
- Assign sound to category
- Assign sound to individual event
- Delete uploaded sound
- Use built-in fallback sound

Suggested priority:

```text
Event Sound Override
        ↓
Category Sound
        ↓
Global Default Sound
```

---

## Browser Audio Behavior

Modern browsers can block audio before the first real user interaction.

The portal should not require employees to repeatedly press a dedicated `Enable Sound` button.

Instead:

```text
Login / first normal click
        ↓
Audio system unlocks
        ↓
Notification sounds work for the current session
```

Normal interactions can include:

- Login
- Navigation
- Clock In
- Opening Tasks
- Keyboard interaction

If sound is blocked before any user interaction:

- In-app notification must still work
- Desktop notification should still work when permitted
- The app should unlock sound automatically after the next real interaction

---

# 13. Notification Event Reliability

Notifications must avoid duplicates.

Use safe logic so one business event results in only one intended notification per recipient.

Avoid duplicates from:

- API retries
- React StrictMode
- Multiple socket listeners
- Multiple browser tabs
- Polling
- Controller + service both generating the same event

Backend notification generation should remain the source of truth.

---

# 14. Notification Database Migration Rules

Notification events should use an idempotent migration strategy.

Do not insert duplicate `event_type` values with plain `INSERT`.

Use an appropriate strategy such as:

```sql
INSERT INTO notification_policies (...)
VALUES (...)
ON DUPLICATE KEY UPDATE
    category = VALUES(category),
    name = VALUES(name),
    description = VALUES(description);
```

Important:

Do not overwrite manually configured permission values during migrations.

Do not use destructive `REPLACE INTO` if records are referenced elsewhere.

---

# 15. Notification Center

The portal notification center should support:

- Unread count
- Mark as read
- Mark all as read
- Category filters
- Search
- Notification history
- Click-to-open related page

Examples:

```text
Task notification
→ Task details

Leave notification
→ Leave details

Calendar notification
→ Company Calendar

Payroll notification
→ Payroll/Payslip
```

---

# 16. Dashboard

The portal contains separate dashboards for CEO/Admin and employees.

Dashboard goals:

- Modern
- Responsive
- Premium
- Fast
- Clear hierarchy
- Live status
- Charts
- Summary cards
- Task summaries
- Attendance summaries
- Team availability
- Company calendar data
- Notifications

Avoid overloading the dashboard with excessive empty spacing or unnecessary cards.

---

# 17. Auto Refresh

The system can support configurable auto-refresh.

Example:

```text
Auto Refresh: ON
Refresh Every: 2 Minutes
```

Where possible, realtime events should be preferred over aggressive polling.

---

# 18. Audit Logs

Important administrative actions should be recorded.

Examples:

- Employee created
- Employee deleted
- Salary changed
- Shift changed
- Permission changed
- Notification permission changed
- Notification sound changed
- Leave approved/rejected
- Payroll finalized
- Company holiday created
- Security setting changed

Avoid logging noisy actions unnecessarily.

---

# 19. Security Requirements

All protected APIs should require authentication.

Important rules:

- Never trust `user_id` sent by frontend for personal resources.
- Use authenticated JWT/session identity.
- Enforce role/permission rules on backend.
- Do not expose salary data to unauthorized employees.
- Do not expose IP addresses to normal employees.
- Do not expose security logs to unauthorized users.
- Validate uploads and inputs.
- Use parameterized SQL queries.
- Use secure password hashing.

---

# 20. Environment Variables

Example backend `.env`:

```env
NODE_ENV=development
PORT=4000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=remote_office_portal
DB_USER=root
DB_PASSWORD=

JWT_SECRET=replace_with_a_secure_random_secret

CLIENT_URL=http://localhost:5173
```

Example frontend `.env`:

```env
VITE_API_URL=http://localhost:4000/api/v1
```

Production values should use live domains.

---

# 21. Local Development

## Requirements

Install:

- Node.js 22+
- npm
- MySQL

Check versions:

```bash
node -v
npm -v
mysql --version
```

---

## Database Setup

Create the database:

```sql
CREATE DATABASE remote_office_portal
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Make sure the entire database uses a consistent collation.

Avoid mixing:

```text
utf8mb4_general_ci
utf8mb4_unicode_ci
```

inside queries that compare values.

---

# 22. Backend Setup

```bash
cd server
npm install
```

Create:

```text
server/.env
```

Then run migrations:

```bash
npm run migrate
```

Seed the first admin/CEO if supported:

```bash
npm run seed:admin
```

Start backend:

```bash
npm run dev
```

Expected:

```text
API listening on http://localhost:4000
```

---

# 23. Frontend Setup

```bash
cd client
npm install
npm run dev
```

Typical development URL:

```text
http://localhost:5173
```

---

# 24. Production Deployment

Recommended production architecture:

```text
Frontend
portal.example.com

Backend
backend.example.com

Database
MySQL
```

Before deployment:

```bash
npm install
npm run build
```

Configure environment variables using the hosting provider.

Run database migrations before using new features.

Never replace the production database with local development data.

---

# 25. Production Database Safety

When adding new phases/modules:

Do NOT reset the database.

Use versioned migrations.

Example:

```text
001_initial_schema.sql
002_attendance.sql
003_leave.sql
...
034_task_notification_policy.sql
```

Migrations must be safe for existing production records.

Before running a migration:

- Backup database
- Review SQL
- Check duplicate keys
- Check foreign keys
- Check column compatibility
- Test on staging/local copy when possible

---

# 26. API Design

Typical API prefix:

```text
/api/v1
```

Example routes:

```text
/api/v1/auth
/api/v1/employees
/api/v1/attendance
/api/v1/breaks
/api/v1/leave
/api/v1/tasks
/api/v1/payroll
/api/v1/company-calendar
/api/v1/notifications
/api/v1/notification-permissions
```

All protected endpoints must validate authentication and authorization.

---

# 27. Recommended Notification Testing

For each notification event verify:

```text
Business action succeeds
        ↓
Notification record created
        ↓
Correct recipient selected
        ↓
Permission checked
        ↓
Realtime event delivered
        ↓
Bell updates
        ↓
Desktop notification works
        ↓
Sound works
        ↓
No duplicate notification
```

Important task tests:

- Open Task Created
- Task Claimed
- Task Assigned
- Task Completed
- Task Due Soon
- Task Overdue

Important leave tests:

- Leave Requested
- Leave Approved
- Leave Rejected

Important calendar tests:

- Holiday Created
- Holiday Updated
- Holiday Deleted

---

# 28. Common Issues

## MySQL Connection Refused

Example:

```text
connect ECONNREFUSED 127.0.0.1:3306
```

Check:

- MySQL is installed
- MySQL service is running
- `.env` credentials are correct
- Database exists

---

## Unknown Database

Example:

```text
Unknown database 'remote_office_portal'
```

Create the database first or run the setup script.

---

## Missing Migration Table

Example:

```text
Table schema_migrations doesn't exist
```

Ensure the migration bootstrap creates the migration tracking table before reading from it.

---

## Collation Error

Example:

```text
Illegal mix of collations
```

Use one consistent database collation.

Recommended:

```text
utf8mb4_unicode_ci
```

or the project standard selected for all tables/columns.

---

## Duplicate Notification Event

Example:

```text
#1062 Duplicate entry 'TASK_CLAIMED' for key 'event_type'
```

The migration is attempting to insert an event that already exists.

Use idempotent migrations.

Do not delete existing policies simply to rerun the migration.

---

## Notification Exists But UI Does Not Update

Check:

- realtime listener
- socket room/user mapping
- authenticated user ID
- employee ID vs user ID
- notification provider
- unread-count refresh

---

## Sound Does Not Play

Check:

- user sound preference
- browser autoplay state
- first interaction unlock
- uploaded sound URL
- MIME type
- HTTPS
- CORS
- file exists
- `NotAllowedError`
- duplicate/multiple AudioContext instances

---

# 29. Development Principles

When extending this portal:

1. Do not break existing modules.
2. Use migrations for database changes.
3. Preserve production data.
4. Reuse existing services.
5. Avoid duplicate business logic.
6. Keep backend as the source of truth.
7. Validate permissions server-side.
8. Keep UI responsive.
9. Avoid hardcoded employee IDs.
10. Avoid hardcoded shift times.
11. Avoid hardcoded CEO IDs.
12. Keep notification events centralized.
13. Keep audit logs meaningful.
14. Test production-like behavior before deployment.

---

# 30. Current System Scope

The Remote Office Portal currently covers:

- Authentication
- Roles
- Permissions
- Employees
- Attendance
- Breaks
- Shifts
- Leave
- Company Calendar
- Holidays
- Tasks
- Open Tasks
- Task Time Tracking
- Payroll
- Salary
- Notifications
- Notification Permissions
- Custom Notification Sounds
- Security Events
- Dashboard
- Audit Logs
- Mobile Access Control
- Reports

---

# Future Improvements

Possible future modules:

- Advanced analytics
- Performance reports
- Team productivity metrics
- Internal chat
- File sharing
- Project management
- Department management
- Client management
- Expense management
- Advanced payroll reports
- Email notifications
- Push notifications
- PWA support
- Native desktop application

---

## License

Private project.

All rights reserved.

---

## Maintainer

Remote Office Portal Development Team
