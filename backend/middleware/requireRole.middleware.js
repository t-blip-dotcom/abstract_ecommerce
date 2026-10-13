
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
