'use strict';

const prisma = require('../config/database');

/**
 * Goal Engine
 * Part 10 of Master Spec: Tracks long term goals, syncs with tasks.
 */
class GoalEngine {
  /**
   * Create a new goal
   */
  static async createGoal(userId, data) {
    return prisma.goal.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        category: data.category,
        moduleId: data.moduleId,
        priority: data.priority || 'medium',
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
      },
    });
  }

  /**
   * Get all goals for a user
   */
  static async getGoals(userId, moduleId = null) {
    const where = { userId };
    if (moduleId) where.moduleId = moduleId;

    return prisma.goal.findMany({
      where,
      orderBy: { targetDate: 'asc' },
    });
  }

  /**
   * Update goal progress
   */
  static async updateProgress(goalId, progress) {
    return prisma.goal.update({
      where: { id: goalId },
      data: { progress },
    });
  }
}

module.exports = GoalEngine;
