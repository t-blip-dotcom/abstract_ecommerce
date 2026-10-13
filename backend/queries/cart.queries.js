

const pool = require('../db/pool');

async function getOrCreateActiveCart(customerId) {
  const { rows: activeStatusRows } = await pool.query(
    "SELECT cart_status_id FROM cart_status WHERE name = 'active'"
  );
  const activeStatusId = activeStatusRows[0].cart_status_id;

  const { rows: existing } = await pool.query(
    'SELECT * FROM cart WHERE customer_id = $1 AND cart_status_id = $2',
    [customerId, activeStatusId]
  );
  if (existing[0]) return existing[0];

  const { rows: created } = await pool.query(
    'INSERT INTO cart (customer_id, cart_status_id) VALUES ($1, $2) RETURNING *',
    [customerId, activeStatusId]
  );
  return created[0];
}

async function getCartItems(cartId) {
  const { rows } = await pool.query(
    `SELECT
       ci.cart_item_id, ci.quantity,
       p.product_id, p.name, p.price, p.photo_url, p.stock_quantity,
       ps.product_status_name AS status,
       (ci.quantity <= p.stock_quantity AND ps.product_status_name = 'active') AS is_available
     FROM cart_items ci
     JOIN products p ON p.product_id = ci.product_id
     JOIN product_status ps ON ps.product_status_id = p.product_status_id
     WHERE ci.cart_id = $1
     ORDER BY ci.cart_item_id ASC`,
    [cartId]
  );
  return rows;
}

async function findCartItem(cartId, productId) {
  const { rows } = await pool.query(
    'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2',
    [cartId, productId]
  );
  return rows[0] || null;
}

async function addOrIncrementItem(cartId, productId, quantity) {
  const existing = await findCartItem(cartId, productId);
  if (existing) {
    await pool.query(
      'UPDATE cart_items SET quantity = quantity + $1 WHERE cart_item_id = $2',
      [quantity, existing.cart_item_id]
    );
  } else {
    await pool.query(
      'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)',
      [cartId, productId, quantity]
    );
  }
}

async function setItemQuantity(cartItemId, cartId, quantity) {
  await pool.query(
    'UPDATE cart_items SET quantity = $1 WHERE cart_item_id = $2 AND cart_id = $3',
    [quantity, cartItemId, cartId]
  );
}

async function removeItem(cartItemId, cartId) {
  await pool.query('DELETE FROM cart_items WHERE cart_item_id = $1 AND cart_id = $2', [cartItemId, cartId]);
}

async function clearCart(cartId) {
  await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
}

async function markCartConverted(cartId) {
  const { rows } = await pool.query("SELECT cart_status_id FROM cart_status WHERE name = 'converted'");
  await pool.query('UPDATE cart SET cart_status_id = $1 WHERE cart_id = $2', [rows[0].cart_status_id, cartId]);
}

module.exports = {
  getOrCreateActiveCart,
  getCartItems,
  findCartItem,
  addOrIncrementItem,
  setItemQuantity,
  removeItem,
  clearCart,
  markCartConverted
};
