'use strict';

const { Router } = require('express');
const ctrl = require('../controllers/profile.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = Router();

router.use(authenticate);
router.use(apiLimiter);

// GET /api/profile
router.get('/', ctrl.getProfile);

// PUT /api/profile
router.put('/', ctrl.updateProfile);

module.exports = router;
