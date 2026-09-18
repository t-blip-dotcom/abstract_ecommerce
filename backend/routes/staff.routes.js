/**
 * routes/staff.routes.js
 * Admin only, per the role spec. Approving a pending sign-up is a
 * single click (PATCH .../approve) — that's the one thing an admin
 * has to do per new hire, everything else (choosing a username/
 * password) the staff member already did themselves.
 */

const express = require('express');
const { body } = require('express-validator');

const router = express.Router();
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth.middleware');
const requireRole = require('../middleware/requireRole.middleware');
const staffQueries = require('../queries/staff.queries');

router.use(requireAuth, requireRole(['admin']));

router.get('/', asyncHandler(async (req, res) => {
  res.json(await staffQueries.listStaff());
}));

router.patch('/:id/approve', asyncHandler(async (req, res) => {
  const staff = await staffQueries.approveStaff(req.params.id);
  if (!staff) return res.status(404).json({ error: 'Staff member not found.' });
  res.json(staff);
}));

router.patch(
  '/:id',
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('role').isIn(['admin', 'online_manager', 'staff']).withMessage('Choose a valid role.'),
    body('status').isIn(['pending', 'active', 'inactive']).withMessage('Choose a valid status.')
  ],
  validate,
  asyncHandler(async (req, res) => {
    const staff = await staffQueries.updateStaff(req.params.id, req.body);
    if (!staff) return res.status(404).json({ error: 'Staff member not found.' });
    res.json(staff);
  })
);

router.delete('/:id', asyncHandler(async (req, res) => {
  await staffQueries.deleteStaff(req.params.id);
  res.json({ success: true });
}));

module.exports = router;
