const pool = require('../db/pool');

async function listSuppliers() {
  const { rows } = await pool.query('SELECT * FROM supplier WHERE is_deleted = FALSE ORDER BY supplier_name ASC');
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
  const { rows } = await pool.query(
    `SELECT COUNT(*) as count FROM products WHERE supplier_id = $1 AND is_deleted = FALSE`, 
    [supplierId]
  );
  
  if (parseInt(rows[0].count, 10) > 0) {
    throw new Error('Cannot delete this supplier because active products are linked to it. Reassign them first.');
  }
  await pool.query('UPDATE supplier SET is_deleted = TRUE WHERE supplier_id = $1', [supplierId]);
}

module.exports = { listSuppliers, createSupplier, updateSupplier, deleteSupplier };