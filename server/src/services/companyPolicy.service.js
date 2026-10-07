import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";

const select = `SELECT cp.id,cp.title,cp.content,cp.created_by createdBy,
  cp.created_at createdAt,cp.updated_at updatedAt,
  COALESCE(CONCAT(e.first_name,' ',e.last_name),u.email) createdByName
  FROM company_policies cp
  LEFT JOIN users u ON u.id=cp.created_by
  LEFT JOIN employees e ON e.id=u.employee_id`;

export async function listPolicies() {
  const [rows] = await pool.execute(
    `${select} ORDER BY cp.updated_at DESC,cp.id DESC`,
  );
  return rows;
}

export async function getPolicy(id) {
  const [[policy]] = await pool.execute(`${select} WHERE cp.id=?`, [id]);
  if (!policy) throw new ApiError(404, "Company policy not found");
  return policy;
}

export async function createPolicy(data, user) {
  const [result] = await pool.execute(
    "INSERT INTO company_policies(title,content,created_by) VALUES(?,?,?)",
    [data.title, data.content, user.id],
  );
  return getPolicy(result.insertId);
}

export async function updatePolicy(id, data) {
  const [result] = await pool.execute(
    "UPDATE company_policies SET title=?,content=? WHERE id=?",
    [data.title, data.content, id],
  );
  if (!result.affectedRows) throw new ApiError(404, "Company policy not found");
  return getPolicy(id);
}

export async function deletePolicy(id) {
  const [result] = await pool.execute(
    "DELETE FROM company_policies WHERE id=?",
    [id],
  );
  if (!result.affectedRows) throw new ApiError(404, "Company policy not found");
  return { id: Number(id) };
}
