'use strict';

const prisma = require('../config/database');
const DecisionEngine = require('../core/decision.engine');
const HistoryEngine = require('../core/history.engine');

const today = () => new Date().toISOString().split('T')[0];

/**
 * Get the current default schedule and its tasks for a given date.
 */
const getSchedule = async (userId, date = today()) => {
  let record = await prisma.schedule.findFirst({
    where: { userId, date, isDefault: true },
    include: {
      tasks: {
        orderBy: { orderIndex: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Fallback: If no default schedule exists, but a non-default one does, make the most recent one default.
  if (!record) {
    const fallbackRecord = await prisma.schedule.findFirst({
      where: { userId, date },
      orderBy: { createdAt: 'desc' },
      include: {
        tasks: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    if (fallbackRecord) {
      record = await prisma.schedule.update({
        where: { id: fallbackRecord.id },
        data: { isDefault: true },
        include: {
          tasks: {
            orderBy: { orderIndex: 'asc' }
          }
        }
      });
    } else {
      return null;
    }
  }

  // Map new Task model to old frontend slot shape temporarily
  return {
    ...record,
    slots: record.tasks.map(t => ({
      id: t.id,
      time: t.startTime,
      task: t.title,
      type: t.type,
      priority: t.priority,
      category: t.category,
      moduleId: t.moduleId,
      status: t.status,
      estimatedDuration: t.estimatedDuration,
      actualDuration: t.actualDuration,
      energyLevel: t.energyLevel,
      focusLevel: t.focusLevel,
      deadline: t.deadline,
      incompleteReason: t.incompleteReason || '',
      notes: t.notes || '',
      expanded: false
    }))
  };
};

/**
 * Get all historical schedules for a user.
 */
const getHistory = async (userId) => {
  return prisma.schedule.findMany({
    where: { userId, isDefault: true },
    orderBy: { date: 'desc' },
    include: { tasks: true }
  });
};

/**
 * Get all generated plan variations for a specific date.
 */
const getPlansForDate = async (userId, date = today()) => {
  return prisma.schedule.findMany({
    where: { userId, date },
    orderBy: { createdAt: 'desc' },
    include: { tasks: true }
  });
};

/**
 * Set a specific plan variation as the active/default one for that day.
 */
const setDefaultPlan = async (userId, scheduleId, date) => {
  await prisma.$transaction([
    prisma.schedule.updateMany({
      where: { userId, date },
      data: { isDefault: false }
    }),
    prisma.schedule.updateMany({
      where: { id: scheduleId, userId },
      data: { isDefault: true }
    })
  ]);
  
  await HistoryEngine.logEvent(userId, 'SCHEDULE_DEFAULT_CHANGED', scheduleId, 'Schedule', { date });
  return getSchedule(userId, date);
};

/**
 * Update the current default schedule (used for ticking off tasks or saving edits).
 */
const saveSchedule = async (userId, slots, date = today(), promptUsed = null) => {
  const scheduleId = await prisma.$transaction(async (tx) => {
    let schedule = await tx.schedule.findFirst({
      where: { userId, date, isDefault: true }
    });

    if (!schedule) {
      await tx.schedule.updateMany({
        where: { userId, date },
        data: { isDefault: false }
      });
      schedule = await tx.schedule.create({
        data: { userId, date, promptUsed, isDefault: true }
      });
    } else if (promptUsed) {
      schedule = await tx.schedule.update({
        where: { id: schedule.id },
        data: { promptUsed }
      });
    }

    await tx.task.deleteMany({ where: { scheduleId: schedule.id } });

    if (slots && slots.length > 0) {
      await tx.task.createMany({
        data: slots.map((s, index) => ({
          userId,
          scheduleId: schedule.id,
          title: s.task,
          type: s.type || 'fixed',
          priority: s.priority || 'medium',
          moduleId: s.moduleId || 'personal',
          startTime: s.time,
          orderIndex: index,
          date: date,
          status: s.status || 'SCHEDULED',
          estimatedDuration: s.estimatedDuration || 60,
          actualDuration: s.actualDuration || 0,
          energyLevel: s.energyLevel || 'MEDIUM',
          focusLevel: s.focusLevel || 'MEDIUM',
          incompleteReason: s.incompleteReason || null,
          notes: s.notes || null
        }))
      });
    }

    await HistoryEngine.logEvent(userId, 'SCHEDULE_SAVED', schedule.id, 'Schedule', { date, slotCount: slots?.length || 0 }, tx);
    
    return schedule.id;
  });

  return getSchedule(userId, date);
};

/**
 * Create a brand new schedule variation and set it as the default (used by AI generation).
 */
const createScheduleVariation = async (userId, slots, date = today(), promptUsed = null) => {
  const scheduleId = await prisma.$transaction(async (tx) => {
    await tx.schedule.updateMany({
      where: { userId, date },
      data: { isDefault: false }
    });

    const schedule = await tx.schedule.create({
      data: { userId, date, promptUsed, isDefault: true }
    });

    if (slots && slots.length > 0) {
      await tx.task.createMany({
        data: slots.map((s, index) => ({
          userId,
          scheduleId: schedule.id,
          title: s.task,
          type: s.type || 'fixed',
          priority: s.priority || 'medium',
          moduleId: s.moduleId || 'personal',
          startTime: s.time,
          orderIndex: index,
          date: date,
          status: s.status || 'SCHEDULED',
          estimatedDuration: s.estimatedDuration || 60,
          actualDuration: s.actualDuration || 0,
          energyLevel: s.energyLevel || 'MEDIUM',
          focusLevel: s.focusLevel || 'MEDIUM',
          incompleteReason: s.incompleteReason || null,
          notes: s.notes || null
        }))
      });
    }

    await HistoryEngine.logEvent(userId, 'SCHEDULE_GENERATED_VARIATION', schedule.id, 'Schedule', { date, slotCount: slots?.length || 0 }, tx);
    return schedule.id;
  });

  return getSchedule(userId, date);
};

/**
 * Generate a 24-hour schedule via the Decision Engine.
 */
const generateSchedule = async (userId, userPrompt, wakeTime, sleepTime) => {
  const slots = await DecisionEngine.buildDailyPlan(userId, userPrompt, today(), wakeTime, sleepTime);
  await createScheduleVariation(userId, slots, today(), userPrompt);
  await HistoryEngine.logEvent(userId, 'PLANNER_GENERATED', null, 'Schedule', { date: today(), prompt: userPrompt, slotCount: slots.length });
  return slots;
};

module.exports = { getSchedule, getHistory, saveSchedule, createScheduleVariation, generateSchedule, getPlansForDate, setDefaultPlan };
