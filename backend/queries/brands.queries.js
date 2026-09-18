/**
 * queries/brands.queries.js
 */

const pool = require('../db/pool');

async function listBrands() {
  const { rows } = await pool.query('SELECT * FROM BRAND ORDER BY brand_name ASC');
  return rows;
}

async function createBrand({ brand_name, description, logo_url }) {
  const { rows } = await pool.query(
    'INSERT INTO BRAND (brand_name, description, logo_url) VALUES ($1, $2, $3) RETURNING *',
    [brand_name, description || null, logo_url || null]
  );
  return rows[0];
}

async function updateBrand(brandId, { brand_name, description, logo_url }) {
  const { rows } = await pool.query(
    `UPDATE BRAND
     SET brand_name = $1, description = $2, logo_url = COALESCE($3, logo_url)
     WHERE brand_id = $4
     RETURNING *`,
    [brand_name, description || null, logo_url || null, brandId]
  );
  return rows[0] || null;
}

async function deleteBrand(brandId) {
  await pool.query('DELETE FROM BRAND WHERE brand_id = $1', [brandId]);
}

module.exports = { listBrands, createBrand, updateBrand, deleteBrand };
