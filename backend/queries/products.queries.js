const pool = require('../db/pool');

const LOW_STOCK_THRESHOLD = 15;

const BASE_SELECT = `
  SELECT
    p.product_id, p.name, p.price, p.stock_quantity, p.photo_url,
    c.category_id, c.category_name,
    b.brand_id, b.brand_name,
    s.supplier_id, s.supplier_name,
    ps.product_status_name AS status,
    COALESCE(pop.times_ordered, 0) AS popularity,
    CASE
      WHEN p.stock_quantity = 0 THEN 'out_of_stock'
      WHEN p.stock_quantity < ${LOW_STOCK_THRESHOLD} THEN 'low_stock'
      ELSE 'in_stock'
    END AS stock_level
  FROM products p
  JOIN category c ON c.category_id = p.category_id
  JOIN brand b ON b.brand_id = p.brand_id
  JOIN supplier s ON s.supplier_id = p.supplier_id
  JOIN product_status ps ON ps.product_status_id = p.product_status_id
  LEFT JOIN (
    SELECT product_id, COUNT(*) AS times_ordered
    FROM order_items
    GROUP BY product_id
  ) pop ON pop.product_id = p.product_id
`;

function buildFilters({ category_id, brand_id, status, search, includeInactive }) {
  const clauses = ["p.is_deleted = FALSE"];
  const params = [];


  if (!includeInactive) {
    clauses.push("ps.product_status_name <> 'inactive'");
  }

  if (category_id) {
    params.push(category_id);
    clauses.push(`c.category_id = $${params.length}`);
  }
  if (brand_id) {
    params.push(brand_id);
    clauses.push(`b.brand_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    clauses.push(`ps.product_status_name = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    clauses.push(`p.name ILIKE $${params.length}`);
  }

  return {
    whereSql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params
  };
}

async function listProducts({ category_id, brand_id, status, search, page = 1, perPage = 12, sort = 'popularity', includeInactive = false }) {
  const { whereSql, params } = buildFilters({ category_id, brand_id, status, search, includeInactive });

  const orderSql = sort === 'price_asc' ? 'p.price ASC'
    : sort === 'price_desc' ? 'p.price DESC'
    : sort === 'newest' ? 'p.product_id DESC'
    : 'popularity DESC, p.name ASC'; // default: most-ordered first

  const offset = (page - 1) * perPage;
  const listParams = [...params, perPage, offset];

  const { rows } = await pool.query(
    `${BASE_SELECT} ${whereSql} ORDER BY ${orderSql} LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams
  );

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) FROM products p
     JOIN category c ON c.category_id = p.category_id
     JOIN brand b ON b.brand_id = p.brand_id
     JOIN product_status ps ON ps.product_status_id = p.product_status_id
     ${whereSql}`,
    params
  );

  return { products: rows, total: Number(countRows[0].count) };
}

async function getProductById(productId) {
  const { rows } = await pool.query(`${BASE_SELECT} WHERE p.product_id = $1`, [productId]);
  return rows[0] || null;
}

async function listLowStock() {
  const { rows } = await pool.query(
    `${BASE_SELECT} WHERE p.stock_quantity > 0 AND p.stock_quantity < $1 ORDER BY p.stock_quantity ASC`,
    [LOW_STOCK_THRESHOLD]
  );
  return rows;
}

async function getProductStatusId(statusName) {
  const { rows } = await pool.query(
    'SELECT product_status_id FROM product_status WHERE product_status_name = $1',
    [statusName]
  );
  return rows[0]?.product_status_id || null;
}

async function createProduct({ name, category_id, brand_id, supplier_id, stock_quantity, price, photo_url, status }) {
  const statusId = await getProductStatusId(status || 'active');
  const { rows } = await pool.query(
    `INSERT INTO products (name, category_id, supplier_id, brand_id, stock_quantity, product_status_id, price, photo_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING product_id`,
    [name, category_id, supplier_id, brand_id, stock_quantity, statusId, price, photo_url || null]
  );
  return getProductById(rows[0].product_id);
}

async function updateProduct(productId, { name, category_id, brand_id, supplier_id, stock_quantity, price, photo_url, status }) {
  const statusId = await getProductStatusId(status);
  await pool.query(
    `UPDATE products
     SET name = $1, category_id = $2, supplier_id = $3, brand_id = $4,
         stock_quantity = $5, price = $6, photo_url = COALESCE($7, photo_url),
         product_status_id = COALESCE($8, product_status_id)
     WHERE product_id = $9`,
    [name, category_id, supplier_id, brand_id, stock_quantity, price, photo_url || null, statusId, productId]
  );
  return getProductById(productId);
}

async function deleteProduct(productId) {
  const inactiveStatusId = await getProductStatusId('inactive');
  await pool.query(
    'UPDATE products SET is_deleted = TRUE, product_status_id = $1 WHERE product_id = $2', 
    [inactiveStatusId, productId]
  );
}

module.exports = {
  LOW_STOCK_THRESHOLD,
  listProducts,
  getProductById,
  listLowStock,
  createProduct,
  updateProduct,
  deleteProduct
};