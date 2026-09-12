# Remote Office Portal

A complete **Remote Office Management System** for managing employees,
attendance, shifts, breaks, leave, holidays, payroll, tasks,
productivity, permissions, notifications, security, and live office
activity from one centralized portal.

The system is designed for remote and hybrid teams where management
needs reliable control over daily office operations while employees need
a simple workspace for attendance, tasks, leave, salary information, and
day-to-day activity.

## Technology Stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Axios

### Backend

- Node.js
- Express.js
- REST API
- JWT Authentication
- bcrypt
- Zod validation
- `mysql2/promise`

### Database

- MySQL
- Versioned SQL migrations
- Connection pooling
- Transaction-safe operations

## Project Structure

```text
Remote-Office-Portal/
├── client/                  # React frontend
├── server/                  # Node.js / Express backend
├── database/                # Schema, migrations and seed files
├── docs/                    # Project documentation
└── README.md
```

## Core Modules

The portal includes:

- Authentication
- CEO / Admin / Employee roles
- Roles & Permissions
- Employee Management
- Mobile Access Control
- Attendance
- Shift Management
- Break Management
- Attendance History
- Live Office Status
- Leave Management
- Weekly Off & Holidays
- Company Calendar
- Salary & Payroll
- Task Management
- Task Work Time Tracking
- Team Presence & Availability
- Notifications
- Audit Logs
- Login Security & Session Activity
- Settings

## Roles & Permissions

### CEO

The CEO has management-level access, including employee management,
attendance monitoring, shifts, leave approval, payroll, task management,
reports, security activity, audit logs, permissions, notifications, and
system settings.

The CEO does not need to Clock In or Clock Out to perform management
actions.

### Admin

Admin access is controlled through assigned permissions. Admin users can
be given management capabilities without automatically receiving
unrestricted CEO-level access.

### Employee

Employees can access permitted functions such as:

- Dashboard
- Clock In / Clock Out
- Breaks
- Attendance History
- Own Tasks
- Open Tasks
- Leave Requests
- Salary information
- Team Availability
- Notifications
- Profile and password settings

Backend permission checks remain authoritative.

## Authentication

Authentication uses JWT and bcrypt with server-side authorization
middleware.

Portal authentication is intentionally separate from Attendance:

```text
Portal Login != Attendance Clock In
Portal Logout != Attendance Clock Out
```

Logging into the portal must not automatically mark an employee present
or affect salary.

## Employee Management

Management can:

- Create employees
- Edit employees
- Assign roles
- Assign permissions
- Assign shifts
- Configure salary
- Change passwords
- Deactivate/delete employees according to business rules
- Configure mobile access
- Configure notification permissions

Historical business records should remain preserved when employee
accounts are deactivated.

## Mobile Access

CEO/Admin mobile access is supported.

Employee mobile access follows the existing mobile-access permission
system. Employees without mobile permission are instructed to use a
desktop or laptop.

## Attendance Management

Attendance functionality includes:

- Clock In
- Clock Out
- Attendance Today
- Attendance History
- Daily reports
- Monthly reports
- Late detection
- Grace periods
- Custom shifts
- Night shifts

Attendance is server-authoritative.

## Shift Management

Management can assign different shifts to individual employees.

Example night shift:

```text
Start: 6:00 PM
End:   3:00 AM
```

Shift policies can include start/end time, expected working hours, break
allowance, grace period, and employee assignment.

## Break Management

Employees can start and end breaks while Clocked In.

When a task is running:

```text
Task Running
    ↓
Start Break
    ↓
Task Auto-Pauses
    ↓
End Break
    ↓
Same Task Auto-Resumes
```

Break duration is excluded from Task Work Time.

## Leave Management

Employees can submit leave requests and management can approve or reject
them.

Leave integrates with existing attendance and payroll policies while
keeping private leave details protected.

## Weekly Off & Holidays

The default weekly off supports Sunday, with Monday through Saturday
treated as working days unless configured otherwise.

Management can create:

- Public Holidays
- Company Holidays
- Special Off Days

Applicable off days are excluded from attendance, absence, leave, and
payroll calculations according to company policy.

## Payroll & Salary Management

Management can configure salary per employee.

Payroll uses business rules involving:

- Attendance
- Assigned shifts
- Leave
- Weekly offs
- Holidays
- Grace periods
- Applicable deductions

The system supports the configured company salary cycle, including a
5th-to-5th period where enabled.

Employees can view their own salary information.

### Payroll Isolation

Task time and portal login time are not payroll time.

```text
Attendance → Payroll
Task Work Sessions → Task Productivity / Reporting
Login Sessions → Security Monitoring
```

These systems must remain separate.

## Task Management

The Task Management system supports:

- Direct Tasks
- Open Tasks
- Drafts
- Scheduled Tasks
- Priorities
- Due dates/times
- Review Required
- Completion Image Required
- Reference images
- Comments
- Activity history
- Reassignment
- Archive/Restore
- Management list view
- Board view
- Filters and search
- Bulk management actions

### Direct Tasks

CEO/Admin can assign a task directly to one employee.

### Open Tasks

