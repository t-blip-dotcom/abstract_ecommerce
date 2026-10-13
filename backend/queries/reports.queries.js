

const pool = require('../db/pool');

async function getSalesStats() {
  const { rows } = await pool.query(`
    SELECT
      COALESCE(SUM(o.amount_paid) FILTER (WHERE o.order_date = CURRENT_DATE), 0) AS sales_today,
      COALESCE(SUM(o.amount_paid) FILTER (WHERE o.order_date = CURRENT_DATE AND pm.payment_method_name = 'cash_on_delivery'), 0) AS cash_today,
      COALESCE(SUM(o.amount_paid) FILTER (WHERE o.order_date = CURRENT_DATE AND pm.payment_method_name = 'mpesa'), 0) AS online_today,
      COALESCE(SUM(o.amount_paid) FILTER (WHERE o.order_date >= CURRENT_DATE - INTERVAL '7 days'), 0) AS sales_week,
      COUNT(*) FILTER (WHERE o.order_date = CURRENT_DATE) AS orders_today
    FROM orders o
    LEFT JOIN payment_method pm ON pm.payment_method_id = o.payment_method_id
  `);

  const { rows: productRows } = await pool.query(`
    SELECT COUNT(*) AS active_products
    FROM products p
    JOIN product_status ps ON ps.product_status_id = p.product_status_id
    WHERE ps.product_status_name = 'active'
  `);

  return {
    sales_today: Number(rows[0].sales_today),
    cash_today: Number(rows[0].cash_today),
    online_today: Number(rows[0].online_today),
    sales_week: Number(rows[0].sales_week),
    orders_today: Number(rows[0].orders_today),
    active_products: Number(productRows[0].active_products)
  };
}

module.exports = { getSalesStats };
