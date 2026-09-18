/**
 * middleware/validate.js
 * Every route that accepts a body attaches express-validator rules
 * to itself (see the routes files), then this one shared middleware
 * checks whether any of them failed and returns a consistent, field-
 * by-field error shape the frontend can show next to the right input.
 */

const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  // Shape: { errors: { fieldName: "message", ... } } — one message
  // per field, matching how the frontend's forms.js highlights fields.
  const fieldErrors = {};
  errors.array().forEach((err) => {
    if (!fieldErrors[err.path]) fieldErrors[err.path] = err.msg;
  });

  return res.status(400).json({ error: 'Please fix the highlighted fields.', errors: fieldErrors });
}

module.exports = validate;
