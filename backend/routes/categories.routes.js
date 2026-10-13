
const express = require('express');
const { body } = require('express-validator');

const router = express.Router();
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth.middleware');
const requireRole = require('../middleware/requireRole.middleware');
const categoryQueries = require('../queries/categories.queries');

const MANAGE_ROLES = ['admin', 'online_manager'];

router.get('/', asyncHandler(async (req, res) => {
  res.json(await categoryQueries.listCategories());
}));

router.post(
  '/',
  requireAuth,
  requireRole(MANAGE_ROLES),
  [body('category_name').trim().notEmpty().withMessage('Category name is required.')],
  validate,
  asyncHandler(async (req, res) => {
    const category = await categoryQueries.createCategory(req.body);
    res.status(201).json(category);
  })
);

router.patch(
  '/:id',
  requireAuth,
  requireRole(MANAGE_ROLES),
  [body('category_name').trim().notEmpty().withMessage('Category name is required.')],
  validate,
  asyncHandler(async (req, res) => {
    const category = await categoryQueries.updateCategory(req.params.id, req.body);
    if (!category) return res.status(404).json({ error: 'Category not found.' });
    res.json(category);
  })
);

router.delete(
  '/:id',
  requireAuth,
  requireRole(MANAGE_ROLES),
  asyncHandler(async (req, res) => {
    await categoryQueries.deleteCategory(req.params.id);
    res.json({ success: true });
  })
);

module.exports = router;
