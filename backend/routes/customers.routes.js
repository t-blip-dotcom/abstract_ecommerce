/**
 * routes/customers.routes.js
 * Admin only — a support directory, not a place to create
 * customers (they register themselves on the storefront).
 */

const express = require('express');
const { body } = require('express-validator');

const router = express.Router();
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth.middleware');
const requireRole = require('../middleware/requireRole.middleware');
const customerQueries = require('../queries/customers.queries');

router.use(requireAuth, requireRole(['admin']));

router.get('/', asyncHandler(async (req, res) => {
  res.json(await customerQueries.listCustomers());
}));

router.patch(
  '/:id',
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('primary_phone').trim().notEmpty().withMessage('Primary phone is required.'),
    body('email_address').optional({ checkFalsy: true }).isEmail().withMessage('Enter a valid email address.')
  ],
  validate,
  asyncHandler(async (req, res) => {
    const customer = await customerQueries.updateCustomer(req.params.id, req.body);
    if (!customer) return res.status(404).json({ error: 'Customer not found.' });
    res.json(customer);
  })
);

module.exports = router;
