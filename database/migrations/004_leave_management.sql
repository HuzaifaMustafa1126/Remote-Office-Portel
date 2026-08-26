-- Phase 1.3 leave management and payroll-preparation data.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS leave_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id BIGINT UNSIGNED NOT NULL,
  leave_type ENUM('CASUAL','SICK','EMERGENCY','PERSONAL','OTHER') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INT UNSIGNED NOT NULL,
  reason VARCHAR(1000) NOT NULL,
  status ENUM('PENDING','APPROVED','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at TIMESTAMP NULL,
  review_comment VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_leave_request_employee FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
  CONSTRAINT fk_leave_request_reviewer FOREIGN KEY(reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_leave_request_employee_dates(employee_id,start_date,end_date),
  INDEX idx_leave_request_status_created(status,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leave_days (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  leave_request_id BIGINT UNSIGNED NOT NULL,
  employee_id BIGINT UNSIGNED NOT NULL,
  leave_date DATE NOT NULL,
  approval_status ENUM('PENDING','APPROVED','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  deduction_status ENUM('PENDING','FREE','DEDUCTIBLE','UNAUTHORIZED') NOT NULL DEFAULT 'PENDING',
  attendance_id BIGINT UNSIGNED NULL,
  has_attendance_conflict BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_leave_day_request FOREIGN KEY(leave_request_id) REFERENCES leave_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_leave_day_employee FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
  CONSTRAINT fk_leave_day_attendance FOREIGN KEY(attendance_id) REFERENCES attendance_records(id) ON DELETE SET NULL,
  UNIQUE KEY uq_leave_request_date(leave_request_id,leave_date),
  INDEX idx_leave_day_employee_date(employee_id,leave_date),
  INDEX idx_leave_day_deduction(employee_id,deduction_status,leave_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE attendance_records MODIFY clock_in_at TIMESTAMP NULL;
ALTER TABLE attendance_records MODIFY status ENUM('WORKING','ON_BREAK','CLOCKED_OUT','ABSENT','LEAVE') NOT NULL DEFAULT 'WORKING';

INSERT INTO permissions(name,description) VALUES
('leave.create','Submit a leave request'),('leave.view_own','View own leave requests'),
('leave.view_all','View all employee leave requests'),('leave.approve','Approve leave requests'),
('leave.reject','Reject leave requests'),('leave.cancel_own','Cancel own pending leave requests'),
('leave.reports','View leave and payroll-preparation reports')
ON DUPLICATE KEY UPDATE description=VALUES(description);

INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN ('leave.create','leave.view_own','leave.cancel_own')
WHERE r.name='Employee';

INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN ('leave.view_all','leave.approve','leave.reject','leave.reports')
WHERE r.name='CEO';

DELETE rp FROM role_permissions rp JOIN roles r ON r.id=rp.role_id JOIN permissions p ON p.id=rp.permission_id
WHERE r.name='CEO' AND p.name IN ('leave.create','leave.view_own','leave.cancel_own');
