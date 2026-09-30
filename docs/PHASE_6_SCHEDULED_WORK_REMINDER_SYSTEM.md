# Phase 6 — Scheduled Work & Reminder System

## Remote Office Portal

### Module Type

Scheduled Work / Future Work / Follow-up Reminder System

### Purpose

The **Scheduled Work & Reminder System** allows employees to schedule work that needs to be performed again or checked at a future date/time.

This module is designed for work such as:

- TikTok mail replacement after 48 hours
- Check a social media account after 2 days
- Follow up with a client tomorrow
- Check an advertising campaign after 24 hours
- Replace account credentials after 7 days
- Review content after 3 days
- Publish scheduled content at a specific time
- Check client analytics next Monday
- Perform recurring account maintenance
- Any future work an employee does not want to forget

This module is separate from the existing **Task Management** and **Ongoing Work** systems.

Its primary purpose is:

> **"I need to remember to do this work at a specific future date or time."**

---

# 1. Core Example

An employee performs:

**TikTok Mail Replacement**

The employee knows that the mail needs to be replaced again after **48 hours**.

The employee creates scheduled work:

```text
Title:
TikTok Mail Replacement

Schedule:
After 48 Hours

Scheduled Date:
02 October 2026

Scheduled Time:
07:00 PM

Reminder:
20 Minutes Before
```

The system stores the scheduled work.

Twenty minutes before the scheduled time:

```text
Reminder

TikTok Mail Replacement is scheduled in 20 minutes.

Scheduled Time:
07:00 PM
```

At 07:00 PM:

```text
Scheduled Work Due Now

TikTok Mail Replacement

This work is scheduled for now.

[Do Now]
[Remind Me Later]
[Mark Complete]
```

If the employee does not complete the work, it becomes:

```text
OVERDUE
TikTok Mail Replacement
Scheduled: 02 Oct 2026 — 07:00 PM
```

The scheduled work must remain visible until the employee completes, reschedules, or deletes it.

---

# 2. Main Objectives

The system must allow employees to:

1. Create scheduled work.
2. Select a future date.
3. Select a future time.
4. Schedule something after X minutes/hours/days.
5. Add advance reminders.
6. Receive in-app notifications.
7. Receive desktop/browser notifications.
8. Receive a notification when the scheduled time arrives.
9. Snooze a reminder.
10. Reschedule work.
11. Mark scheduled work complete.
12. View today's scheduled work.
13. View upcoming scheduled work.
14. View overdue scheduled work.
15. View completed scheduled work.
16. Create recurring scheduled work.
17. Optionally connect scheduled work with Task Management or Ongoing Work.

---

# 3. Module Navigation

Add a new main sidebar item:

```text
Scheduled Work
```

Suggested icon:

```text
CalendarClock
```

or:

```text
BellRing
```

The module should contain:

```text
Scheduled Work

├── Today
├── Upcoming
├── Overdue
├── Recurring
├── Completed
└── All Scheduled Work
```

---

# 4. Dashboard Integration

Employee Dashboard should contain a new section:

## Today's Scheduled Work

Example:

```text
Today's Scheduled Work                          3

TikTok Mail Replacement
07:00 PM
Due in 2 hours

Client Analytics Check
08:30 PM
Due in 3h 30m

Instagram Account Check
10:00 PM
Due in 5 hours
```

Each item should display:

- Work title
- Scheduled time
- Remaining time
- Reminder status
- Priority
- Recurring indicator if applicable
- Current status

Available actions:

```text
Do Now
Snooze
Reschedule
Complete
```

---

# 5. Scheduled Work Statuses

Use clear system statuses.

```text
UPCOMING
DUE_TODAY
DUE_NOW
OVERDUE
COMPLETED
CANCELLED
```

Optional additional status:

```text
SNOOZED
```

Do not permanently convert a scheduled item to `SNOOZED` if snooze can be represented through `next_reminder_at`.

---

# 6. Create Scheduled Work

Add:

```text
+ Schedule Work
```

The creation form should contain the following fields.

## Work Title

Required.

Example:

```text
TikTok Mail Replacement
```

---

## Description

Optional.

Example:

```text
Replace recovery email on the client's TikTok account and verify the new email.
```

---

## Schedule Type

Allow:

```text
Exact Date & Time
After X Time
Recurring
```

---

# 7. Exact Date & Time

Employee can manually select:

```text
Date: 02 October 2026
Time: 07:00 PM
```

Store the resulting timestamp in the database.

Past dates/times must not be accepted for newly created scheduled work.

---

# 8. Schedule After X Time

This is extremely important for this module.

Allow:

```text
After [ 48 ] [ Hours ]
```

Units:

```text
Minutes
Hours
Days
Weeks
Months
```

Examples:

```text
After 20 Minutes
After 12 Hours
After 24 Hours
After 48 Hours
After 2 Days
After 7 Days
After 2 Weeks
After 1 Month
```

The frontend should calculate and show:

```text
Scheduled for:

02 October 2026
07:00 PM
```

before the employee saves it.

The backend must calculate/validate the final timestamp as well.

Do not depend only on frontend calculations.

---

# 9. Quick Schedule Options

Provide quick buttons:

```text
Tomorrow
After 24 Hours
After 48 Hours
After 3 Days
After 7 Days
Next Week
Custom
```

These are shortcuts only.

The employee must still be able to use a custom date/time.

---

# 10. Reminder System

Each scheduled work item can contain one or multiple reminders.

Example:

```text
Reminder 1:
1 Day Before

Reminder 2:
1 Hour Before

Reminder 3:
20 Minutes Before
```

Quick reminder options:

```text
At Scheduled Time
10 Minutes Before
20 Minutes Before
30 Minutes Before
1 Hour Before
2 Hours Before
1 Day Before
Custom
```

---

# 11. Custom Reminder

Allow:

```text
Remind me

[ 45 ] [ Minutes ] Before
```

Units:

```text
Minutes
Hours
Days
```

Example:

```text
2 Hours Before
6 Hours Before
2 Days Before
```

---

# 12. Due-Time Notification

Even if the employee does not configure an advance reminder, the system should generate a notification when the actual scheduled time arrives.

Example:

```text
Scheduled Work Due Now

TikTok Mail Replacement

Scheduled for:
07:00 PM

[Do Now]
[Remind Me Later]
[Mark Complete]
```

---

# 13. Today's Scheduled Work Notification

When an employee logs in or opens the dashboard and has scheduled work today, show a non-intrusive summary.

Example:

```text
Today's Scheduled Work

You have 4 scheduled work items today.

Next:
TikTok Mail Replacement — 07:00 PM

[View Today's Work]
```

Do not repeatedly show the same login popup on every route navigation.

---

# 14. Desktop Notifications

Integrate the scheduler with the existing notification system.

When a reminder becomes due, trigger:

```text
Desktop Notification
+
In-App Notification
+
Configured Notification Sound
```

Example desktop notification:

```text
Scheduled Work Reminder

TikTok Mail Replacement is due in 20 minutes.
```

Due-time notification:

```text
Scheduled Work Due Now

TikTok Mail Replacement is scheduled for now.
```

---

# 15. Notification Persistence

Browser notifications must NOT be the only reminder mechanism.

A user may:

- close the browser
- lose internet
- close the laptop
- log out
- have notifications blocked

Therefore all reminders must be persisted in the database.

When the employee returns, the system should determine whether reminders or scheduled work were missed.

Example:

```text
Missed Scheduled Work

TikTok Mail Replacement

Was scheduled:
02 Oct 2026 — 07:00 PM

Currently:
Overdue by 2h 14m
```

---

# 16. Reminder Processing Architecture

Do not implement the reminder engine using only:

```javascript
setTimeout();
```

or frontend timers.

Frontend timers may improve the live UI, but they must not be the source of truth.

The database must remain authoritative.

Recommended architecture:

```text
Database
    ↓
Reminder Processor
    ↓
Find due reminders
    ↓
Create notification event
    ↓
Existing Notification System
    ↓
In-App / Desktop / Sound
```

The reminder processor must be idempotent.

The same reminder must not accidentally generate duplicate notifications.

---

# 17. Snooze / Remind Me Later

