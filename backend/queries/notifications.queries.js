const { ObjectId } = require('mongodb');
const { getMongoDb } = require('../db/mongo');

function notifications() {
  return getMongoDb().collection('notifications');
}

async function createNotification({ customer_id, type, title, body, ...extra }) {
  const doc = {
    customer_id,
    type,
    title,
    body,
    is_read: false,
    created_at: new Date(),
    ...extra 
  };
  const { insertedId } = await notifications().insertOne(doc);
  return { _id: insertedId, ...doc };
}


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
