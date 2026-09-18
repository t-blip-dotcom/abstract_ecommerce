/**
 * queries/categories.queries.js
 */

const pool = require('../db/pool');

async function listCategories() {
  const { rows } = await pool.query('SELECT * FROM category ORDER BY category_name ASC');
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
  await pool.query('DELETE FROM category WHERE category_id = $1', [categoryId]);
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