When a notification appears, employee can click:

```text
Remind Me Later
```

Options:

```text
10 Minutes
20 Minutes
30 Minutes
1 Hour
2 Hours
Tomorrow
Custom
```

Example:

```text
TikTok Mail Replacement

Snoozed until:
07:20 PM
```

Snoozing must NOT change the original scheduled timestamp.

Store a separate:

```text
next_reminder_at
```

or equivalent snooze record.

This preserves the historical scheduled time.

---

# 18. Overdue Scheduled Work

If scheduled time passes without completion:

```text
Status:
OVERDUE
```

Example:

```text
TikTok Mail Replacement

OVERDUE

Scheduled:
02 Oct 2026 — 07:00 PM

Overdue:
2h 34m
```

Actions:

```text
Do Now
Complete
Snooze
Reschedule
```

Never automatically mark overdue work complete.

Never silently remove overdue work.

---

# 19. Do Now

Add:

```text
Do Now
```

This action means the employee is starting the scheduled work.

Initially it can simply:

1. acknowledge the reminder;
2. open the scheduled work details;
3. record `started_at`.

Later it can integrate with Ongoing Work.

---

# 20. Ongoing Work Integration

Scheduled Work should remain an independent module.

However, provide optional integration:

```text
Start as Ongoing Work
```

Example:

```text
TikTok Mail Replacement

[Start as Ongoing Work]
```

The system can create an Ongoing Work item containing:

```text
Title
Description
Source Scheduled Work ID
Employee ID
Started At
```

When Ongoing Work is completed, optionally ask:

```text
Also mark the scheduled work as completed?
```

This prevents duplicate manual work.

---

# 21. Task Management Integration

Allow optional connection to an existing Task Management task.

Example:

```text
Related Task:
Client TikTok Management
```

This is optional.

A scheduled reminder must NOT require a Task Management task.

---

# 22. Recurring Scheduled Work

Support recurring work.

Examples:

```text
Every Day
Every 2 Days
Every 7 Days
Every Week
Every Monday
Every Month
Every 30 Days
Custom
```

Example:

```text
Work:
Check TikTok Accounts

Repeat:
Every 2 Days

Time:
07:00 PM

Reminder:
20 Minutes Before
```

After completing today's occurrence, generate/calculate the next occurrence.

---

# 23. Recurrence Modes

Support:

```text
DAILY
WEEKLY
MONTHLY
CUSTOM_INTERVAL
```

Custom interval examples:

```text
Every 2 Days
Every 48 Hours
Every 3 Weeks
```

The recurrence engine must clearly distinguish calendar-based recurrence from duration-based recurrence where necessary.

For example:

```text
Every Monday at 7 PM
```

is different from:

```text
Every 168 hours
```

---

# 24. Recurring Work Completion

Completing one occurrence must NOT complete the entire recurring schedule.

Example:

```text
TikTok Mail Replacement

Occurrence:
02 Oct — Completed

Next:
04 Oct — 07:00 PM
```

Store occurrence history.

---

# 25. Stop Recurrence

Allow employee to:

```text
Pause Recurrence
Resume Recurrence
End Recurrence
```

Optional:

```text
End After X Occurrences
End On Date
Never End
```

---

# 26. Employee Permissions

Normal employees can:

```text
Create own scheduled work
View own scheduled work
Edit own scheduled work
Delete/cancel own scheduled work
Complete own scheduled work
Snooze own scheduled work
Create recurring work
```

They should not see another employee's private scheduled work unless explicitly permitted.

---

# 27. CEO / Admin Access

CEO/Admin should have:

```text
My Scheduled Work
Team Scheduled Work
```

Team Scheduled Work should allow filtering by:

```text
Employee
Date
Status
Priority
Recurring
Overdue
```

CEO/Admin should be able to see:

```text
Employee
Work
Scheduled Date
Scheduled Time
Status
Completed At
```

---

# 28. Scheduling Work for Another Employee

CEO/Admin may optionally create scheduled work for an employee.

Example:

```text
Assigned To:
Ali

Work:
Check Client ABC Campaign

Date:
05 October

Time:
08:00 PM

Reminder:
30 Minutes Before
```

