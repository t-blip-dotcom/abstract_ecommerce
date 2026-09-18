/**
 * queries/suppliers.queries.js
 */

const pool = require('../db/pool');

async function listSuppliers() {
  const { rows } = await pool.query('SELECT * FROM supplier ORDER BY supplier_name ASC');
  return rows;
}

async function createSupplier({ supplier_name, phone }) {
  const { rows } = await pool.query(
    'INSERT INTO supplier (supplier_name, phone) VALUES ($1, $2) RETURNING *',
    [supplier_name, phone || null]
  );
  return rows[0];
}

async function updateSupplier(supplierId, { supplier_name, phone }) {
  const { rows } = await pool.query(
    'UPDATE supplier SET supplier_name = $1, phone = $2 WHERE supplier_id = $3 RETURNING *',
    [supplier_name, phone || null, supplierId]
  );
  return rows[0] || null;
}

async function deleteSupplier(supplierId) {
  await pool.query('DELETE FROM supplier WHERE supplier_id = $1', [supplierId]);
}

module.exports = { listSuppliers, createSupplier, updateSupplier, deleteSupplier };
