/**
 * middleware/auth.middleware.js
 * Reads the JWT from an httpOnly cookie (never from localStorage —
 * that would be readable by any injected script, which is a bigger
 * XSS risk), verifies it, and attaches the payload to req.user so
 * later route handlers know who's calling.
 *
 * Two customer/staff account types share this same middleware —
 * the payload's `type` field ('customer' or 'staff') plus `role`
 * (for staff) is what requireRole.middleware.js checks.
 */

const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'You need to be logged in to do that.' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Your session has expired — please log in again.' });
  }
}

/**
 * Like requireAuth, but doesn't fail if there's no token — it just
 * leaves req.user undefined. Useful for routes that behave slightly
 * differently for logged-in vs guest users without requiring login
 * (e.g. showing a saved cart if logged in).
 */
function attachUserIfPresent(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return next();

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    // Invalid/expired token on an optional route — just proceed as a guest.
  }
  return next();
}

module.exports = { requireAuth, attachUserIfPresent };
