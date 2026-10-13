

const express = require('express');
const { body } = require('express-validator');

const router = express.Router();
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth.middleware');
const cartQueries = require('../queries/cart.queries');

router.use(requireAuth);

function requireCustomer(req, res, next) {
  if (req.user.type !== 'customer') {
    return res.status(403).json({ error: 'Customer login required.' });
  }
  next();
}
router.use(requireCustomer);

router.get('/', asyncHandler(async (req, res) => {
  const cart = await cartQueries.getOrCreateActiveCart(req.user.customer_id);
  const items = await cartQueries.getCartItems(cart.cart_id);
  res.json({ cart_id: cart.cart_id, items });
}));

router.post(
  '/items',
  [
    body('product_id').isInt().withMessage('Missing product.'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1.')
  ],
  validate,
  asyncHandler(async (req, res) => {
    const cart = await cartQueries.getOrCreateActiveCart(req.user.customer_id);
    await cartQueries.addOrIncrementItem(cart.cart_id, req.body.product_id, req.body.quantity);
    res.status(201).json({ items: await cartQueries.getCartItems(cart.cart_id) });
  })
);

router.patch(
  '/items/:cartItemId',
  [body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1.')],
  validate,
  asyncHandler(async (req, res) => {
    const cart = await cartQueries.getOrCreateActiveCart(req.user.customer_id);
    await cartQueries.setItemQuantity(req.params.cartItemId, cart.cart_id, req.body.quantity);
    res.json({ items: await cartQueries.getCartItems(cart.cart_id) });
  })
);

router.delete('/items/:cartItemId', asyncHandler(async (req, res) => {
  const cart = await cartQueries.getOrCreateActiveCart(req.user.customer_id);
  await cartQueries.removeItem(req.params.cartItemId, cart.cart_id);
  res.json({ items: await cartQueries.getCartItems(cart.cart_id) });
}));

module.exports = router;
