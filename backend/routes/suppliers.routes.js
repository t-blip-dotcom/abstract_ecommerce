
const express = require('express');
const { body } = require('express-validator');

const router = express.Router();
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth.middleware');
const requireRole = require('../middleware/requireRole.middleware');
const supplierQueries = require('../queries/suppliers.queries');

const MANAGE_ROLES = ['admin', 'online_manager'];

router.get('/', requireAuth, requireRole(MANAGE_ROLES), asyncHandler(async (req, res) => {
  res.json(await supplierQueries.listSuppliers());
}));

router.post(
  '/',
  requireAuth,
  requireRole(MANAGE_ROLES),
  [body('supplier_name').trim().notEmpty().withMessage('Supplier name is required.')],
  validate,
  asyncHandler(async (req, res) => {
    res.status(201).json(await supplierQueries.createSupplier(req.body));
  })
);

router.patch(
  '/:id',
  requireAuth,
  requireRole(MANAGE_ROLES),
  [body('supplier_name').trim().notEmpty().withMessage('Supplier name is required.')],
  validate,
  asyncHandler(async (req, res) => {
    const supplier = await supplierQueries.updateSupplier(req.params.id, req.body);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found.' });
    res.json(supplier);
  })
);

router.delete(
  '/:id',
  requireAuth,
  requireRole(MANAGE_ROLES),
  asyncHandler(async (req, res) => {
    await supplierQueries.deleteSupplier(req.params.id);
    res.json({ success: true });
  })
);

module.exports = router;
