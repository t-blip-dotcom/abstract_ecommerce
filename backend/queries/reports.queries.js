/**
 * queries/reports.queries.js
 */

const pool = require('../db/pool');

async function getSalesStats() {
  const { rows } = await pool.query(`
    SELECT
      COALESCE(SUM(amount_paid) FILTER (WHERE order_date = CURRENT_DATE), 0) AS sales_today,
      COALESCE(SUM(amount_paid) FILTER (WHERE order_date >= CURRENT_DATE - INTERVAL '7 days'), 0) AS sales_week,
      COUNT(*) FILTER (WHERE order_date = CURRENT_DATE) AS orders_today
    FROM orders
  `);

  const { rows: productRows } = await pool.query(`
    SELECT COUNT(*) AS active_products
    FROM products p
    JOIN product_status ps ON ps.product_status_id = p.product_status_id
    WHERE ps.product_status_name = 'active'
  `);

  return {
    sales_today: Number(rows[0].sales_today),
    sales_week: Number(rows[0].sales_week),
    orders_today: Number(rows[0].orders_today),
    active_products: Number(productRows[0].active_products)
  };
}

module.exports = { getSalesStats };
