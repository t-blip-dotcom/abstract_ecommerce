const pool = require('../db/pool');

async function listCategories() {
  const { rows } = await pool.query(
    'SELECT * FROM category WHERE is_deleted = FALSE ORDER BY category_name ASC'
  );
  return rows;
}

async function createCategory({ category_name, description }) {
  const { rows } = await pool.query(
    'INSERT INTO category (category_name, description) VALUES ($1, $2) RETURNING *',
    [category_name, description || null]
  );
  return rows[0];
}

async function updateCategory(categoryId, { category_name, description }) {
  const { rows } = await pool.query(
    'UPDATE category SET category_name = $1, description = $2 WHERE category_id = $3 RETURNING *',
    [category_name, description || null, categoryId]
  );
  return rows[0] || null;
}

async function deleteCategory(categoryId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) as count 
     FROM product 
     WHERE category_id = $1 AND is_deleted = FALSE`, 
    [categoryId]
  );
  
  if (parseInt(rows[0].count, 10) > 0) {
    throw new Error('Cannot delete this category because active products are using it. Reassign those products first.');
  }
  await pool.query('UPDATE category SET is_deleted = TRUE WHERE category_id = $1', [categoryId]);
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };