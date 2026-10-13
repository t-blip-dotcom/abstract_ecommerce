

const express = require('express');
const QRCode = require('qrcode');
const { body, query } = require('express-validator');

const router = express.Router();
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth.middleware');
const requireRole = require('../middleware/requireRole.middleware');
const orderQueries = require('../queries/orders.queries');
const notificationQueries = require('../queries/notifications.queries');

const STAFF_ORDER_ROLES = ['admin', 'online_manager', 'staff']; // everyone with orders access can update status


router.post(
  '/checkout',
  requireAuth,
  [
    body('payment_method').isIn(['mpesa', 'cash_on_delivery', 'card']).withMessage('Choose a payment method.'),
    body('fulfillment_method').isIn(['pickup', 'delivery']).withMessage('Choose pickup or delivery.'),
    body('shipping_address').if(body('fulfillment_method').equals('delivery'))
      .trim().notEmpty().withMessage('Delivery address is required.')
  ],
  validate,
  asyncHandler(async (req, res) => {
    if (req.user.type !== 'customer') {
      return res.status(403).json({ error: 'Customer login required.' });
    }

    try {
      const order = await orderQueries.createOrderFromCart({
        customer_id: req.user.customer_id,
        payment_method: req.body.payment_method,
        shipping_address: req.body.shipping_address,
        fulfillment_method: req.body.fulfillment_method
      });

      let pickupQrDataUrl = null;
      if (order.pickup_code) {
        pickupQrDataUrl = await QRCode.toDataURL(order.pickup_code);
      }

      await notificationQueries.createNotification({
        customer_id: req.user.customer_id,
        type: 'order_status',
        title: `Order #${order.order_id} placed`,
        body: order.pickup_code
          ? `Bring your pickup code ${order.pickup_code} and the QR code when you collect your order.`
          : "We'll contact you shortly to arrange delivery and confirm the cost.",
        order_id: order.order_id
      });

      res.status(201).json({ ...order, pickup_qr_data_url: pickupQrDataUrl });
    } catch (err) {
      if (err.shortages) {
        for (const item of err.shortages) {
          if (item.available === 0) {
            await notificationQueries.notifySoldOut({
              customer_id: req.user.customer_id,
              product_id: item.product_id,
              product_name: item.name
            });
          }
        }
        return res.status(409).json({ error: err.message, shortages: err.shortages });
      }
      throw err;
    }
  })
);

router.get('/mine', requireAuth, asyncHandler(async (req, res) => {
  if (req.user.type !== 'customer') {
    return res.status(403).json({ error: 'Customer login required.' });
  }
  res.json(await orderQueries.getCustomerOrders(req.user.customer_id));
}));


router.get(
  '/',
  requireAuth,
  requireRole(STAFF_ORDER_ROLES),
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('per_page').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { status, payment_status, from, to, search } = req.query;
    const page = req.query.page || 1;
    const perPage = req.query.per_page || 20;
    res.json(await orderQueries.listOrders({ status, payment_status, from, to, search, page, perPage }));
  })
);

router.get(
  '/:id/items',
  requireAuth,
  requireRole(STAFF_ORDER_ROLES),
  asyncHandler(async (req, res) => {
    res.json(await orderQueries.getOrderItems(req.params.id));
  })
);

router.patch(
  '/:id/status',
  requireAuth,
  requireRole(STAFF_ORDER_ROLES),
  [body('status').isIn(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'payment_failed'])
    .withMessage('Not a valid order status.')],
  validate,
  asyncHandler(async (req, res) => {
    const updated = await orderQueries.updateOrderStatus(req.params.id, req.body.status, req.user.staff_id);
    if (!updated) return res.status(404).json({ error: 'Order not found.' });

    await notificationQueries.notifyOrderStatusChange({
      customer_id: updated.customer_id,
      order_id: updated.order_id,
      new_status: req.body.status
    });

    res.json({ success: true });
  })
);

router.get(
  '/pickup/:code',
  requireAuth,
  requireRole(STAFF_ORDER_ROLES),
  asyncHandler(async (req, res) => {
    const order = await orderQueries.findByPickupCode(req.params.code);
    if (!order) return res.status(404).json({ error: 'No order found for that pickup code.' });
    res.json(order);
  })
);

router.post(
  '/pickup/:code/collect',
  requireAuth,
  requireRole(STAFF_ORDER_ROLES),
  asyncHandler(async (req, res) => {
    const order = await orderQueries.findByPickupCode(req.params.code);
    if (!order) return res.status(404).json({ error: 'No order found for that pickup code.' });
    if (order.pickup_collected_at) {
      return res.status(409).json({ error: 'This order has already been collected.' });
    }
    
  
    const isCash = order.payment_method_name === 'cash_on_delivery';
    
    const updated = await orderQueries.markPickupCollected(order.order_id, req.user.staff_id, isCash);
    
    await notificationQueries.notifyOrderStatusChange({
      customer_id: updated.customer_id,
      order_id: updated.order_id,
      new_status: 'delivered'
    });
    res.json({ success: true, message: isCash ? 'Cash collected and order marked as paid.' : 'Order collected.' });
  })
);

module.exports = router;