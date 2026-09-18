/**
 * routes/auth.routes.js
 * Customer accounts and staff accounts are deliberately separate
 * flows sharing the same JWT/cookie mechanism (see config/jwt.js):
 *   - Customers register themselves with an email.
 *   - Staff pick a username + password and land in `pending` status
 *     until an admin approves them (see routes/staff.routes.js).
 */

const express = require('express');
const bcrypt = require('bcrypt');
const { body } = require('express-validator');

const router = express.Router();
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth.middleware');
const { signToken, setAuthCookie, clearAuthCookie } = require('../config/jwt');
const authQueries = require('../queries/auth.queries');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

// ---------------------------------------------------------
// Customers
// ---------------------------------------------------------

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Full name is required.'),
    body('primary_phone').trim().notEmpty().withMessage('Phone number is required.'),
    body('email_address').trim().isEmail().withMessage('Enter a valid email address.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, primary_phone, alternative_phone, address, email_address, password } = req.body;

    const existing = await authQueries.findCustomerByEmail(email_address);
    if (existing) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const customer = await authQueries.createCustomer({
      name, primary_phone, alternative_phone, address, email_address, password_hash
    });

    const token = signToken({ type: 'customer', customer_id: customer.customer_id });
    setAuthCookie(res, token);
    res.status(201).json({ customer });
  })
);

router.post(
  '/login',
  [
    body('email_address').trim().isEmail().withMessage('Enter a valid email address.'),
    body('password').notEmpty().withMessage('Password is required.')
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { email_address, password } = req.body;
    const customer = await authQueries.findCustomerByEmail(email_address);

    // Same error for "no such account" and "wrong password" — this
    // stops an attacker from using the error message to discover
    // which emails are registered.
    const invalidCredentials = () =>
      res.status(401).json({ error: 'Incorrect email or password.' });

    if (!customer) return invalidCredentials();

    const passwordMatches = await bcrypt.compare(password, customer.password_hash);
    if (!passwordMatches) return invalidCredentials();

    const token = signToken({ type: 'customer', customer_id: customer.customer_id });
    setAuthCookie(res, token);
    res.json({
      customer: {
        customer_id: customer.customer_id,
        name: customer.name,
        email_address: customer.email_address
      }
    });
  })
);

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// ---------------------------------------------------------
// Staff — username + password, self-requested, admin-approved
// ---------------------------------------------------------

router.post(
  '/staff-request',
  [
    body('name').trim().notEmpty().withMessage('Full name is required.'),
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters.')
      .isAlphanumeric().withMessage('Username can only contain letters and numbers.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, username, password } = req.body;

    const existing = await authQueries.findStaffByUsername(username);
    if (existing) {
      return res.status(409).json({ error: 'That username is taken — please choose another.' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const staff = await authQueries.createStaffRequest({ name, username, password_hash });

    res.status(201).json({
      message: "Request submitted! An admin will review and approve your account.",
      staff
    });
  })
);

router.post(
  '/staff-login',
  [
    body('username').trim().notEmpty().withMessage('Username is required.'),
    body('password').notEmpty().withMessage('Password is required.')
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const staff = await authQueries.findStaffByUsername(username);

    const invalidCredentials = () =>
      res.status(401).json({ error: 'Incorrect username or password.' });

    if (!staff) return invalidCredentials();

    const passwordMatches = await bcrypt.compare(password, staff.password_hash);
    if (!passwordMatches) return invalidCredentials();

    if (staff.status === 'pending') {
      return res.status(403).json({
        error: "You're not an approved staff member yet. Ask an admin for approval, or use the customer login."
      });
    }
    if (staff.status === 'inactive') {
      return res.status(403).json({ error: 'Your staff account has been deactivated. Contact an admin.' });
    }

    await authQueries.updateStaffLastLogin(staff.staff_id);

    const token = signToken({
      type: 'staff',
      staff_id: staff.staff_id,
      role: staff.role_name,
      status: staff.status
    });
    setAuthCookie(res, token);
    res.json({ staff: { staff_id: staff.staff_id, name: staff.name, role: staff.role_name } });
  })
);

router.post('/staff-logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
});

module.exports = router;
