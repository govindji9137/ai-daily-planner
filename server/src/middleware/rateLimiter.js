'use strict';

const rateLimit = require('express-rate-limit');

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
  });

// Strict limit for auth endpoints (prevents brute-force)
const authLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // Bumped to 100 for local testing
  'Too many authentication attempts. Please try again in 15 minutes.'
);

// General API limit
const apiLimiter = createLimiter(
  60 * 1000, // 1 minute
  60,
  'Too many requests. Please slow down.'
);

module.exports = { authLimiter, apiLimiter };
