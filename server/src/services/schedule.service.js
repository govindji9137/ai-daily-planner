'use strict';

const prisma = require('../config/database');
const DecisionEngine = require('../core/decision.engine');
const HistoryEngine = require('../core/history.engine');

const today = () => new Date().toISOString().split('T')[0];

/**
 * Get the schedule and its tasks for a given date.
 */
const getSchedule = async (userId, date = today()) => {
  const record = await prisma.schedule.findUnique({
    where: { userId_date: { userId, date } },
    include: {
      tasks: {
        orderBy: { orderIndex: 'asc' }
      }
    }
  });

  if (!record) return null;

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
    where: { userId },
    orderBy: { date: 'desc' },
    include: { tasks: true }
  });
};

/**
 * Upsert the schedule and replace all tasks (Batch Save).
 * This mimics the old JSON behavior for now.
 */
const saveSchedule = async (userId, slots, date = today(), promptUsed = null) => {
  // 1. Upsert the parent schedule
  const schedule = await prisma.schedule.upsert({
    where: { userId_date: { userId, date } },
    update: { promptUsed },
    create: { userId, date, promptUsed },
  });

  // 2. Delete existing tasks for this schedule
  await prisma.task.deleteMany({
    where: { scheduleId: schedule.id }
  });

  // 3. Create new tasks from slots
  if (slots && slots.length > 0) {
    await prisma.task.createMany({
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

  // Log to history
  await HistoryEngine.logEvent(userId, 'SCHEDULE_SAVED', schedule.id, 'Schedule', { date, slotCount: slots?.length || 0 });

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
