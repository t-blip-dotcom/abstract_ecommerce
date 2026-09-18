/**
 * routes/products.routes.js
 * GET routes are public (it's a storefront). Everything that
 * changes data requires staff login, and only admin/manager can
 * manage products — staff has view-only rights per the role spec.
 */

const express = require('express');
const { body, query } = require('express-validator');

const router = express.Router();
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth.middleware');
const requireRole = require('../middleware/requireRole.middleware');
const { upload, uploadedFileUrl } = require('../middleware/upload.middleware');
const productQueries = require('../queries/products.queries');

const MANAGE_ROLES = ['admin', 'online_manager'];

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('per_page').optional().isInt({ min: 1, max: 60 }).toInt()
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { category_id, brand_id, status, search, sort } = req.query;
    const page = req.query.page || 1;
    const perPage = req.query.per_page || 12;

    const result = await productQueries.listProducts({
      category_id, brand_id, status, search, sort, page, perPage
    });

    res.json({ ...result, page, perPage });
  })
);

router.get('/low-stock', requireAuth, requireRole(MANAGE_ROLES), asyncHandler(async (req, res) => {
  res.json(await productQueries.listLowStock());
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const product = await productQueries.getProductById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json(product);
}));

const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required.'),
  body('category_id').isInt().withMessage('Choose a category.'),
  body('brand_id').isInt().withMessage('Choose a brand.'),
  body('supplier_id').isInt().withMessage('Choose a supplier.'),
  body('price').isFloat({ min: 0 }).withMessage('Enter a valid price.'),
  body('stock_quantity').isInt({ min: 0 }).withMessage('Enter a valid stock quantity.'),
  body('status').isIn(['active', 'inactive', 'out_of_stock']).withMessage('Choose a valid status.')
];

router.post(
  '/',
  requireAuth,
  requireRole(MANAGE_ROLES),
  upload.single('photo'),
  productValidation,
  validate,
  asyncHandler(async (req, res) => {
    const product = await productQueries.createProduct({ ...req.body, photo_url: uploadedFileUrl(req) });
    res.status(201).json(product);
  })
);

router.patch(
  '/:id',
  requireAuth,
  requireRole(MANAGE_ROLES),
  upload.single('photo'),
  productValidation,
  validate,
  asyncHandler(async (req, res) => {
    const product = await productQueries.updateProduct(req.params.id, {
      ...req.body,
      photo_url: uploadedFileUrl(req)
    });
    res.json(product);
  })
);

router.delete(
  '/:id',
  requireAuth,
  requireRole(MANAGE_ROLES),
  asyncHandler(async (req, res) => {
    await productQueries.deleteProduct(req.params.id);
    res.json({ success: true });
  })
);

module.exports = router;
