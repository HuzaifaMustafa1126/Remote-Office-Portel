import bcrypt from "bcrypt";
import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { logAudit } from "./audit.service.js";

const select = `
  SELECT
    e.id,
    e.employee_code AS employeeCode,
    e.first_name AS firstName,
    e.last_name AS lastName,
    e.email,
    e.phone,
    e.job_title AS jobTitle,
    e.department,
    e.joining_date AS joiningDate,
    e.status,
    e.created_at AS createdAt,
    e.updated_at AS updatedAt
  FROM employees e
`;

export async function listEmployees({ search = "" }, actor) {
  const normalizedSearch = typeof search === "string" ? search.trim() : "";

  const employeeSelect = `
    SELECT
      e.id,
      e.employee_code AS employeeCode,
      e.first_name AS firstName,
      e.last_name AS lastName,
      e.email,
      e.phone,
      e.job_title AS jobTitle,
      e.department,
      e.joining_date AS joiningDate,
      e.status,
      e.created_at AS createdAt,
      e.updated_at AS updatedAt,

      (
        SELECT esa.shift_id
        FROM employee_shift_assignments esa
        WHERE esa.employee_id = e.id
          AND esa.status = 'ACTIVE'
          AND esa.effective_from <= CURRENT_DATE
          AND (
            esa.effective_to IS NULL
            OR esa.effective_to >= CURRENT_DATE
          )
        ORDER BY esa.effective_from DESC
        LIMIT 1
      ) AS shiftId,

      (
        SELECT ws.name
        FROM employee_shift_assignments esa
        JOIN work_shifts ws
          ON ws.id = esa.shift_id
        WHERE esa.employee_id = e.id
          AND esa.status = 'ACTIVE'
          AND esa.effective_from <= CURRENT_DATE
          AND (
            esa.effective_to IS NULL
            OR esa.effective_to >= CURRENT_DATE
          )
        ORDER BY esa.effective_from DESC
        LIMIT 1
      ) AS shiftName,

      (
        SELECT CONCAT(
          TIME_FORMAT(ws.start_time, '%H:%i'),
          ' → ',
          TIME_FORMAT(ws.end_time, '%H:%i')
        )
        FROM employee_shift_assignments esa
        JOIN work_shifts ws
          ON ws.id = esa.shift_id
        WHERE esa.employee_id = e.id
          AND esa.status = 'ACTIVE'
          AND esa.effective_from <= CURRENT_DATE
          AND (
            esa.effective_to IS NULL
            OR esa.effective_to >= CURRENT_DATE
          )
        ORDER BY esa.effective_from DESC
        LIMIT 1
      ) AS schedule,

      (
        SELECT esp.monthly_salary
        FROM employee_salary_profiles esp
        WHERE esp.employee_id = e.id
          AND esp.effective_from <= CURRENT_DATE
          AND (
            esp.effective_until IS NULL
            OR esp.effective_until >= CURRENT_DATE
          )
        ORDER BY esp.effective_from DESC
        LIMIT 1
      ) AS monthlySalary

    FROM employees e
  `;

  let rows;

  /*
   * IMPORTANT:
   *
   * Do not use:
   *
   * (? = '' OR ...)
   *
   * Hostinger/MySQL can assign a different collation to prepared
   * statement parameters than the database columns/literals.
   *
   * Instead we decide here in JavaScript whether search is needed.
   */

  if (normalizedSearch) {
    const q = `%${normalizedSearch}%`;

    [rows] = await pool.execute(
      `
        ${employeeSelect}
        WHERE
          e.first_name LIKE ?
          OR e.last_name LIKE ?
          OR e.email LIKE ?
          OR e.employee_code LIKE ?
        ORDER BY e.created_at DESC
      `,
      [q, q, q, q],
    );
  } else {
    [rows] = await pool.execute(
      `
        ${employeeSelect}
        ORDER BY e.created_at DESC
      `,
    );
  }

  const [allowed] = await pool.execute(
    `
      SELECT 1
      FROM user_roles ur
      JOIN role_permissions rp
        ON rp.role_id = ur.role_id
      JOIN permissions p
        ON p.id = rp.permission_id
      WHERE ur.user_id = ?
        AND p.name = 'salary.view_all'
      LIMIT 1
    `,
    [actor.id],
  );

  return rows.map((row) => ({
    ...row,

    monthlySalary: allowed.length > 0 ? row.monthlySalary : undefined,

    configurationReady: Boolean(row.shiftId && row.monthlySalary),

    missingConfiguration: [
      !row.shiftId && "Shift",
      !row.monthlySalary && "Salary",
    ].filter(Boolean),
  }));
}

export async function getEmployee(id) {
  const [rows] = await pool.execute(`${select} WHERE e.id = ?`, [id]);

  if (!rows[0]) {
    throw new ApiError(404, "Employee not found");
  }

  const [roles] = await pool.execute(
    `
      SELECT
        r.id,
        r.name
      FROM roles r
      JOIN user_roles ur
        ON ur.role_id = r.id
      JOIN users u
        ON u.id = ur.user_id
      WHERE u.employee_id = ?
    `,
    [id],
  );

  return {
    ...rows[0],
    roles: roles.map((r) => r.name),
    roleId: roles[0]?.id || null,
  };
}

