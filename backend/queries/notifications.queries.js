/**
 * queries/notifications.queries.js
 * MongoDB version — same idea as the Postgres query files (one
 * function per job), just using the Mongo driver's methods instead
 * of SQL. Every notification has customer_id, type, title, body,
 * is_read, created_at; anything type-specific (order_id + new
 * status, promo details, which product sold out) rides along as
 * extra fields on the same document — that flexibility is exactly
 * why this collection is in Mongo instead of a fixed Postgres table.
 */

const { ObjectId } = require('mongodb');
const { getMongoDb } = require('../db/mongo');

function notifications() {
  return getMongoDb().collection('notifications');
}

async function createNotification({ customer_id, type, title, body, ...extra }) {
  const doc = {
    customer_id,
    type, // 'order_status' | 'promotion' | 'stock'
    title,
    body,
    is_read: false,
    created_at: new Date(),
    ...extra // e.g. { order_id, new_status } or { product_id, product_name }
  };
  const { insertedId } = await notifications().insertOne(doc);
  return { _id: insertedId, ...doc };
}

/** Convenience wrapper used by orders.queries.js whenever a status changes. */
function notifyOrderStatusChange({ customer_id, order_id, new_status }) {
  const friendlyStatus = new_status.replace('_', ' ');
  return createNotification({
    customer_id,
    type: 'order_status',
    title: `Order #${order_id} is now ${friendlyStatus}`,
    body: `Your order's status changed to "${friendlyStatus}".`,
    order_id,
    new_status
  });
}

/** Used when a cart item sells out before checkout — see cart.queries.js. */
function notifySoldOut({ customer_id, product_id, product_name }) {
  return createNotification({
    customer_id,
    type: 'stock',
    title: `${product_name} just sold out`,
    body: `${product_name} sold out before you checked out, so it's been removed from your cart.`,
    product_id
  });
}

async function listForCustomer(customerId, { page = 1, perPage = 20 } = {}) {
  const cursor = notifications()
    .find({ customer_id: customerId })
    .sort({ created_at: -1 })
    .skip((page - 1) * perPage)
    .limit(perPage);

  const [items, total, unreadCount] = await Promise.all([
    cursor.toArray(),
    notifications().countDocuments({ customer_id: customerId }),
    notifications().countDocuments({ customer_id: customerId, is_read: false })
  ]);

  return { notifications: items, total, unreadCount };
}

async function markAsRead(notificationId, customerId) {
  await notifications().updateOne(
    { _id: new ObjectId(notificationId), customer_id: customerId },
    { $set: { is_read: true } }
  );
}

async function markAllAsRead(customerId) {
  await notifications().updateMany(
    { customer_id: customerId, is_read: false },
    { $set: { is_read: true } }
  );
}

module.exports = {
  createNotification,
  notifyOrderStatusChange,
  notifySoldOut,
  listForCustomer,
  markAsRead,
  markAllAsRead
};
