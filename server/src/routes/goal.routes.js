'use strict';

const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goal.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', goalController.getGoals);
router.post('/', goalController.createGoal);
router.put('/:id', goalController.updateProgress);

module.exports = router;
