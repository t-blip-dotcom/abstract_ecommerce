/**
 * middleware/errorHandler.js
 * Last piece of middleware in the chain (see server.js). Any error
 * passed to next(err) — or thrown inside an async route wrapped in
 * asyncHandler — ends up here instead of crashing the server or
 * leaking a raw stack trace to the client.
 */

function errorHandler(err, req, res, next) {
  console.error(err);

  // Postgres unique-constraint violation (e.g. duplicate username/email).
  if (err.code === '23505') {
    return res.status(409).json({ error: 'That value is already in use.' });
  }

  // Postgres foreign-key violation (e.g. deleting a category still in use).
  if (err.code === '23503') {
    return res.status(409).json({ error: "This is still referenced elsewhere and can't be deleted." });
  }

  const status = err.status || 500;
  const message = status === 500 ? 'Something went wrong on our end. Please try again.' : err.message;

  res.status(status).json({ error: message });
}

/**
 * Wraps an async route handler so a rejected promise (a thrown error
 * inside `await`) gets forwarded to errorHandler instead of hanging
 * the request or crashing the process.
 */
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { errorHandler, asyncHandler };
