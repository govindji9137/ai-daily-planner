'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/rateLimiter');
const ctrl = require('../controllers/module.controller');

const router = Router();

router.use(authenticate);
router.use(apiLimiter);

// GET /api/modules — get user's module preferences
router.get('/', ctrl.getModules);

// PUT /api/modules — bulk upsert module preferences (onboarding / settings)
router.put('/', ctrl.saveModules);

// PATCH /api/modules/:moduleId — toggle a single module
router.patch('/:moduleId', ctrl.toggleModule);

// DELETE /api/modules — reset all module preferences
router.delete('/', ctrl.resetModules);

module.exports = router;
