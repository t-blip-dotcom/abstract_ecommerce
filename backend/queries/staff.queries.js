/**
 * queries/staff.queries.js
 */

const pool = require('../db/pool');

async function listStaff() {
  const { rows } = await pool.query(
    `SELECT s.staff_id, s.name, s.username, s.status, s.last_login, s.created_at, r.role_name
     FROM STAFF s
     JOIN ROLE r ON r.role_id = s.role_id
     ORDER BY (s.status = 'pending') DESC, s.name ASC`
  );
  return rows;
}

async function getRoleIdByName(roleName) {
  const { rows } = await pool.query('SELECT role_id FROM ROLE WHERE role_name = $1', [roleName]);
  return rows[0]?.role_id || null;
}

async function approveStaff(staffId) {
  const { rows } = await pool.query(
    "UPDATE STAFF SET status = 'active' WHERE staff_id = $1 RETURNING staff_id, name, status",
    [staffId]
  );
  return rows[0] || null;
}

async function updateStaff(staffId, { name, role, status }) {
  const roleId = await getRoleIdByName(role);
  const { rows } = await pool.query(
    `UPDATE STAFF SET name = $1, role_id = COALESCE($2, role_id), status = $3
     WHERE staff_id = $4
     RETURNING staff_id, name, username, status`,
    [name, roleId, status, staffId]
  );
  return rows[0] || null;
}

async function deleteStaff(staffId) {
  await pool.query('DELETE FROM STAFF WHERE staff_id = $1', [staffId]);
}

module.exports = { listStaff, approveStaff, updateStaff, deleteStaff };
