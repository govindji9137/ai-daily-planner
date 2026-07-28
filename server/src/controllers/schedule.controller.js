'use strict';

const scheduleService = require('../services/schedule.service');

// GET /api/schedule?date=2026-07-17
const getSchedule = async (req, res, next) => {
  try {
    const date = req.query.date || undefined;
    const record = await scheduleService.getSchedule(req.user.id, date);
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

// GET /api/schedule/history
const getHistory = async (req, res, next) => {
  try {
    const records = await scheduleService.getHistory(req.user.id);
    res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
};

// PUT /api/schedule
const saveSchedule = async (req, res, next) => {
  try {
    const { slots, date, promptUsed } = req.body;
    const record = await scheduleService.saveSchedule(req.user.id, slots, date, promptUsed);
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

// POST /api/schedule/generate
const generateSchedule = async (req, res, next) => {
  try {
    const { prompt, wakeTime, sleepTime } = req.body;
    const slots = await scheduleService.generateSchedule(req.user.id, prompt, wakeTime, sleepTime);
    res.json({ success: true, data: slots });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSchedule, getHistory, saveSchedule, generateSchedule };
