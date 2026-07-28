'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimiter');

const router = Router();

// Password strength validator (reused)
const passwordRules = body('password')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
  .matches(/[A-Z]/).withMessage('Must contain an uppercase letter.')
  .matches(/[a-z]/).withMessage('Must contain a lowercase letter.')
  .matches(/[0-9]/).withMessage('Must contain a number.')
  .matches(/[^A-Za-z0-9]/).withMessage('Must contain a special character.');

// POST /api/auth/signup
router.post('/signup', authLimiter, [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
  passwordRules,
  body('confirmPassword').custom((val, { req }) => {
    if (val !== req.body.password) throw new Error('Passwords do not match.');
    return true;
  }),
  validate,
], ctrl.signup);

// POST /api/auth/verify-email
router.post('/verify-email', authLimiter, [
  body('token').notEmpty().withMessage('Verification token required.'),
  validate,
], ctrl.verifyEmail);

// POST /api/auth/resend-verification
router.post('/resend-verification', authLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
  validate,
], ctrl.resendVerification);

// POST /api/auth/login
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
  body('password').notEmpty().withMessage('Password required.'),
  validate,
], ctrl.login);

// POST /api/auth/refresh (uses httpOnly cookie — no body validation needed)
router.post('/refresh', ctrl.refresh);

// POST /api/auth/logout
router.post('/logout', ctrl.logout);

// GET /api/auth/me (protected)
router.get('/me', authenticate, ctrl.me);

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
  validate,
], ctrl.forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', authLimiter, [
  body('token').notEmpty().withMessage('Reset token required.'),
  passwordRules,
  validate,
], ctrl.resetPassword);

module.exports = router;
