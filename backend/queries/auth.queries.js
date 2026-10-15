const pool = require('../db/pool');


async function findCustomerByEmail(email) {
  const { rows } = await pool.query(
    'SELECT * FROM customers WHERE email_address = $1',
    [email]
  );
  return rows[0] || null;
}

async function createCustomer({ name, primary_phone, alternative_phone, address, email_address, password_hash }) {
  const { rows } = await pool.query(
    `INSERT INTO customers (name, primary_phone, alternative_phone, address, email_address, password_hash)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING customer_id, name, primary_phone, alternative_phone, address, email_address`,
    [name, primary_phone, alternative_phone || null, address || null, email_address, password_hash]
  );
  return rows[0];
}


async function findStaffByUsername(username) {
  const { rows } = await pool.query(
    `SELECT s.*, r.role_name
     FROM STAFF s
     JOIN ROLE r ON r.role_id = s.role_id
     WHERE s.username = $1`,
    [username]
  );
  return rows[0] || null;
}

async function getRoleIdByName(roleName) {
  const { rows } = await pool.query('SELECT role_id FROM ROLE WHERE role_name = $1', [roleName]);
  return rows[0]?.role_id || null;
}

async function createStaffRequest({ name, username, password_hash }) {
  const staffRoleId = await getRoleIdByName('staff');
  
 
  if (!staffRoleId) {
    throw new Error("System configuration error: 'staff' role not found in database.");
  }

  const { rows } = await pool.query(
    `INSERT INTO STAFF (name, username, password_hash, role_id, status)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING staff_id, name, username, status`,
    [name, username, password_hash, staffRoleId]
  );
  return rows[0];
}

async function updateStaffLastLogin(staffId) {
  await pool.query('UPDATE STAFF SET last_login = CURRENT_TIMESTAMP WHERE staff_id = $1', [staffId]);
}

module.exports = {
  findCustomerByEmail,
  createCustomer,
  findStaffByUsername,
  getRoleIdByName,
  createStaffRequest,
  updateStaffLastLogin
};
