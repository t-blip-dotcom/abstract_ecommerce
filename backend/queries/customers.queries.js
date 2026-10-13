

const pool = require('../db/pool');

async function listCustomers() {
  const { rows } = await pool.query(
    'SELECT customer_id, name, primary_phone, alternative_phone, address, email_address FROM customers ORDER BY name ASC'
  );
  return rows;
}

async function updateCustomer(customerId, { name, primary_phone, alternative_phone, address, email_address }) {
  const { rows } = await pool.query(
    `UPDATE customers
     SET name = $1, primary_phone = $2, alternative_phone = $3, address = $4, email_address = $5
     WHERE customer_id = $6
     RETURNING customer_id, name, primary_phone, alternative_phone, address, email_address`,
    [name, primary_phone, alternative_phone || null, address || null, email_address || null, customerId]
  );
  return rows[0] || null;
}

module.exports = { listCustomers, updateCustomer };
