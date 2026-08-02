'use strict';

const cron = require('node-cron');
const prisma = require('../config/database');
const DecisionEngine = require('../core/decision.engine');
const scheduleService = require('../services/schedule.service');
const HistoryEngine = require('../core/history.engine');
const logger = require('../utils/logger');

/**
 * Auto-Planner Job
 * 
 * Runs every day at 4:00 AM server time.
 * For every active user, auto-generates a fresh morning plan
 * using their weekContext, previous day's analytics, and the default prompt.
 * This will save as the new default plan for the day.
 */

const today = () => new Date().toISOString().split('T')[0];

const runAutoPlanner = async () => {
  const date = today();
  logger.info(`[AutoPlanner] Running auto-plan generation for date: ${date}`);

  try {
    // 1. Get all active verified users
    const allUsers = await prisma.user.findMany({
      select: { id: true, name: true },
      where: { isVerified: true }
    });

    logger.info(`[AutoPlanner] ${allUsers.length} users will receive a new plan.`);

    // 2. For each user, generate a plan
    for (const user of allUsers) {
      try {
        // Fetch their profile for wakeTime/sleepTime preferences
        const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
        const wakeTime = profile?.wakeTime || 'auto';
        const sleepTime = profile?.sleepTime || 'auto';
        const weekContext = profile?.weekContext;

        const autoPrompt = weekContext
          ? `Auto-generated daily morning plan. Weekly context: ${weekContext.substring(0, 300)}. Please consider yesterday's analytics to optimize today's schedule.`
          : 'Auto-generated daily morning plan. Optimize for a balanced and productive day considering yesterday\'s analytics.';

        // DecisionEngine automatically pulls yesterday's analytics internally.
        const slots = await DecisionEngine.buildDailyPlan(user.id, autoPrompt, date, wakeTime, sleepTime);
        
        // This will save the plan and set it as the new default for the day
        await scheduleService.createScheduleVariation(user.id, slots, date, autoPrompt);
        
        await HistoryEngine.logEvent(user.id, 'AUTO_PLAN_GENERATED', null, 'Schedule', { date, triggeredBy: 'cron_4:00am' });
        logger.info(`[AutoPlanner] ✅ Generated plan for user ${user.id} (${user.name})`);
      } catch (err) {
        logger.error(`[AutoPlanner] ❌ Failed for user ${user.id}: ${err.message}`);
      }
    }

    logger.info(`[AutoPlanner] Done. Generated ${allUsers.length} plans.`);
  } catch (err) {
    logger.error(`[AutoPlanner] Fatal error: ${err.message}`);
  }
};

// Schedule: every day at 4:00 AM
cron.schedule('0 4 * * *', runAutoPlanner, {
  scheduled: true,
  timezone: 'Asia/Kolkata' // IST — adjust as needed
});

logger.info('[AutoPlanner] Cron job registered: runs daily at 4:00 AM IST.');

module.exports = { runAutoPlanner }; // exported for manual testing