The assigned employee receives:

```text
New Scheduled Work

Check Client ABC Campaign

Scheduled by:
CEO

Scheduled:
05 Oct — 08:00 PM
```

---

# 29. Assignment Protection

If CEO/Admin created the schedule, store:

```text
created_by
assigned_to
```

Do not overwrite ownership information.

Audit all reassignment operations.

---

# 30. Priority

Scheduled work can optionally have:

```text
LOW
NORMAL
HIGH
URGENT
```

Default:

```text
NORMAL
```

Priority should help with sorting but should not modify reminder timestamps unless explicitly configured.

---

# 31. Scheduled Work List

Recommended table/card information:

```text
Work
Employee
Scheduled For
Reminder
Repeat
Priority
Status
Actions
```

Example:

```text
TikTok Mail Replacement
Malik
02 Oct — 07:00 PM
20 min before
No Repeat
Normal
Upcoming
```

---

# 32. Today Page

Route suggestion:

```text
/scheduled-work/today
```

Sections:

```text
Due Now
Coming Up
Completed Today
```

Sort today's incomplete work by scheduled time ascending.

---

# 33. Upcoming Page

Route:

```text
/scheduled-work/upcoming
```

Group scheduled work:

```text
Tomorrow

Next 7 Days

Later
```

---

# 34. Overdue Page

Route:

```text
/scheduled-work/overdue
```

Sort:

```text
Oldest Overdue
Newest Overdue
Priority
Employee
```

Default recommendation:

```text
Most overdue first
```

---

# 35. Calendar View

Add optional:

```text
Calendar
```

Views:

```text
Month
Week
Day
```

Calendar should display scheduled work at its actual scheduled date/time.

Clicking an item opens details.

---

# 36. Search and Filters

Search by:

```text
Work title
Description
Employee
```

Filters:

```text
Today
Upcoming
Overdue
Completed
Recurring
Priority
Employee
Date Range
```

---

# 37. Database Design

Suggested main table:

```sql
scheduled_work
```

Conceptual fields:

```text
id

title
description

created_by
assigned_to

schedule_type

scheduled_at

relative_value
relative_unit

priority

recurrence_type
recurrence_interval
recurrence_unit
recurrence_config

status

started_at
completed_at
cancelled_at

next_reminder_at

created_at
updated_at
```

Use the project's existing ID conventions and foreign-key conventions.

---

# 38. Reminder Table

Create a separate table:

```text
scheduled_work_reminders
```

Suggested fields:

```text
id
scheduled_work_id

reminder_type
reminder_value
reminder_unit

remind_at

status

triggered_at
acknowledged_at

created_at
updated_at
```

Possible reminder statuses:

```text
PENDING
TRIGGERED
ACKNOWLEDGED
CANCELLED
```

---

# 39. Occurrence Table

For recurring schedules create:

```text
scheduled_work_occurrences
```

Suggested fields:

```text
id
scheduled_work_id

scheduled_at

status

started_at
completed_at

created_at
updated_at
```

This prevents recurrence history from being lost.

---

# 40. Snooze History

Recommended table:

```text
scheduled_work_snoozes
```

Fields:

```text
id
scheduled_work_id
occurrence_id
employee_id

original_reminder_at
snoozed_until

created_at
```

This makes snooze activity auditable.

---

# 41. Notification Integration

Add notification event types similar to:

```text
SCHEDULED_WORK_CREATED

SCHEDULED_WORK_ASSIGNED

SCHEDULED_WORK_REMINDER

SCHEDULED_WORK_DUE

SCHEDULED_WORK_OVERDUE

SCHEDULED_WORK_RESCHEDULED

SCHEDULED_WORK_COMPLETED

SCHEDULED_WORK_CANCELLED
```

Recurring events:

```text
SCHEDULED_WORK_NEXT_OCCURRENCE
```

---

# 42. Notification Permissions Integration

Integrate with the existing Notification Permissions module.

Suggested category:

```text
Scheduled Work
```

Events:

```text
New Scheduled Work
Assigned Scheduled Work
Upcoming Reminder
Work Due Now
Overdue Work
Rescheduled Work
```

