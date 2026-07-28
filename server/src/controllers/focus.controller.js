'use strict';

const prisma = require('../config/database');

/**
 * Log a completed FocusSession to the database.
 * This is called when the FocusTimer stops or completes.
 */
const logSession = async (req, res, next) => {
  try {
    const { taskId, duration, type, notes } = req.body;
    const userId = req.user.id;

    if (duration === undefined || typeof duration !== 'number') {
      const err = new Error('Duration must be a number.');
      err.status = 400;
      throw err;
    }

    const session = await prisma.focusSession.create({
      data: {
        userId,
        taskId: taskId || null,
        duration,
        type: type || 'pomodoro',
        notes: notes || null,
      }
    });

    // If there is a task, update its actualDuration incrementally
    if (taskId) {
      await prisma.task.update({
        where: { id: taskId, userId }, // Ensure user owns the task
        data: {
          actualDuration: { increment: duration }
        }
      });
    }

    res.status(201).json({ success: true, session });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all focus sessions for the authenticated user, optionally filtered by task or date range.
 */
const getSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { taskId, limit = 50 } = req.query;

    const where = { userId };
    if (taskId) where.taskId = taskId;

    const sessions = await prisma.focusSession.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: parseInt(limit),
      include: {
        task: {
          select: { title: true, type: true }
        }
      }
    });

    res.json({ success: true, sessions });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  logSession,
  getSessions
};
