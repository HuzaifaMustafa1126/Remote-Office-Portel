-- Company working calendar. Sunday is the default weekly off in application policy.
CREATE TABLE IF NOT EXISTS company_calendar_days (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 calendar_date DATE NOT NULL UNIQUE,
 day_type ENUM('WORKING_DAY','WEEKLY_OFF','PUBLIC_HOLIDAY','COMPANY_HOLIDAY','SPECIAL_OFF_DAY') NOT NULL,
 title VARCHAR(150) NOT NULL,
 description VARCHAR(500) NULL,
 created_by BIGINT UNSIGNED NULL,
 status ENUM('ACTIVE','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_calendar_creator FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL,
 INDEX idx_calendar_status_date(status,calendar_date),INDEX idx_calendar_type_date(day_type,calendar_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE attendance_records MODIFY status ENUM('WORKING','ON_BREAK','CLOCKED_OUT','ABSENT','LEAVE','OFF_DAY','WORKED_HOLIDAY') NOT NULL DEFAULT 'WORKING';
ALTER TABLE attendance_records MODIFY day_status ENUM('PRESENT','ABSENT','HALF_DAY','LEAVE','OFF_DAY','WORKED_HOLIDAY') NOT NULL DEFAULT 'PRESENT';
INSERT INTO permissions(name,description) VALUES('calendar.view','View the company working calendar'),('calendar.manage','Create, edit, and cancel company holidays') ON DUPLICATE KEY UPDATE description=VALUES(description);
INSERT IGNORE INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name='calendar.view' WHERE r.name='Employee';
INSERT IGNORE INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN ('calendar.view','calendar.manage') WHERE r.name='CEO';
