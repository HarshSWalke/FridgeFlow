/**
 * Async Handler — wraps async route handlers to catch errors
 * and forward them to Express error middleware.
 *
 * Usage: router.get('/items', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