Do not add confusing duplicate permission settings.

---

# 43. Notification Recipient Rules

Personal scheduled work:

```text
Recipient:
Assigned Employee
```

CEO-created scheduled work:

```text
Recipient:
Assigned Employee
```

Do not notify all employees about another person's scheduled work.

Team-wide notifications are unnecessary unless explicitly configured later.

---

# 44. API Structure

Suggested endpoints:

```text
GET    /api/v1/scheduled-work
POST   /api/v1/scheduled-work

GET    /api/v1/scheduled-work/today
GET    /api/v1/scheduled-work/upcoming
GET    /api/v1/scheduled-work/overdue

GET    /api/v1/scheduled-work/:id

PATCH  /api/v1/scheduled-work/:id
DELETE /api/v1/scheduled-work/:id
```

Actions:

```text
POST /api/v1/scheduled-work/:id/start

POST /api/v1/scheduled-work/:id/complete

POST /api/v1/scheduled-work/:id/snooze

POST /api/v1/scheduled-work/:id/reschedule

POST /api/v1/scheduled-work/:id/cancel
```

---

# 45. Recurrence API

Suggested actions:

```text
POST /api/v1/scheduled-work/:id/pause-recurrence

POST /api/v1/scheduled-work/:id/resume-recurrence

POST /api/v1/scheduled-work/:id/end-recurrence
```

---

# 46. Team API

CEO/Admin:

```text
GET /api/v1/scheduled-work/team
```

Filters:

```text
employeeId
status
from
to
priority
recurring
```

Enforce authorization server-side.

---

# 47. Date and Time Handling

Date/time reliability is critical.

Do not trust the client's clock as the authoritative source.

The backend must:

1. validate requested dates;
2. calculate relative schedules;
3. calculate reminder timestamps;
4. calculate recurrence;
5. determine overdue status;
6. process reminders.

Use a consistent timezone strategy throughout the application.

Persist timestamps consistently and convert them for display at the application boundary.

---

# 48. Relative Time Example

Request:

```json
{
  "title": "TikTok Mail Replacement",
  "scheduleType": "RELATIVE",
  "relativeValue": 48,
  "relativeUnit": "HOURS"
}
```

Backend:

```text
Server Current Time
+
48 Hours
=
scheduled_at
```

The server-generated timestamp is authoritative.

---

# 49. Reminder Calculation Example

Scheduled work:

```text
02 Oct 2026
07:00 PM
```

Reminder:

```text
20 Minutes Before
```

Calculate:

```text
remind_at =
scheduled_at - 20 minutes
```

Store the calculated timestamp.

---

# 50. Reschedule

Employee can change:

```text
02 Oct — 07:00 PM
```

to:

```text
03 Oct — 08:00 PM
```

When rescheduling:

1. update scheduled time;
2. cancel obsolete pending reminder timestamps;
3. generate new reminder timestamps;
4. retain historical audit information;
5. create reschedule audit event.

---

# 51. Completion

When employee clicks:

```text
Mark Complete
```

Store:

```text
status = COMPLETED
completed_at = server timestamp
```

Cancel remaining pending reminders for that occurrence.

For recurring work, calculate/create the next occurrence according to the recurrence rule.

---

# 52. Delete vs Cancel

Prefer soft cancellation over destructive deletion for business records.

Example:

```text
status = CANCELLED
cancelled_at = timestamp
```

If permanent deletion is required, restrict it to CEO/Admin and preserve appropriate audit information according to the portal's data-retention rules.

---

# 53. Audit Logs

Add audit events:

```text
SCHEDULED_WORK_CREATED
SCHEDULED_WORK_UPDATED
SCHEDULED_WORK_ASSIGNED
SCHEDULED_WORK_STARTED
SCHEDULED_WORK_SNOOZED
SCHEDULED_WORK_RESCHEDULED
SCHEDULED_WORK_COMPLETED
SCHEDULED_WORK_CANCELLED
SCHEDULED_WORK_RECURRENCE_PAUSED
SCHEDULED_WORK_RECURRENCE_RESUMED
SCHEDULED_WORK_RECURRENCE_ENDED
```

