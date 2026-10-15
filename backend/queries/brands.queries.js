const pool = require('../db/pool');

async function listBrands() {
  const { rows } = await pool.query(
    'SELECT * FROM BRAND WHERE is_deleted = FALSE ORDER BY brand_name ASC'
  );
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
  const { rows } = await pool.query(
    `SELECT COUNT(*) as count 
     FROM product 
     WHERE brand_id = $1 AND is_deleted = FALSE`, 
    [brandId]
  );
  
  if (parseInt(rows[0].count, 10) > 0) {
    throw new Error('Cannot delete this brand because it is still attached to active products. Reassign or delete those products first.');
  }
  await pool.query(
    'UPDATE BRAND SET is_deleted = TRUE WHERE brand_id = $1', 
    [brandId]
  );
}

module.exports = { listBrands, createBrand, updateBrand, deleteBrand };
