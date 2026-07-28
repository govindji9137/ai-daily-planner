'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = Router();

router.use(authenticate);
router.use(apiLimiter);

// POST /api/chat
router.post('/', [
  body('message').notEmpty().withMessage('Message is required.'),
  body('history').optional().isArray(),
  validate,
], ctrl.chat);

module.exports = router;
