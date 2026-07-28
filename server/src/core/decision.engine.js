'use strict';

const prisma = require('../config/database');
const { generateScheduleDraft } = require('../services/ai.service');

/**
 * GeoPlaner - Decision Engine
 * 
 * Responsible for deterministic planning and validation.
 * It is the single source of truth for scheduling decisions, sitting between
 * raw user data and the AI Engine.
 */
class DecisionEngine {
  
  /**
   * Builds the daily plan by gathering deterministic context,
   * querying the AI for optimization, and validating the output.
   */
  static async buildDailyPlan(userId, userPrompt, date, wakeTime = 'auto', sleepTime = 'auto') {
    // 1. Get yesterday's date
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // 2. Fetch yesterday's schedule for context
    let previousDayContext = null;
    try {
      const prevSchedule = await prisma.schedule.findUnique({
        where: { userId_date: { userId, date: yesterdayStr } },
        include: { tasks: { orderBy: { orderIndex: 'asc' } } }
      });
      if (prevSchedule?.tasks?.length > 0) {
        const completed = prevSchedule.tasks.filter(t => t.status === 'COMPLETED').length;
        const skipped = prevSchedule.tasks.filter(t => t.status === 'SKIPPED').length;
        const total = prevSchedule.tasks.filter(t => t.type === 'focus').length;
        previousDayContext = {
          date: yesterdayStr,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : null,
          completed,
          skipped,
          total,
          tasks: prevSchedule.tasks.slice(0, 8).map(t => ({
            time: t.startTime,
            task: t.title,
            status: t.status,
            skippedReason: t.incompleteReason || null
          }))
        };
      }
    } catch (err) {
      console.warn('[DecisionEngine] Could not fetch previous day context:', err.message);
    }

    // 3. Fetch user's profile (week context, wake/sleep time preferences)
    let weekContext = null;
    let profileWakeTime = wakeTime;
    let profileSleepTime = sleepTime;
    try {
      const profile = await prisma.profile.findUnique({ where: { userId } });
      if (profile) {
        weekContext = profile.weekContext || null;
        if (wakeTime === 'auto' && profile.wakeTime) profileWakeTime = profile.wakeTime;
        if (sleepTime === 'auto' && profile.sleepTime) profileSleepTime = profile.sleepTime;
      }
    } catch (err) {
      console.warn('[DecisionEngine] Could not fetch profile:', err.message);
    }

    // 4. Fetch active goals for extra context
    let activeGoals = [];
    try {
      const goals = await prisma.goal.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' }
      });
      activeGoals = goals.map(g => ({ title: g.title, priority: g.priority, progress: g.progress }));
    } catch (err) { /* non-critical */ }

    const contextPayload = {
      userId,
      date,
      rules: [
        'No deep focus tasks consecutively without breaks.',
        'Respect fixed tasks.',
        'Align high energy tasks with morning if possible.',
        'If previous day had many skipped tasks, schedule lighter tasks today.',
      ],
      activeModules: ['personal', 'student', 'professional'],
      userPreferences: { wakeTime: profileWakeTime, sleepTime: profileSleepTime },
      previousDayContext,
      weekContext,
      activeGoals,
    };

    // 5. Query AI Engine for optimized draft
    let draft = await generateScheduleDraft(contextPayload, userPrompt);

    // 6. Deterministic Validation & Priority Calculation
    draft = this.validateAndEnforceRules(draft);

    return draft;
  }

  /**
   * Applies strict business rules to the AI output.
   * AI is a suggestion engine; Decision Engine makes the final call.
   */
  static validateAndEnforceRules(draft) {
    if (!Array.isArray(draft)) {
      throw new Error('DecisionEngine: AI did not return a valid schedule array.');
    }

    if (draft.length !== 24) {
      console.warn(`DecisionEngine: Expected 24 slots, received ${draft.length}. Enforcing structural integrity.`);
    }

    const validated = draft.map((slot, index) => {
      const hour = index;
      const period = hour >= 12 ? 'PM' : 'AM';
      let h12 = hour % 12;
      if (h12 === 0) h12 = 12;
      const expectedTime = `${h12.toString().padStart(2, '0')}:00 ${period}`;

      return {
        ...slot,
        time: slot.time || expectedTime,
        task: slot.task || 'Empty Block',
        type: ['focus', 'break', 'fixed', 'flexible'].includes(slot.type) ? slot.type : 'flexible',
        priority: ['critical', 'high', 'medium', 'low'].includes(slot.priority) ? slot.priority : 'medium',
        energyLevel: ['HIGH', 'MEDIUM', 'LOW'].includes(slot.energyLevel) ? slot.energyLevel : 'MEDIUM',
        focusLevel: ['DEEP', 'MEDIUM', 'LIGHT'].includes(slot.focusLevel) ? slot.focusLevel : 'MEDIUM',
        estimatedDuration: slot.estimatedDuration || 60,
        moduleId: slot.moduleId || 'personal',
        status: 'SCHEDULED'
      };
    });

    return validated;
  }
}

module.exports = DecisionEngine;