Eligible employees can claim available tasks using **Assign to Me**.

Claiming must remain atomic and concurrency-safe.

## Task Workflow

Standard:

```text
To Do
  ↓
In Progress
  ↓
Completed
```

Review workflow:

```text
To Do
  ↓
In Progress
  ↓
Submitted for Review
  ↓
Completed
```

Changes workflow:

```text
Submitted for Review
        ↓
Changes Required
        ↓
Resume Work
        ↓
In Progress
```

Overdue is a flag, not a workflow status.

## Task Reassignment

Started tasks can be reassigned by authorized management with a required
reason.

Previous employee contributions remain preserved.

```text
Employee A → historical contribution preserved
Employee B → becomes current responsible employee
```

Historical work must never be silently transferred between employees.

## Task Work Time Tracking

Task time is recorded using authoritative backend work sessions.

The browser timer is display-only.

```text
Session 1: 8:00 PM → 8:45 PM
Session 2: 9:15 PM → 10:20 PM
```

Total time is calculated from valid work sessions rather than database
writes every second.

### One Active Task Rule

```text
ONE EMPLOYEE
=
MAXIMUM ONE ACTIVE TASK WORK SESSION
```

Employees may have multiple To Do tasks but can actively work on only
one task at a time.

## Attendance + Task Integration

Employees must be Clocked In before starting or resuming task work.

```text
Clock In
   ↓
Start Task
```

Starting/resuming while Clocked Out is rejected by the backend.

## Clock Out + Task Integration

If an employee Clocks Out while a task is running:

```text
Task Running
    ↓
Clock Out
    ↓
Task Work Session Closes
```

The task remains In Progress.

The next Clock In does not automatically resume the task. The employee
must manually select **Resume Task**.

## Offline Auto-Pause

The portal uses authenticated presence/heartbeat monitoring.

If presence disappears beyond the configured timeout while a task is
running:

```text
Task Running
    ↓
Presence Lost
    ↓
Offline Timeout
    ↓
Task Auto-Pauses
```

The default target timeout is 5 minutes and can be configurable.

Returning online does not automatically resume the task.

## Multi-Tab / Multi-Device Safety

The system protects task sessions from:

- Multiple tabs
- Multiple windows
- Multiple browsers
- Multiple devices
- Double clicks
- Network retries
- Stale frontend state

The backend/database remains authoritative.

Page refresh does not pause a running task or create another work
session.

## Team Presence & Availability

The Team Availability system supports:

- Online
- Offline
- On Break
- Away
- Do Not Disturb
- In a Meeting

Online, Offline, and On Break are system-driven.

Away, Do Not Disturb, and In a Meeting can be manual statuses.

Timed statuses can expire automatically.

Presence is separate from Attendance:

```text
Online != Clocked In
Offline != Clocked Out
```

## Live Office Status

The existing Live Office Status integrates with Team Availability so
users can quickly understand who is:

- Online
- In a Meeting
- Do Not Disturb
- On Break
- Away
- Offline

Private task details, salary information, leave reasons, and attendance
history are not exposed through Team Availability.

## Login Security & Session Activity

The system supports security monitoring for portal logins.

Security information can include:

- Employee
- IP Address
- Browser
- Operating System
- Device Type
- Login Time
- Last Active
- Logout Time
- Session Status
- Security Signals

The backend determines request IP information. React must not be trusted
to submit its own IP address.

### Security Signals

The system can identify signals such as:

- New IP
- New browser/device
- Repeated failed login attempts

These are security indicators and do not automatically prove
unauthorized access.

### Login Security Privacy

Detailed login IP/device/session information should only be available to
authorized CEO/Admin users.

Passwords, JWT secrets, refresh tokens, or authentication secrets must
never appear in security logs.

## Notifications

The portal contains a centralized notification architecture for events
such as:

- Clock In
- Clock Out
- Break Start/End
- Leave requests
- Leave approval/rejection
- Task assignment
- Task updates
- Changes Required
- Task review
- Task completion

Desktop notification reliability can be tested across Windows and macOS.

Future notification channels can include email or official WhatsApp
Business integration without creating a separate notification engine.

## Audit Logs

Important business/security operations are recorded through the existing
Audit Log system.

High-frequency events such as heartbeat updates and timer ticks should
not generate unnecessary audit spam.

## Dashboard

Management dashboards can include:

- Employee summaries
- Attendance Today
- Late employees
- Live Office Status
- Team Availability
- Tasks
- Leave
- Payroll summaries
- Recent activity
- Login Security
- Operational metrics

Employee dashboards can include:

- Attendance status
- Clock In / Clock Out
- Break status
- Assigned tasks
- Task progress
- Salary information
- Leave
- Upcoming holidays
- Team Availability
- Notifications

## Data Integrity & Migrations

Future database changes must use versioned, backward-compatible
migrations wherever possible.

Normal deployments must never:

- Reset the production database
- Truncate business tables
- Recreate the entire database
- Replace existing production data
- Delete historical records

Existing employee, attendance, payroll, task, work-session,
login-security, and audit data must remain preserved across future
phases.

## Security Principles

