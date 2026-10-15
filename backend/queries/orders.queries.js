const pool = require('../db/pool');
const cartQueries = require('./cart.queries');

async function getStatusId(table, columnName, value) {
  const { rows } = await pool.query(`SELECT ${table}_id AS id FROM ${table} WHERE ${columnName} = $1`, [value]);
  return rows[0]?.id || null;
}

function generatePickupCode() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PU-${random}`;
}


async function createOrderFromCart({ customer_id, payment_method, shipping_address, fulfillment_method, items: givenItems, created_by_staff }) {
  if (payment_method === 'cash_on_delivery' && fulfillment_method === 'delivery') {
    const err = new Error('Cash payment is only available for pickup orders.');
    err.status = 400;
    throw err;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Customer checkout reads the cart; an admin-created order passes its own items.
    let cart = null;
    let items;
    if (givenItems) {
      items = givenItems;
    } else {
      cart = await cartQueries.getOrCreateActiveCart(customer_id);
      ({ rows: items } = await client.query(
        'SELECT product_id, quantity FROM cart_items WHERE cart_id = $1',
        [cart.cart_id]
      ));
    }

    if (items.length === 0) {
      await client.query('ROLLBACK');
      const err = new Error('Your cart is empty.');
      err.status = 400;
      throw err;
    }

    const shortages = [];
    const lockedProducts = {};

    for (const item of items) {
      const { rows } = await client.query(
        'SELECT product_id, name, stock_quantity FROM products WHERE product_id = $1 FOR UPDATE',
        [item.product_id]
      );
      const product = rows[0];
      lockedProducts[item.product_id] = product;

      if (!product || product.stock_quantity < item.quantity) {
        shortages.push({
          product_id: item.product_id,
          name: product?.name || 'Unknown product',
          requested: item.quantity,
          available: product?.stock_quantity || 0
        });
      }
    }

    if (shortages.length > 0) {
      await client.query('ROLLBACK');
      const err = new Error('Some items in your cart are no longer available in that quantity.');
      err.status = 409;
      err.shortages = shortages;
      throw err;
    }

let totalProductAmount = 0;

    for (const item of items) {
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE product_id = $2',
        [item.quantity, item.product_id]
      );
      
      totalProductAmount += Number(lockedProducts[item.product_id].price) * item.quantity;

      if (lockedProducts[item.product_id].stock_quantity - item.quantity <= 0) {
        const outOfStockId = await getStatusId('product_status', 'product_status_name', 'out_of_stock');
        await client.query('UPDATE products SET product_status_id = $1 WHERE product_id = $2', [outOfStockId, item.product_id]);
      }
    }

    const orderStatusId = await getStatusId('order_status', 'name', 'pending');
    const paymentStatusId = await getStatusId('payment_status', 'name', 'pending');
    const { rows: paymentMethodRows } = await client.query(
      'SELECT payment_method_id FROM payment_method WHERE payment_method_name = $1', [payment_method]
    );

    const pickupCode = fulfillment_method === 'pickup' ? generatePickupCode() : null;

    const { rows: numRows } = await client.query(
      `WITH bump AS (
         INSERT INTO order_counters (order_date, last_number)
         VALUES ((NOW() AT TIME ZONE 'Africa/Nairobi')::date, 1)
         ON CONFLICT (order_date) DO UPDATE SET last_number = order_counters.last_number + 1
         RETURNING order_date, last_number
       )
       SELECT 'ORD' || to_char(order_date, 'YYMMDD') || lpad(last_number::text, 4, '0') AS order_number
       FROM bump`
    );

    const { rows: orderRows } = await client.query(
      `INSERT INTO orders
         (order_status_id, payment_method_id, order_date, payment_status_id,
          shipping_address, customer_id, fulfillment_method, pickup_code, amount_paid,
          order_number, created_by_staff)
       VALUES ($1, $2, (NOW() AT TIME ZONE 'Africa/Nairobi')::date, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING order_id, order_number, pickup_code, amount_paid`,
      [orderStatusId, paymentMethodRows[0]?.payment_method_id || null, paymentStatusId,
       shipping_address || null, customer_id, fulfillment_method, pickupCode, totalProductAmount,
       numRows[0].order_number, created_by_staff || null]
    );
    const order = orderRows[0];

    for (const item of items) {
      await client.query(
        'INSERT INTO order_items (product_id, order_id, quantity) VALUES ($1, $2, $3)',
        [item.product_id, order.order_id, item.quantity]
      );
    }

    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.cart_id]);

    await client.query('COMMIT');
    return order;
  } catch (err) {
    // If we haven't already rolled back above, make sure to now.
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

async function listOrders({ status, payment_status, from, to, search, page = 1, perPage = 20 }) {
  const clauses = [];
  const params = [];

  if (status) { params.push(status); clauses.push(`os.name = $${params.length}`); }
  if (payment_status) { params.push(payment_status); clauses.push(`pys.name = $${params.length}`); }
  if (from) { params.push(from); clauses.push(`o.order_date >= $${params.length}`); }
  if (to) { params.push(to); clauses.push(`o.order_date <= $${params.length}`); }
  if (search) { params.push(`%${search}%`); clauses.push(`c.name ILIKE $${params.length}`); }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const offset = (page - 1) * perPage;
  const listParams = [...params, perPage, offset];

  const { rows } = await pool.query(
    `SELECT
       o.order_id, o.order_date, o.amount_paid, o.shipping_address,
       o.fulfillment_method, o.pickup_code, o.pickup_collected_at,
       c.customer_id, c.name AS customer_name, c.primary_phone,
       pm.payment_method_name, pys.name AS payment_status, os.name AS order_status,
       s.name AS processed_by_name
     FROM orders o
     JOIN customers c ON c.customer_id = o.customer_id
     JOIN order_status os ON os.order_status_id = o.order_status_id
     JOIN payment_status pys ON pys.payment_status_id = o.payment_status_id
     LEFT JOIN payment_method pm ON pm.payment_method_id = o.payment_method_id
     LEFT JOIN STAFF s ON s.staff_id = o.processed_by
     ${whereSql}
     ORDER BY o.order_id DESC
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams
  );

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) FROM orders o
     JOIN customers c ON c.customer_id = o.customer_id
     JOIN order_status os ON os.order_status_id = o.order_status_id
     JOIN payment_status pys ON pys.payment_status_id = o.payment_status_id
     ${whereSql}`,
    params
  );

  return { orders: rows, total: Number(countRows[0].count) };
}

async function getCustomerOrders(customerId) {
  const { rows } = await pool.query(
    `SELECT o.order_id, o.order_date, o.amount_paid, os.name AS order_status,
            o.fulfillment_method, o.pickup_code
     FROM orders o
     JOIN order_status os ON os.order_status_id = o.order_status_id
     WHERE o.customer_id = $1
     ORDER BY o.order_id DESC`,
    [customerId]
  );
  return rows;
}

async function updateOrderStatus(orderId, newStatusName, staffId) {
  const statusId = await getStatusId('order_status', 'name', newStatusName);
  if (!statusId) {
    const err = new Error('Not a valid order status.');
    err.status = 400;
    throw err;
  }

  const { rows } = await pool.query(
    `UPDATE orders SET order_status_id = $1, processed_by = $2
     WHERE order_id = $3
     RETURNING order_id, customer_id`,
    [statusId, staffId, orderId]
  );
  return rows[0] || null;
}

async function findByPickupCode(pickupCode) {
  const { rows } = await pool.query(
    `SELECT o.order_id, o.pickup_code, o.pickup_collected_at, o.amount_paid, 
            c.name AS customer_name, c.primary_phone,
            pm.payment_method_name, pys.name AS payment_status
     FROM orders o
     JOIN customers c ON c.customer_id = o.customer_id
     LEFT JOIN payment_method pm ON pm.payment_method_id = o.payment_method_id
     JOIN payment_status pys ON pys.payment_status_id = o.payment_status_id
     WHERE o.pickup_code = $1`,
    [pickupCode]
  );
  return rows[0] || null;
}

async function markPickupCollected(orderId, staffId, isCashPayment) {
  const deliveredStatusId = await getStatusId('order_status', 'name', 'delivered');
  
  if (isCashPayment) {
    const completedPaymentId = await getStatusId('payment_status', 'name', 'completed');
    const { rows } = await pool.query(
      `UPDATE orders 
       SET pickup_collected_at = CURRENT_TIMESTAMP, order_status_id = $1, processed_by = $2, payment_status_id = $3
       WHERE order_id = $4 RETURNING order_id, customer_id`,
      [deliveredStatusId, staffId, completedPaymentId, orderId]
    );
    return rows[0] || null;
  } else {
    const { rows } = await pool.query(
      `UPDATE orders 
       SET pickup_collected_at = CURRENT_TIMESTAMP, order_status_id = $1, processed_by = $2
       WHERE order_id = $3 RETURNING order_id, customer_id`,
      [deliveredStatusId, staffId, orderId]
    );
    return rows[0] || null;
  }
}

async function getOrderItems(orderId) {
  const { rows } = await pool.query(
    `SELECT oi.order_item_id, oi.quantity, p.product_id, p.name, p.price,
            (oi.quantity * p.price) AS subtotal
     FROM order_items oi
     JOIN products p ON p.product_id = oi.product_id
     WHERE oi.order_id = $1
     ORDER BY oi.order_item_id ASC`,
    [orderId]
  );
  return rows;
}

module.exports = {
  createOrderFromCart,
  listOrders,
  getCustomerOrders,
  updateOrderStatus,
  findByPickupCode,
  markPickupCollected,
  getOrderItems
};