Audit metadata can include:

```text
scheduled_work_id
employee_id
old_scheduled_at
new_scheduled_at
created_by
assigned_to
```

---

# 54. Popup Design

Do not use browser `alert()`.

Use the portal's premium modal/toast system.

Example:

```text
┌──────────────────────────────────────┐

        SCHEDULED WORK DUE

     TikTok Mail Replacement

     Scheduled for 07:00 PM

     This work is due now.

     [ Do Now ]

     [ Remind Me Later ]

     [ Mark Complete ]

└──────────────────────────────────────┘
```

The popup should be noticeable without blocking the employee indefinitely.

---

# 55. Dashboard Cards

Employee dashboard:

```text
Scheduled Today       4
Due Now               1
Upcoming              8
Overdue               2
```

Avoid adding too many large cards if it makes the existing employee dashboard crowded.

The primary dashboard focus should be:

```text
Due Now
Today's Scheduled Work
Overdue
```

---

# 56. Countdown Display

Upcoming work can display:

```text
Due in 2h 14m
```

or:

```text
Tomorrow at 7:00 PM
```

Avoid second-by-second countdowns for work that is days away.

Use live countdowns only when useful.

---

# 57. Overdue Display

Examples:

```text
Overdue by 20 minutes

Overdue by 3 hours

Overdue by 2 days
```

Use server timestamps as the source of truth.

---

# 58. Notification Deduplication

A reminder processor may execute multiple times.

It must not create duplicate notifications.

Use an idempotency strategy such as:

```text
scheduled_work_reminder_id
+
trigger occurrence
```

Before generating a notification, verify whether it has already been triggered.

---

# 59. Offline Handling

Example:

Scheduled:

```text
07:00 PM
```

Employee comes online:

```text
09:00 PM
```

The system should show:

```text
Missed Scheduled Work

TikTok Mail Replacement

Scheduled:
07:00 PM

Overdue:
2 Hours
```

Do not simply discard reminders because the browser was offline.

---

# 60. Login Handling

After login:

```text
Fetch Today's Scheduled Work
Fetch Overdue Scheduled Work
Fetch Pending/Missed Reminders
```

If there are important due items, display the scheduled-work summary.

Do not generate duplicate notifications on every page refresh.

---

# 61. Page Refresh Handling

Refreshing the page must NOT:

- duplicate reminders;
- duplicate scheduled work;
- restart completed reminders;
- change the scheduled timestamp;
- lose snooze state.

All important state belongs in the backend/database.

---

# 62. Security

Every scheduled-work API must verify:

```text
Authenticated User
Role
Ownership
Assignment
Permissions
```

Employees must not be able to change IDs in API requests to view another employee's private scheduled work.

CEO/Admin team access must be explicitly authorized server-side.

---

# 63. Validation

Validate:

```text
Title required
Valid schedule type
Future scheduled date
Valid reminder
Reminder occurs before due time where applicable
Valid recurrence interval
Valid assigned employee
Valid priority
```

Set reasonable limits for title and description lengths.

---

# 64. Concurrency

Prevent duplicate completion actions.

Example:

Employee double-clicks:

```text
Mark Complete
```

Only one completion operation should succeed logically.

Recurring schedule generation must also be idempotent to prevent duplicate next occurrences.

---

# 65. Performance

Add indexes appropriate to queries such as:

```text
assigned_to
scheduled_at
status
next_reminder_at
created_by
```

Potential composite indexes should be evaluated for:

```text
assigned_to + status + scheduled_at
```

and reminder processing:

```text
status + remind_at
```

Use actual query plans before over-indexing.

---

# 66. Reminder Worker

Implement a server-side reminder processing mechanism compatible with the deployed Hostinger environment.

Conceptually:

```text
Find reminders where:

status = PENDING

AND

remind_at <= current server time
```

Then:

```text
Create Notification

Mark Reminder Triggered

Store triggered_at
```

The implementation must be restart-safe.

---

# 67. Important Deployment Requirement

Do not assume a permanently running frontend browser.

Do not make reminder reliability depend on:

```text
React being open
Browser tab being active
setTimeout()
setInterval()
```

