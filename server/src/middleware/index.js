/**
 * Request Logger Middleware
 * Logs incoming API requests with method, path, and timing
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const color = status >= 400 ? '\x1b[31m' : status >= 300 ? '\x1b[33m' : '\x1b[32m';
    console.log(`  ${timestamp} ${color}${req.method}\x1b[0m ${req.originalUrl} → ${status} (${duration}ms)`);
  });

  next();
}

/**
 * Error Handler Middleware
 * Catches unhandled errors and returns consistent error responses
 */
function errorHandler(err, req, res, next) {
  console.error('\x1b[31m  ✖ Error:\x1b[0m', err.message);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * Not Found Handler
 * Returns 404 for unmatched routes
 */
function notFound(req, res) {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: [
      'GET  /api/health',
      'GET  /api/products',
      'GET  /api/products/search?q=...',
      'GET  /api/products/:id',
      'POST /api/products',
      'GET  /api/cart',
      'POST /api/cart',
      'PATCH /api/cart/:id',
      'DELETE /api/cart/:id',
      'GET  /api/chat/history',
      'POST /api/chat',
      'POST /api/size/recommend',
    ],
  });
}

module.exports = { requestLogger, errorHandler, notFound };
