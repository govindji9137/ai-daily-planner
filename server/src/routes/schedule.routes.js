'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/schedule.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = Router();

// All schedule routes require authentication
router.use(authenticate);
router.use(apiLimiter);

// GET /api/schedule?date=YYYY-MM-DD
router.get('/', ctrl.getSchedule);

// GET /api/schedule/history
router.get('/history', ctrl.getHistory);

// PUT /api/schedule
router.put('/', [
  body('slots').isArray({ min: 1 }).withMessage('Slots must be a non-empty array.'),
  body('date').optional().isISO8601().withMessage('Date must be ISO 8601 format.'),
  validate,
], ctrl.saveSchedule);

// POST /api/schedule/generate
router.post('/generate', [
  body('prompt').optional().isString().withMessage('Prompt must be a string.'),
  validate,
], ctrl.generateSchedule);

// GET /api/schedule/plans?date=YYYY-MM-DD
router.get('/plans', ctrl.getPlans);

// PUT /api/schedule/plans/:id/default
router.put('/plans/:id/default', [
  body('date').isISO8601().withMessage('Date must be ISO 8601 format.'),
  validate,
], ctrl.setDefaultPlan);

module.exports = router;
