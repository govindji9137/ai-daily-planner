'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/focus.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = Router();

router.use(authenticate);
router.use(apiLimiter);

// POST /api/focus
router.post('/', [
  body('duration').isNumeric().withMessage('Duration is required and must be a number.'),
  body('taskId').optional().isString(),
  body('type').optional().isString(),
  body('notes').optional().isString(),
  validate,
], ctrl.logSession);

// GET /api/focus
router.get('/', ctrl.getSessions);

module.exports = router;