1.  Backend is authoritative.
2.  Frontend permissions are not sufficient by themselves.
3.  Server-side role/permission checks are required.
4.  Client-supplied business timestamps are not trusted.
5.  Employee identity comes from authenticated context.
6.  Passwords are hashed.
7.  SQL queries are parameterized.
8.  Sensitive security information is permission-protected.
9.  Login activity is separate from Attendance.
10. Task timers are separate from Payroll.
11. Presence is separate from Attendance.
12. Production data must survive deployments.

## Environment Variables

Example backend `.env` structure:

```env
NODE_ENV=development
PORT=4000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=remote_office_portal
DB_USER=root
DB_PASSWORD=

JWT_SECRET=replace_with_a_long_secure_random_secret
```

Never commit production secrets to Git.

Frontend configuration may include:

```env
VITE_API_URL=http://localhost:4000/api/v1
```

Use the actual API port/prefix configured by the project.

## Local Development

### Requirements

- Node.js
- npm
- MySQL
- Git

### Clone

```bash
git clone https://github.com/HuzaifaMustafa1126/Remote-Office-Portel.git
cd Remote-Office-Portel
```

### Backend

```bash
cd server
npm install
npm run migrate
npm run dev
```

Configure the server `.env` before starting.

### Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

## MySQL Troubleshooting

If the backend reports:

```text
ECONNREFUSED 127.0.0.1:3306
```

verify:

1.  MySQL is installed.
2.  The MySQL service is running.
3.  Port 3306 is correct.
4.  `.env` credentials are correct.
5.  The database exists.
6.  The configured MySQL user has database permissions.

## Production Architecture

```text
Employee / CEO Browser
          ↓
        HTTPS
          ↓
   Portal Frontend
          ↓
   Node.js / Express API
          ↓
        MySQL
```

The application architecture is suitable for online deployment.

However:

```text
Online-Capable != Production-Ready
```

A final production-readiness audit should be completed before real
employees rely on the system.

## Production Checklist

Before production, verify:

- HTTPS
- Secure environment variables
- Strong JWT secret
- CORS
- Trusted proxy configuration
- Real client IP detection
- Authentication/session security
- Login rate limiting
- MySQL backups
- Migration safety
- Database indexes
- API authorization
- File-upload validation
- Error handling
- Background worker reliability
- Presence/heartbeat reliability
- Concurrent employee behavior
- Browser compatibility
- Responsive interfaces
- Production logging and monitoring

## Core Architecture Separation

The system intentionally separates these concepts:

```text
AUTHENTICATION
Who is logged into the portal?

ATTENDANCE
Who is officially working?

PRESENCE
Who is currently connected/available?

TASK WORK SESSION
What task is the employee actively working on?

BREAK
Is the employee currently taking a registered break?

PAYROLL
What salary/deductions apply according to company rules?
```

These systems can communicate without becoming the same system.

## Example Employee Flow

```text
Employee Login
      ↓
Login Security Session
      ↓
Presence = Online
      ↓
Clock In
      ↓
Attendance Active
      ↓
Start Task
      ↓
Task Work Session Active
      ↓
Start Break
      ↓
Availability = On Break
Task Work Session Auto-Pauses
      ↓
End Break
      ↓
Task Auto-Resumes
      ↓
Continue Work
      ↓
Clock Out
      ↓
Task Auto-Pauses
Attendance Ends
      ↓
Portal may remain Online
      ↓
Logout
      ↓
Security Session Ends
```

## Development Principles

When extending this project:

- Audit existing implementation first.
- Reuse existing services and modules.
- Avoid duplicate systems.
- Preserve historical data.
- Use server-authoritative validation.
- Use database transactions for multi-record business operations.
- Keep Payroll isolated from Task timers.
- Keep Attendance isolated from Portal Login.
- Keep Presence isolated from Attendance.
- Maintain employee privacy boundaries.
- Test on localhost before production.
- Use safe database migrations.
- Regression-test existing modules after every major change.

## Planned Improvements

Future development can include:

### Task Analytics & Productivity Dashboard

- Task completion trends
- Status counts
- Overdue rates
- Average completion time
- Employee workload
- Time spent per task
- Reassignment contribution
- Open Task claim statistics

### Reports & Export

- Employee task-performance reports
- Task-time reports
- Completed/overdue reports
- Attendance vs task activity
- Date-range reports
- CSV/PDF/print exports where appropriate

### Notification Improvements

- Windows desktop notification reliability
- macOS desktop notification reliability
- Configurable notification sounds
- Task/deadline reminders
- Optional email
- Optional official WhatsApp Business integration

### Production Readiness

- Security audit
- Performance audit
- Database/index audit
- Permission audit
- Authentication/session audit
- Migration validation
- Backup strategy
- Hostinger configuration
- Trusted proxy/IP validation
- Background-job validation
- Load/concurrency testing

---

## Remote Office Portal

**One portal for employees, attendance, tasks, payroll, office activity,
security, and management.**

Built as a centralized remote-office operations platform with
server-authoritative business rules, privacy controls, security
monitoring, and scalable online deployment in mind.
