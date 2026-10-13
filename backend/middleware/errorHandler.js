
function errorHandler(err, req, res, next) {
  console.error(err);

  // Postgres error for unique constraints violation
  if (err.code === '23505') {
    return res.status(409).json({ error: 'That value is already in use.' });
  }

  // Postgres error for foreign-key violation
  if (err.code === '23503') {
    return res.status(409).json({ error: "This is still referenced elsewhere and can't be deleted." });
  }

  const status = err.status || 500;
  const message = status === 500 ? 'Something went wrong on our end. Please try again.' : err.message;

  res.status(status).json({ error: message });
}

function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { errorHandler, asyncHandler };
