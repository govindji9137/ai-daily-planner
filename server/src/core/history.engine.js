'use strict';

const prisma = require('../config/database');

/**
 * GeoPlaner - History Engine
 * 
 * Responsible for maintaining a permanent timeline of user productivity.
 * History should never be overwritten. Every important action is preserved.
 */
class HistoryEngine {
  
  /**
   * Log an event to the History timeline.
   * 
   * @param {string} userId - ID of the user
   * @param {string} action - e.g. 'TASK_COMPLETED', 'PLANNER_GENERATED'
   * @param {string} entityId - ID of the related task, schedule, etc.
   * @param {string} entityType - 'Task', 'Schedule', 'Goal'
   * @param {object} details - Additional JSON data to store
   */
  static async logEvent(userId, action, entityId = null, entityType = null, details = null) {
    try {
      const log = await prisma.historyLog.create({
        data: {
          userId,
          action,
          entityId,
          entityType,
          details: details ? details : undefined
        }
      });
      return log;
    } catch (error) {
      console.error(`[HistoryEngine] Failed to log event ${action} for user ${userId}:`, error);
      // We don't want history tracking to break the main application flow
    }
  }

  /**
   * Retrieve history for a user
   */
  static async getHistoryTimeline(userId, limit = 100, offset = 0) {
    return prisma.historyLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
  }
}

module.exports = HistoryEngine;
