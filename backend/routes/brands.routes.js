
const express = require('express');
const { body } = require('express-validator');

const router = express.Router();
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth.middleware');
const requireRole = require('../middleware/requireRole.middleware');
const { upload, uploadedFileUrl } = require('../middleware/upload.middleware');
const brandQueries = require('../queries/brands.queries');

const MANAGE_ROLES = ['admin', 'online_manager'];

router.get('/', asyncHandler(async (req, res) => {
  res.json(await brandQueries.listBrands());
}));

router.post(
  '/',
  requireAuth,
  requireRole(MANAGE_ROLES),
  upload.single('logo'),
  [body('brand_name').trim().notEmpty().withMessage('Brand name is required.')],
  validate,
  asyncHandler(async (req, res) => {
    const brand = await brandQueries.createBrand({ ...req.body, logo_url: uploadedFileUrl(req) });
    res.status(201).json(brand);
  })
);

router.patch(
  '/:id',
  requireAuth,
  requireRole(MANAGE_ROLES),
  upload.single('logo'),
  [body('brand_name').trim().notEmpty().withMessage('Brand name is required.')],
  validate,
  asyncHandler(async (req, res) => {
    const brand = await brandQueries.updateBrand(req.params.id, { ...req.body, logo_url: uploadedFileUrl(req) });
    if (!brand) return res.status(404).json({ error: 'Brand not found.' });
    res.json(brand);
  })
);

router.delete(
  '/:id',
  requireAuth,
  requireRole(MANAGE_ROLES),
  asyncHandler(async (req, res) => {
    await brandQueries.deleteBrand(req.params.id);
    res.json({ success: true });
  })
);

module.exports = router;
