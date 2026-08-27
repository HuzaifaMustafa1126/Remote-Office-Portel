import bcrypt from "bcrypt";
import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { logAudit } from "./audit.service.js";
const select = `SELECT e.id,e.employee_code AS employeeCode,e.first_name AS firstName,e.last_name AS lastName,e.email,e.phone,e.job_title AS jobTitle,e.department,e.joining_date AS joiningDate,e.status,e.created_at AS createdAt,e.updated_at AS updatedAt FROM employees e`;
export async function listEmployees({ search = "" }) {
  const q = `%${search}%`;
  const [rows] = await pool.execute(
    `${select} WHERE (?='' OR e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ? OR e.employee_code LIKE ?) ORDER BY e.created_at DESC`,
    [search, q, q, q, q],
  );
  return rows;
}
export async function getEmployee(id) {
  const [rows] = await pool.execute(`${select} WHERE e.id=?`, [id]);
  if (!rows[0]) throw new ApiError(404, "Employee not found");
  const [roles] = await pool.execute(
    "SELECT r.id,r.name FROM roles r JOIN user_roles ur ON ur.role_id=r.id JOIN users u ON u.id=ur.user_id WHERE u.employee_id=?",
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
    const [er] = await conn.execute(
      "INSERT INTO employees(employee_code,first_name,last_name,email,phone,job_title,department,joining_date,status) VALUES(?,?,?,?,?,?,?,?,?)",
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
    const [ur] = await conn.execute(
      "INSERT INTO users(employee_id,email,password_hash,status) VALUES(?,?,?,?)",
      [er.insertId, data.email, hash, data.status || "ACTIVE"],
    );
    if (data.roleId)
      await conn.execute(
        "INSERT INTO user_roles(user_id,role_id) VALUES(?,?)",
        [ur.insertId, data.roleId],
      );
    await conn.commit();
    await logAudit({
      userId: actor.id,
      employeeId: actor.employee_id,
      action: "EMPLOYEE_CREATED",
      entityType: "EMPLOYEE",
      entityId: er.insertId,
      description: `Employee ${data.firstName} ${data.lastName} was created.`,
    });
    return getEmployee(er.insertId);
  } catch (e) {
    await conn.rollback();
    throw e;
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
      "UPDATE employees SET employee_code=?,first_name=?,last_name=?,email=?,phone=?,job_title=?,department=?,joining_date=?,status=? WHERE id=?",
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
      "UPDATE users SET email=?,status=? WHERE employee_id=?",
      [data.email, data.status || existing.status, id],
    );
    if (data.roleId) {
      const [[user]] = await conn.execute(
        "SELECT id FROM users WHERE employee_id=?",
        [id],
      );
      await conn.execute("DELETE FROM user_roles WHERE user_id=?", [user.id]);
      await conn.execute(
        "INSERT INTO user_roles(user_id,role_id) VALUES(?,?)",
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
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
export async function setEmployeeStatus(id, status, actor) {
  const e = await getEmployee(id);
  await pool.execute(
    "UPDATE employees e JOIN users u ON u.employee_id=e.id SET e.status=?,u.status=? WHERE e.id=?",
    [status, status, id],
  );
  await logAudit({
    userId: actor.id,
    employeeId: actor.employee_id,
    action: status === "INACTIVE" ? "EMPLOYEE_DEACTIVATED" : "EMPLOYEE_UPDATED",
    entityType: "EMPLOYEE",
    entityId: id,
    description: `Employee ${e.firstName} ${e.lastName} was ${status === "ACTIVE" ? "activated" : "deactivated"}.`,
  });
  return getEmployee(id);
}
export async function assignRole(id, roleId, actor) {
  const e = await getEmployee(id);
  const [[user]] = await pool.execute(
    "SELECT id FROM users WHERE employee_id=?",
    [id],
  );
  if (!user) throw new ApiError(404, "User account not found");
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute("DELETE FROM user_roles WHERE user_id=?", [user.id]);
    await conn.execute("INSERT INTO user_roles(user_id,role_id) VALUES(?,?)", [
      user.id,
      roleId,
    ]);
    await conn.commit();
  } catch (x) {
    await conn.rollback();
    throw x;
  } finally {
    conn.release();
  }
  await logAudit({
    userId: actor.id,
    employeeId: actor.employee_id,
    action: "ROLE_ASSIGNED",
    entityType: "EMPLOYEE",
    entityId: id,
    description: `A role was assigned to ${e.firstName} ${e.lastName}.`,
  });
  return getEmployee(id);
}