The backend/database must remain the source of truth.

If the production hosting environment supports scheduled jobs/cron, use a server-side job strategy appropriate to that environment.

---

# 68. Mobile Rules

Respect the portal's existing mobile-access policy.

CEO/Admin and specifically permitted employees should receive the same responsive Scheduled Work interface when mobile access is allowed.

Do not bypass existing mobile restrictions just because a scheduled-work notification was opened.

---

# 69. UI Style

Follow the existing Remote Office Portal design.

Requirements:

```text
Premium
Minimal
Modern
Black/White Theme
Readable
Fast
Responsive
Consistent spacing
Clear status hierarchy
```

Do not introduce a completely different design system.

---

# 70. Recommended Card Example

```text
TikTok Mail Replacement

Today · 07:00 PM

Reminder
20 min before

Priority
Normal

Due in 2h 18m

[Do Now] [Snooze] [...]
```

---

# 71. Empty State

Example:

```text
No Scheduled Work Today

You don't have any scheduled work remaining today.

[Schedule Work]
```

---

# 72. Completed History

Completed scheduled work should show:

```text
TikTok Mail Replacement

Scheduled:
02 Oct — 07:00 PM

Completed:
02 Oct — 07:21 PM

Completed By:
Employee Name
```

This allows CEO/Admin to review execution history when appropriate.

---

# 73. Future Analytics

Do not overbuild analytics in the first release.

The architecture should make future metrics possible:

```text
Scheduled
Completed
Completed On Time
Completed Late
Overdue
Average Completion Delay
Recurring Completion Rate
```

These can be added later.

---

# 74. Phase Breakdown

Implement the module in controlled sub-phases.

## Phase 6.1 — Scheduled Work Foundation

Build:

```text
Database tables
Migration
Backend models/services
CRUD API
Permissions
Create Scheduled Work
Edit
Cancel
Complete
Today
Upcoming
Overdue
```

No complex recurrence is required yet.

---

## Phase 6.2 — Reminder Engine

Build:

```text
Reminder table
Reminder calculation
Reminder processor
Due detection
Notification creation
Duplicate protection
Missed reminder handling
```

Integrate with the existing notification system.

---

## Phase 6.3 — Reminder UI & Snooze

Build:

```text
Due popup
Advance reminder popup
Desktop notification
Notification sound
Snooze
Custom snooze
Missed reminder UI
```

---

## Phase 6.4 — Recurring Scheduled Work

Build:

```text
Daily
Weekly
Monthly
Custom interval
Occurrence history
Pause
Resume
End recurrence
Next occurrence generation
```

---

## Phase 6.5 — Dashboard & Calendar

Build:

```text
Today's Scheduled Work
Due Now
Upcoming
Overdue
Calendar
Filters
Search
Dashboard counters
```

---

## Phase 6.6 — Ongoing Work / Task Integration

Build:

```text
Do Now
Start as Ongoing Work
Link Task
Source tracking
Completion synchronization
```

Do not tightly couple the modules.

---

## Phase 6.7 — CEO/Admin Team Scheduling

Build:

```text
Schedule for employee
Team Scheduled Work
Employee filters
Assignment notifications
Management permissions
Team visibility
```

---

## Phase 6.8 — Audit, Reliability & Optimization

Perform a complete audit of:

```text
Reminder reliability
Timezone handling
Duplicate notifications
Recurring occurrence generation
Permissions
Ownership
Offline behavior
Login behavior
Refresh behavior
Database indexes
API performance
Desktop notifications
Notification sounds
Mobile responsiveness
Audit logs
Production deployment
```

---

# 75. Acceptance Scenario A

Employee creates:

```text
TikTok Mail Replacement
After 48 Hours
Reminder: 20 Minutes Before
```

Expected:

1. Server calculates scheduled timestamp.
2. Scheduled work appears under Upcoming.
3. On scheduled date it appears under Today.
4. 20 minutes before, reminder notification triggers.
5. At scheduled time, Due Now notification triggers.
6. Employee can complete or snooze.
7. If ignored, work becomes overdue.
8. Work remains visible until resolved.

---

# 76. Acceptance Scenario B

