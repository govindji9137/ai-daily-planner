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
 * Runs every day at 3:50 AM server time.
 * For every active user who does NOT already have a schedule for today,
 * auto-generates one using their weekContext and the default prompt.
 */

const today = () => new Date().toISOString().split('T')[0];

const runAutoPlanner = async () => {
  const date = today();
  logger.info(`[AutoPlanner] Running auto-plan generation for date: ${date}`);

  try {
    // 1. Find all users who do NOT have a schedule for today
    const usersWithSchedule = await prisma.schedule.findMany({
      where: { date },
      select: { userId: true }
    });
    const existingUserIds = new Set(usersWithSchedule.map(s => s.userId));

    // 2. Get all users
    const allUsers = await prisma.user.findMany({
      select: { id: true, name: true },
      where: { isVerified: true }
    });

    const usersNeedingPlan = allUsers.filter(u => !existingUserIds.has(u.id));
    logger.info(`[AutoPlanner] ${usersNeedingPlan.length} users need auto-plan out of ${allUsers.length} total.`);

    // 3. For each user, generate a plan
    for (const user of usersNeedingPlan) {
      try {
        // Fetch their profile for wakeTime/sleepTime preferences
        const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
        const wakeTime = profile?.wakeTime || 'auto';
        const sleepTime = profile?.sleepTime || 'auto';
        const weekContext = profile?.weekContext;

        const autoPrompt = weekContext
          ? `Auto-generated daily plan. Weekly context: ${weekContext.substring(0, 300)}`
          : 'Auto-generated daily plan. Optimize for a balanced and productive day.';

        const slots = await DecisionEngine.buildDailyPlan(user.id, autoPrompt, date, wakeTime, sleepTime);
        await scheduleService.saveSchedule(user.id, slots, date, autoPrompt);
        
        await HistoryEngine.logEvent(user.id, 'AUTO_PLAN_GENERATED', null, 'Schedule', { date, triggeredBy: 'cron_3:50am' });
        logger.info(`[AutoPlanner] ✅ Generated plan for user ${user.id} (${user.name})`);
      } catch (err) {
        logger.error(`[AutoPlanner] ❌ Failed for user ${user.id}: ${err.message}`);
      }
    }

    logger.info(`[AutoPlanner] Done. Generated ${usersNeedingPlan.length} plans.`);
  } catch (err) {
    logger.error(`[AutoPlanner] Fatal error: ${err.message}`);
  }
};

// Schedule: every day at 3:50 AM
cron.schedule('50 3 * * *', runAutoPlanner, {
  scheduled: true,
  timezone: 'Asia/Kolkata' // IST — adjust as needed
});

logger.info('[AutoPlanner] Cron job registered: runs daily at 3:50 AM IST.');

module.exports = { runAutoPlanner }; // exported for manual testing
