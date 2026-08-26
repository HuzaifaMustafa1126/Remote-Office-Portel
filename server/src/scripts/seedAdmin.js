import bcrypt from 'bcrypt';
import pool from '../config/database.js';

const ADMIN = Object.freeze({
  employeeCode: 'EMP-0001',
  firstName: 'System',
  lastName: 'Admin',
  email: 'admin@remoteoffice.com',
  password: 'Admin@123',
  jobTitle: 'CEO',
  department: 'Management',
  status: 'ACTIVE',
  role: 'CEO',
});

const BCRYPT_ROUNDS = 12;
const AUDIT_ACTION = 'INITIAL_ADMIN_CREATED';
const AUDIT_DESCRIPTION = 'Initial CEO administrator account created.';

async function seedAdmin() {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.ping();
    console.log('Database connected.');

    await connection.beginTransaction();

    const [employeeMatches] = await connection.execute(
      `SELECT id, employee_code, email
       FROM employees
       WHERE employee_code = ? OR email = ?
       FOR UPDATE`,
      [ADMIN.employeeCode, ADMIN.email],
    );

    if (employeeMatches.length > 1) {
      throw new Error(
        `Cannot seed the administrator: ${ADMIN.employeeCode} and ${ADMIN.email} belong to different employees.`,
      );
    }

    let employeeId;
    if (employeeMatches.length === 1) {
      employeeId = employeeMatches[0].id;
      await connection.execute(
        `UPDATE employees
         SET employee_code = ?, first_name = ?, last_name = ?, email = ?,
             job_title = ?, department = ?, status = ?
         WHERE id = ?`,
        [
          ADMIN.employeeCode,
          ADMIN.firstName,
          ADMIN.lastName,
          ADMIN.email,
          ADMIN.jobTitle,
          ADMIN.department,
          ADMIN.status,
          employeeId,
        ],
      );
    } else {
      const [employeeResult] = await connection.execute(
        `INSERT INTO employees
           (employee_code, first_name, last_name, email, phone, job_title,
            department, joining_date, status)
         VALUES (?, ?, ?, ?, NULL, ?, ?, CURRENT_DATE, ?)`,
        [
          ADMIN.employeeCode,
          ADMIN.firstName,
          ADMIN.lastName,
          ADMIN.email,
          ADMIN.jobTitle,
          ADMIN.department,
          ADMIN.status,
        ],
      );
      employeeId = employeeResult.insertId;
    }
    console.log('CEO employee verified.');

    const [userMatches] = await connection.execute(
      `SELECT id, employee_id, email, password_hash
       FROM users
       WHERE employee_id = ? OR email = ?
       FOR UPDATE`,
      [employeeId, ADMIN.email],
    );

    if (userMatches.length > 1) {
      throw new Error(
        `Cannot seed the administrator: employee #${employeeId} and ${ADMIN.email} belong to different users.`,
      );
    }

    let userId;
    if (userMatches.length === 1) {
      const user = userMatches[0];
      userId = user.id;
      const passwordMatches = await bcrypt.compare(ADMIN.password, user.password_hash);
      const passwordHash = passwordMatches
        ? user.password_hash
        : await bcrypt.hash(ADMIN.password, BCRYPT_ROUNDS);

      await connection.execute(
        `UPDATE users
         SET employee_id = ?, email = ?, password_hash = ?, status = ?
         WHERE id = ?`,
        [employeeId, ADMIN.email, passwordHash, ADMIN.status, userId],
      );
    } else {
      const passwordHash = await bcrypt.hash(ADMIN.password, BCRYPT_ROUNDS);
      const [userResult] = await connection.execute(
        `INSERT INTO users (employee_id, email, password_hash, status)
         VALUES (?, ?, ?, ?)`,
        [employeeId, ADMIN.email, passwordHash, ADMIN.status],
      );
      userId = userResult.insertId;
    }
    console.log('Admin user verified.');

    const [roles] = await connection.execute(
      'SELECT id FROM roles WHERE name = ? LIMIT 1 FOR UPDATE',
      [ADMIN.role],
    );
    if (!roles[0]) {
      throw new Error('CEO role not found. Run database/seed.sql before seeding the admin.');
    }
    const roleId = roles[0].id;

    await connection.execute(
      'INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)',
      [userId, roleId],
    );
    console.log('CEO role assigned.');

    await connection.execute(
      `INSERT IGNORE INTO role_permissions (role_id, permission_id)
       SELECT ?, id FROM permissions WHERE name NOT IN ('attendance.clock', 'attendance.view_own', 'leave.create', 'leave.view_own', 'leave.cancel_own')`,
      [roleId],
    );
    await connection.execute(
      `DELETE rp FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = ? AND p.name IN ('attendance.clock', 'attendance.view_own', 'leave.create', 'leave.view_own', 'leave.cancel_own')`,
      [roleId],
    );
    await connection.execute('UPDATE employees SET track_attendance = FALSE WHERE id = ?', [employeeId]);
    console.log('CEO permissions assigned.');

    await connection.execute(
      `INSERT INTO audit_logs
         (user_id, employee_id, action, entity_type, entity_id, description)
       SELECT ?, ?, ?, 'USER', ?, ?
       WHERE NOT EXISTS (
         SELECT 1 FROM audit_logs
         WHERE action = ? AND entity_type = 'USER' AND entity_id = ?
       )`,
      [
        userId,
        employeeId,
        AUDIT_ACTION,
        userId,
        AUDIT_DESCRIPTION,
        AUDIT_ACTION,
        userId,
      ],
    );

    await connection.commit();
    console.log('Admin seed completed successfully.');
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {
        // Preserve the original error when rollback itself is unavailable.
      }
    }
    console.error(`Admin seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    connection?.release();
    await pool.end();
  }
}

await seedAdmin();
