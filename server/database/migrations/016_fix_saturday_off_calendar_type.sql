-- Correct only the known inconsistent record. The date, current type, and exact
-- business labels are all required so unrelated working-day overrides remain untouched.
UPDATE company_calendar_days
SET day_type = 'WEEKLY_OFF'
WHERE calendar_date = '2026-09-05'
  AND day_type = 'WORKING_DAY'
  AND status = 'ACTIVE'
  AND title = 'Saturday Off'
  AND description = 'Saturday Off';
