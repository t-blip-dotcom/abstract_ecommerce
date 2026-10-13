const jwt = require('jsonwebtoken');
const pool = require('../db/pool');


function extractToken(req) {
  if (!req.cookies) return null;
  if (req.cookies.token) return req.cookies.token;
  if (req.cookies.auth_token) return req.cookies.auth_token;
  if (req.cookies.jwt) return req.cookies.jwt;
  if (req.cookies.session) return req.cookies.session;
  
  return Object.values(req.cookies).find(val => typeof val === 'string' && val.startsWith('eyJ')) || null;
}

async function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Log in to continue.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type === 'staff') {
      const { rows } = await pool.query('SELECT status FROM STAFF WHERE staff_id = $1', [decoded.staff_id]);
      if (!rows[0] || rows[0].status !== 'active') {
        return res.status(403).json({ error: 'Session expired or account deactivated.' });
      }
    }
    
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Auth verification failed:', err.message);
    res.status(401).json({ error: 'Invalid or expired session.' });
  }
}

async function attachUserIfPresent(req, res, next) {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type === 'staff') {
      const { rows } = await pool.query('SELECT status FROM STAFF WHERE staff_id = $1', [decoded.staff_id]);
      if (rows[0] && rows[0].status === 'active') {
        req.user = decoded;
      }
    } else {
      req.user = decoded;
    }
  } catch (err) {
  }
  next();
}

module.exports = { requireAuth, attachUserIfPresent };