-- Additive policy/payroll fields plus a non-destructive employee lifecycle.
ALTER TABLE attendance_policies
  ADD COLUMN sandwich_leave_enabled BOOLEAN NOT NULL DEFAULT TRUE AFTER late_counter_period,
  ADD COLUMN sandwich_apply_unapproved BOOLEAN NOT NULL DEFAULT TRUE AFTER sandwich_leave_enabled,
  ADD COLUMN sandwich_apply_unpaid BOOLEAN NOT NULL DEFAULT TRUE AFTER sandwich_apply_unapproved,
  ADD COLUMN sandwich_apply_paid BOOLEAN NOT NULL DEFAULT FALSE AFTER sandwich_apply_unpaid,
  ADD COLUMN sandwich_include_weekly_off BOOLEAN NOT NULL DEFAULT TRUE AFTER sandwich_apply_paid,
  ADD COLUMN sandwich_include_company_holidays BOOLEAN NOT NULL DEFAULT TRUE AFTER sandwich_include_weekly_off,
  ADD COLUMN sandwich_include_public_holidays BOOLEAN NOT NULL DEFAULT TRUE AFTER sandwich_include_company_holidays,
  ADD COLUMN sandwich_include_adjacent BOOLEAN NOT NULL DEFAULT TRUE AFTER sandwich_include_public_holidays,
  ADD COLUMN sandwich_include_between BOOLEAN NOT NULL DEFAULT TRUE AFTER sandwich_include_adjacent,
  ADD COLUMN sandwich_show_in_payroll BOOLEAN NOT NULL DEFAULT TRUE AFTER sandwich_include_between;

ALTER TABLE payroll_items
  ADD COLUMN sandwich_days SMALLINT UNSIGNED NOT NULL DEFAULT 0 AFTER absence_days,
  ADD COLUMN sandwich_deduction DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER absence_deduction,
  ADD COLUMN show_sandwich_breakdown BOOLEAN NOT NULL DEFAULT TRUE AFTER sandwich_deduction;

ALTER TABLE employees
  ADD COLUMN deleted_at DATETIME NULL AFTER status,
  ADD COLUMN deleted_by BIGINT UNSIGNED NULL AFTER deleted_at,
  ADD INDEX idx_employees_retained_status(deleted_at,status),
  ADD CONSTRAINT fk_employee_deleted_by FOREIGN KEY(deleted_by) REFERENCES users(id) ON DELETE SET NULL;

