const jwt = require('jsonwebtoken');

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'lax', 
    maxAge: 7 * 24 * 60 * 60 * 1000 
  });
}

function clearAuthCookie(res) {
  res.clearCookie('token');
}

module.exports = { signToken, setAuthCookie, clearAuthCookie };
