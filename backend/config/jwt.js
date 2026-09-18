/**
 * config/jwt.js
 * Small shared helpers so every login route signs tokens and sets
 * the cookie the exact same (secure) way, instead of repeating
 * cookie options in five different route files where they could
 * drift out of sync.
 */

const jwt = require('jsonwebtoken');

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true, // JavaScript on the page can't read it — blocks XSS token theft
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax', // sent on normal navigation, blocked on cross-site POSTs (CSRF protection)
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days, in milliseconds
  });
}

function clearAuthCookie(res) {
  res.clearCookie('token');
}

module.exports = { signToken, setAuthCookie, clearAuthCookie };
