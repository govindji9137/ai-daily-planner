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
    prisma.schedule.update({
      where: { id: scheduleId, userId },
      data: { isDefault: true }
    })
  ]);
  
  await HistoryEngine.logEvent(userId, 'SCHEDULE_DEFAULT_CHANGED', scheduleId, 'Schedule', { date });
  return getSchedule(userId, date);
};

/**
 * Create a new schedule variation and set it as the default.
 */
const saveSchedule = async (userId, slots, date = today(), promptUsed = null) => {
  const scheduleId = await prisma.$transaction(async (tx) => {
    // 1. Set all existing schedules for this date to non-default
    await tx.schedule.updateMany({
      where: { userId, date },
      data: { isDefault: false }
    });

    // 2. Create the new schedule as default
    const schedule = await tx.schedule.create({
      data: {
        userId,
        date,
        promptUsed,
        isDefault: true
      }
    });

    // 3. Create new tasks from slots
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

    // Log to history within transaction
    await HistoryEngine.logEvent(userId, 'SCHEDULE_SAVED', schedule.id, 'Schedule', { date, slotCount: slots?.length || 0 }, tx);
    
    return schedule.id;
  });

  return getSchedule(userId, date);
};

/**
 * Generate a 24-hour schedule via the Decision Engine.
 */
const generateSchedule = async (userId, userPrompt, wakeTime, sleepTime) => {
  // 1. Delegate strictly to the Decision Engine (SRS Part 2)
  const slots = await DecisionEngine.buildDailyPlan(userId, userPrompt, today(), wakeTime, sleepTime);

  // 2. Persist the generated schedule via the new relational setup
  await saveSchedule(userId, slots, today(), userPrompt);

  // 3. Log plan generation to history
  await HistoryEngine.logEvent(userId, 'PLANNER_GENERATED', null, 'Schedule', { date: today(), prompt: userPrompt, slotCount: slots.length });

  return slots;
};

module.exports = { getSchedule, getHistory, saveSchedule, generateSchedule };
