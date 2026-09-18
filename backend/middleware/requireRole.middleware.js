/**
 * middleware/requireRole.middleware.js
 * Enforces the same role rights the admin frontend already shows/
 * hides in its nav — but here it's the real gate, since the
 * frontend check is just UI convenience and can't be trusted alone.
 *
 *   admin           -> staff, products, brands, categories, orders, customers, reports
 *   online_manager  -> products, brands, categories, orders, reports
 *   staff           -> products (read only), orders (status updates only)
 *
 * Usage: router.post('/products', requireAuth, requireRole(['admin', 'online_manager']), handler)
 */

function requireRole(allowedRoles) {
  return function (req, res, next) {
    if (!req.user || req.user.type !== 'staff') {
      return res.status(403).json({ error: 'Staff access only.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "You don't have permission to do that." });
    }

    if (req.user.status !== 'active') {
      return res.status(403).json({ error: 'Your staff account is not active yet.' });
    }

    return next();
  };
}

module.exports = requireRole;
