/**
 * config/rateLimiters.js
 * Two limiters: a strict one for login/signup endpoints (the
 * classic brute-force target), and a looser general one for
 * everything else so the API can't be hammered either.
 */

const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' }
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // generous for normal browsing/admin use
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' }
});

module.exports = { authLimiter, apiLimiter };
