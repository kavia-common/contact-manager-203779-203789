/**
 * Builds a consistent API error payload.
 * @param {string} code
 * @param {string} message
 * @param {number} status
 * @param {any} [details]
 */
function buildError(code, message, status, details) {
  const payload = {
    error: {
      code,
      message,
    },
  };
  if (details !== undefined) {
    payload.error.details = details;
  }
  return { status, payload };
}

/**
 * PUBLIC_INTERFACE
 * Express middleware: returns a JSON 404 for unknown routes.
 */
function notFoundHandler(req, res) {
  /** This is a public function. */
  const { status, payload } = buildError(
    'not_found',
    'Route not found',
    404,
    { path: req.originalUrl }
  );
  res.status(status).json(payload);
}

/**
 * PUBLIC_INTERFACE
 * Express error-handling middleware: ensures consistent JSON errors.
 */
function errorHandler(err, req, res, next) {
  /** This is a public function. */
  // If some code already set a status (common pattern), respect it.
  const status = Number(err.status) || 500;

  // If this is one of our structured errors, forward it.
  if (err && err.apiError && err.apiError.payload) {
    res.status(err.apiError.status).json(err.apiError.payload);
    return;
  }

  // Default fallback error (avoid leaking internals in production).
  const message =
    status >= 500
      ? 'Internal Server Error'
      : (err && err.message) || 'Request failed';

  const { payload } = buildError(
    status >= 500 ? 'internal_error' : 'request_error',
    message,
    status
  );

  // Basic server-side logging.
  console.error(err);

  res.status(status).json(payload);
}

module.exports = {
  buildError,
  notFoundHandler,
  errorHandler,
};
