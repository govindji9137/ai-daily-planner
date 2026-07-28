'use strict';

const prisma = require('../config/database');

const VALID_MODULES = new Set(['personal', 'student', 'health', 'professional', 'creator']);

/**
 * Get all module preferences for a user.
 * Returns them ordered by priority ASC.
 */
const getUserModules = async (userId) => {
  return prisma.userModule.findMany({
    where: { userId },
    orderBy: { priority: 'asc' },
  });
};

/**
 * Save/update module preferences for a user.
 * Accepts an array of { moduleId, enabled, priority, settings? }
 */
const saveUserModules = async (userId, modules) => {
  const ops = modules
    .filter((m) => VALID_MODULES.has(m.moduleId))
    .map((m) =>
      prisma.userModule.upsert({
        where: { userId_moduleId: { userId, moduleId: m.moduleId } },
        update: {
          enabled:  m.enabled  ?? true,
          priority: m.priority ?? 0,
          settings: m.settings ?? undefined,
        },
        create: {
          userId,
          moduleId: m.moduleId,
          enabled:  m.enabled  ?? true,
          priority: m.priority ?? 0,
          settings: m.settings ?? null,
        },
      })
    );
  return prisma.$transaction(ops);
};

/**
 * Toggle a single module's enabled state.
 */
const toggleModule = async (userId, moduleId, enabled) => {
  if (!VALID_MODULES.has(moduleId)) {
    const err = new Error('Invalid module ID.');
    err.status = 400;
    throw err;
  }
  return prisma.userModule.upsert({
    where: { userId_moduleId: { userId, moduleId } },
    update:  { enabled },
    create:  { userId, moduleId, enabled, priority: 0 },
  });
};

/**
 * Delete all module preferences for a user (reset).
 */
const resetUserModules = async (userId) => {
  return prisma.userModule.deleteMany({ where: { userId } });
};

module.exports = { getUserModules, saveUserModules, toggleModule, resetUserModules };
