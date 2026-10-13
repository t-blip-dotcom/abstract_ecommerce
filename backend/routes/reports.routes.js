
const express = require('express');
const router = express.Router();

const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth.middleware');
const requireRole = require('../middleware/requireRole.middleware');
const reportQueries = require('../queries/reports.queries');
const productQueries = require('../queries/products.queries');

router.use(requireAuth, requireRole(['admin', 'online_manager']));

router.get('/', asyncHandler(async (req, res) => {
  const [stats, lowStock] = await Promise.all([
    reportQueries.getSalesStats(),
    productQueries.listLowStock()
  ]);
  res.json({ ...stats, low_stock: lowStock });
}));

module.exports = router;
