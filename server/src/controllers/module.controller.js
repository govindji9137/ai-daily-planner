'use strict';

const moduleService = require('../services/module.service');

// GET /api/modules
const getModules = async (req, res, next) => {
  try {
    const modules = await moduleService.getUserModules(req.user.id);
    res.json({ success: true, data: modules });
  } catch (err) {
    next(err);
  }
};

// PUT /api/modules — bulk save (used during onboarding + settings)
const saveModules = async (req, res, next) => {
  try {
    const { modules } = req.body;
    if (!Array.isArray(modules)) {
      return res.status(400).json({ success: false, message: 'modules must be an array.' });
    }
    const result = await moduleService.saveUserModules(req.user.id, modules);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/modules/:moduleId — toggle single module
const toggleModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ success: false, message: 'enabled must be a boolean.' });
    }
    const result = await moduleService.toggleModule(req.user.id, moduleId, enabled);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/modules — reset all to defaults
const resetModules = async (req, res, next) => {
  try {
    await moduleService.resetUserModules(req.user.id);
    res.json({ success: true, message: 'Module preferences reset.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getModules, saveModules, toggleModule, resetModules };
