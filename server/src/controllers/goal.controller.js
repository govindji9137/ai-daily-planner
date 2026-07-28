'use strict';

const GoalEngine = require('../services/goal.engine');

const getGoals = async (req, res, next) => {
  try {
    const goals = await GoalEngine.getGoals(req.user.id, req.query.moduleId);
    res.json({ success: true, data: goals });
  } catch (error) {
    next(error);
  }
};

const createGoal = async (req, res, next) => {
  try {
    const goal = await GoalEngine.createGoal(req.user.id, req.body);
    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    next(error);
  }
};

const updateProgress = async (req, res, next) => {
  try {
    const goal = await GoalEngine.updateProgress(req.params.id, req.body.progress);
    res.json({ success: true, data: goal });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGoals,
  createGoal,
  updateProgress,
};