Employee schedules:

```text
Check Client Campaign
Tomorrow
08:00 PM
Reminder:
1 Hour Before
```

Expected:

```text
07:00 PM → Reminder

08:00 PM → Due Now

After 08:00 PM without completion → Overdue
```

---

# 77. Acceptance Scenario C

Recurring work:

```text
TikTok Mail Replacement
Every 2 Days
07:00 PM
20 Minute Reminder
```

Employee completes today's occurrence.

Expected:

```text
Today's occurrence:
COMPLETED

Next occurrence:
2 days later — 07:00 PM
```

The recurring parent schedule remains active.

---

# 78. Acceptance Scenario D

Employee is offline when reminder occurs.

Expected:

```text
No data lost.

When employee returns:

Scheduled Work Overdue

TikTok Mail Replacement
Scheduled 2 hours ago.
```

---

# 79. Acceptance Scenario E

Employee snoozes:

```text
20 Minutes
```

Expected:

```text
Original scheduled time remains unchanged.

New reminder:
Current time + 20 minutes
```

The snooze action is recorded.

---

# 80. Acceptance Scenario F

CEO schedules work for an employee.

Expected:

1. Schedule is created with `created_by = CEO`.
2. `assigned_to` points to employee.
3. Employee receives assignment notification.
4. Work appears in employee Upcoming.
5. Reminder is sent only to appropriate recipient(s).
6. CEO can view its current status from Team Scheduled Work.

---

# 81. Definition of Done

Phase 6 is considered complete when:

- Employees can create future scheduled work.
- Exact date/time scheduling works.
- "After X hours/days" works.
- 48-hour scheduling works correctly.
- Today's work is automatically identified.
- Advance reminders work.
- Due-time notifications work.
- Desktop/in-app notifications work with the existing notification system.
- Snooze works.
- Overdue handling works.
- Recurring schedules work.
- Occurrence history is preserved.
- CEO/Admin team scheduling works.
- Ongoing Work integration works.
- Permissions are secure.
- Duplicate notifications do not occur.
- Refreshing does not reset reminders.
- Offline users do not permanently miss scheduled work.
- Date/time calculations are production-safe.
- Audit logs are recorded.
- Production behavior has been tested.

---

# 82. Critical Engineering Rules

### Rule 1

Never depend only on frontend timers for scheduled work.

### Rule 2

Never remove scheduled work simply because its date has passed.

It becomes:

```text
OVERDUE
```

### Rule 3

Never mark work complete automatically.

### Rule 4

Snoozing must not modify the original scheduled timestamp.

### Rule 5

Recurring schedules must preserve occurrence history.

### Rule 6

Every reminder must be protected against duplicate processing.

### Rule 7

The backend/database is the source of truth for schedule calculations.

### Rule 8

Employees must only access scheduled work they are authorized to access.

### Rule 9

Use the existing notification infrastructure instead of building a completely separate notification system.

### Rule 10

Keep Scheduled Work independent from Task Management and Ongoing Work, while providing optional integrations between them.

---

# Final Workflow

```text
Employee / CEO
      ↓
Schedule Work
      ↓
Choose Exact Date/Time
OR
After X Hours/Days
      ↓
Configure Reminder
      ↓
Save
      ↓
Upcoming Scheduled Work
      ↓
Reminder Time Arrives
      ↓
In-App + Desktop + Sound
      ↓
Scheduled Time Arrives
      ↓
DUE NOW
      ↓
┌──────────────┬──────────────┬──────────────┐
│    Do Now    │    Snooze    │   Complete   │
└──────────────┴──────────────┴──────────────┘
      ↓
If Ignored
      ↓
OVERDUE
      ↓
Employee Resolves Work
      ↓
COMPLETED
      ↓
If Recurring
      ↓
Create / Calculate Next Occurrence
```

---

# Phase 6 Goal

The final goal of Phase 6 is simple:

> **No employee should have to manually remember future work.**

If someone needs to replace a TikTok email after 48 hours, check an account after 7 days, follow up with a client tomorrow, review a campaign next week, or repeat work every few days, the Remote Office Portal should remember it for them and notify them at the correct time.
