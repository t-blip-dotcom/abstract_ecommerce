

const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  
  const fieldErrors = {};
  errors.array().forEach((err) => {
    if (!fieldErrors[err.path]) fieldErrors[err.path] = err.msg;
  });

  return res.status(400).json({ error: 'Please fix the highlighted fields.', errors: fieldErrors });
}

module.exports = validate;
