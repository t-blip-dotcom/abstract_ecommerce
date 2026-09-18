/**
 * routes/notifications.routes.js
 * All scoped to the logged-in customer — a customer can only ever
 * see or mark their own notifications, never anyone else's.
 */

const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/errorHandler');
const notificationQueries = require('../queries/notifications.queries');

router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  if (req.user.type !== 'customer') {
    return res.status(403).json({ error: 'Customer login required.' });
  }
  const page = Number(req.query.page) || 1;
  const result = await notificationQueries.listForCustomer(req.user.customer_id, { page });
  res.json(result);
}));

router.patch('/:id/read', asyncHandler(async (req, res) => {
  if (req.user.type !== 'customer') {
    return res.status(403).json({ error: 'Customer login required.' });
  }
  await notificationQueries.markAsRead(req.params.id, req.user.customer_id);
  res.json({ success: true });
}));

router.patch('/read-all', asyncHandler(async (req, res) => {
  if (req.user.type !== 'customer') {
    return res.status(403).json({ error: 'Customer login required.' });
  }
  await notificationQueries.markAllAsRead(req.user.customer_id);
  res.json({ success: true });
}));

module.exports = router;
