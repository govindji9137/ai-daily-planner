'use strict';

const logger = require('../utils/logger');

/**
 * Global error handler — must be registered last.
 */
const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error.';

  if (status >= 500) {
    logger.error(`${req.method} ${req.path} → ${status} ${message}`, { stack: err.stack });
  } else {
    logger.warn(`${req.method} ${req.path} → ${status} ${message}`);
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 handler for unmatched routes.
 */
const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
};

module.exports = { errorHandler, notFound };
