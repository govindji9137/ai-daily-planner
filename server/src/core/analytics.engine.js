'use strict';

const prisma = require('../config/database');

/**
 * Analytics Engine
 * Part 10 of Master Spec: Calculates completion rates, module usage, optimal times.
 */

class AnalyticsEngine {
  /**
   * Get basic productivity summary for a date range
   */
  static async getSummary(userId, startDate, endDate) {
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const skipped = tasks.filter(t => t.status === 'SKIPPED').length;

    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      totalTasks: total,
      completedTasks: completed,
      skippedTasks: skipped,
      completionRate: Math.round(completionRate),
    };
  }

  /**
   * Get focus session analytics
   */
  static async getFocusStats(userId, startDate, endDate) {
    const sessions = await prisma.focusSession.findMany({
      where: {
        userId,
        startedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    });

    const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const deepWorkMinutes = sessions
      .filter(s => s.type === 'pomodoro')
      .reduce((acc, s) => acc + (s.duration || 0), 0);

    return {
      totalFocusMinutes: totalMinutes,
      deepWorkMinutes,
      sessionCount: sessions.length,
    };
  }

  /**
   * Analyze optimal working hours based on completed task times
   */
  static async getOptimalWorkingHours(userId) {
    // A real implementation would group completed tasks by hour of day
    // For now, return a placeholder static insight
    return {
      peakProductivityTime: '10:00 AM',
      lowestProductivityTime: '3:00 PM',
      insight: 'You complete 30% more tasks in the morning.'
    };
  }
}

module.exports = AnalyticsEngine;