export async function createEmployee(data, actor) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [employeeResult] = await conn.execute(
      `
        INSERT INTO employees (
          employee_code,
          first_name,
          last_name,
          email,
          phone,
          job_title,
          department,
          joining_date,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.employeeCode,
        data.firstName,
        data.lastName,
        data.email,
        data.phone || null,
        data.jobTitle,
        data.department,
        data.joiningDate,
        data.status || "ACTIVE",
      ],
    );

    const hash = await bcrypt.hash(data.password, 12);

    const [userResult] = await conn.execute(
      `
        INSERT INTO users (
          employee_id,
          email,
          password_hash,
          status
        )
        VALUES (?, ?, ?, ?)
      `,
      [employeeResult.insertId, data.email, hash, data.status || "ACTIVE"],
    );

    if (data.roleId) {
      await conn.execute(
        `
          INSERT INTO user_roles (
            user_id,
            role_id
          )
          VALUES (?, ?)
        `,
        [userResult.insertId, data.roleId],
      );
    }

    await conn.commit();

    await logAudit({
      userId: actor.id,
      employeeId: actor.employee_id,
      action: "EMPLOYEE_CREATED",
      entityType: "EMPLOYEE",
      entityId: employeeResult.insertId,
      description: `Employee ${data.firstName} ${data.lastName} was created.`,
    });

    return getEmployee(employeeResult.insertId);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function updateEmployee(id, data, actor) {
  const existing = await getEmployee(id);
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    await conn.execute(
      `
        UPDATE employees
        SET
          employee_code = ?,
          first_name = ?,
          last_name = ?,
          email = ?,
          phone = ?,
          job_title = ?,
          department = ?,
          joining_date = ?,
          status = ?
        WHERE id = ?
      `,
      [
        data.employeeCode,
        data.firstName,
        data.lastName,
        data.email,
        data.phone || null,
        data.jobTitle,
        data.department,
        data.joiningDate,
        data.status || existing.status,
        id,
      ],
    );

    await conn.execute(
      `
        UPDATE users
        SET
          email = ?,
          status = ?
        WHERE employee_id = ?
      `,
      [data.email, data.status || existing.status, id],
    );

    if (data.roleId) {
      const [[user]] = await conn.execute(
        `
          SELECT id
          FROM users
          WHERE employee_id = ?
          LIMIT 1
        `,
        [id],
      );

      if (!user) {
        throw new ApiError(404, "User account not found");
      }

      await conn.execute(
        `
          DELETE FROM user_roles
          WHERE user_id = ?
        `,
        [user.id],
      );

      await conn.execute(
        `
          INSERT INTO user_roles (
            user_id,
            role_id
          )
          VALUES (?, ?)
        `,
        [user.id, data.roleId],
      );
    }

    await conn.commit();

    await logAudit({
      userId: actor.id,
      employeeId: actor.employee_id,
      action: "EMPLOYEE_UPDATED",
      entityType: "EMPLOYEE",
      entityId: id,
      description: `${existing.firstName} ${existing.lastName}'s employee profile was updated.`,
    });

    return getEmployee(id);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function setEmployeeStatus(id, status, actor) {
  const employee = await getEmployee(id);

  await pool.execute(
    `
      UPDATE employees e
      JOIN users u
        ON u.employee_id = e.id
      SET
        e.status = ?,
        u.status = ?
      WHERE e.id = ?
    `,
    [status, status, id],
  );

  await logAudit({
    userId: actor.id,
    employeeId: actor.employee_id,
    action: status === "INACTIVE" ? "EMPLOYEE_DEACTIVATED" : "EMPLOYEE_UPDATED",
    entityType: "EMPLOYEE",
    entityId: id,
    description: `Employee ${employee.firstName} ${employee.lastName} was ${
      status === "ACTIVE" ? "activated" : "deactivated"
    }.`,
  });

  return getEmployee(id);
}

export async function assignRole(id, roleId, actor) {
  const employee = await getEmployee(id);

  const [[user]] = await pool.execute(
    `
      SELECT id
      FROM users
      WHERE employee_id = ?
      LIMIT 1
    `,
    [id],
  );

  if (!user) {
    throw new ApiError(404, "User account not found");
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    await conn.execute(
      `
        DELETE FROM user_roles
        WHERE user_id = ?
      `,
      [user.id],
    );

    await conn.execute(
      `
        INSERT INTO user_roles (
          user_id,
          role_id
        )
        VALUES (?, ?)
      `,
      [user.id, roleId],
    );

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  await logAudit({
    userId: actor.id,
    employeeId: actor.employee_id,
    action: "ROLE_ASSIGNED",
    entityType: "EMPLOYEE",
    entityId: id,
    description: `A role was assigned to ${employee.firstName} ${employee.lastName}.`,
  });

  return getEmployee(id);
}
