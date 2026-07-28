/**
 * GeoPlaner V2 — Health Module
 *
 * Provides health and wellness tracking features.
 * Optionally connects to GeoHealth.
 * Works fully without GeoHealth.
 */
import React from 'react';
import { registerModule } from '../registry';
import { createTask, TASK_TYPE, TASK_PRIORITY, MODULE_ID } from '../../shared/models/task.model';
import HealthDashboardWidget from './HealthDashboard';
import { HealthTracker } from './HealthPages';

const MODULE = { id: MODULE_ID.HEALTH, name: 'Health', icon: '💪', colorKey: 'health' };

// ─── AI Context ───────────────────────────────────────────────────────────────
const getAIContext = () => `
[HEALTH MODULE]
You are also a health and wellness coach.
Help the user schedule workouts, meals, hydration, sleep, and medication.
Respect recovery time between workouts.
Prioritize sleep consistency — suggest consistent sleep/wake times.
Remind the user that health tasks are high priority for long-term productivity.
`.trim();

const getWidgets = () => [{ id: 'health-overview', component: HealthDashboardWidget, fullWidth: false, order: 20 }];
const getNavItems = () => [{ id: 'health-tracker', label: 'Health Today', icon: '💊', colorKey: 'health' }];
const getPages = () => [{ id: 'health-tracker', component: HealthTracker }];
const getAnalyticsMetrics = () => [
  { moduleColorKey: MODULE.colorKey, moduleIcon: MODULE.icon, moduleName: MODULE.name, label: 'Workouts This Week', value: '0', color: 'var(--module-health)', description: 'Track your weekly workout consistency' },
];
const getTaskTemplates = () => [
  createTask({ title: 'Workout',      taskType: TASK_TYPE.PREFERRED, priority: TASK_PRIORITY.HIGH,     duration: 60, module: MODULE_ID.HEALTH, category: 'workout', preferredTime: '06:00 PM' }),
  createTask({ title: 'Meal Prep',    taskType: TASK_TYPE.PREFERRED, priority: TASK_PRIORITY.MEDIUM,   duration: 45, module: MODULE_ID.HEALTH, category: 'nutrition' }),
  createTask({ title: 'Meditation',   taskType: TASK_TYPE.OPTIONAL,  priority: TASK_PRIORITY.LOW,      duration: 15, module: MODULE_ID.HEALTH, category: 'mindfulness' }),
  createTask({ title: 'Sleep',        taskType: TASK_TYPE.FIXED,     priority: TASK_PRIORITY.CRITICAL, duration: 480, module: MODULE_ID.HEALTH, category: 'sleep', preferredTime: '11:00 PM' }),
  createTask({ title: 'Take Medicine', taskType: TASK_TYPE.FIXED,    priority: TASK_PRIORITY.CRITICAL, duration: 5,  module: MODULE_ID.HEALTH, category: 'medication' }),
];

registerModule({
  id: MODULE_ID.HEALTH, name: MODULE.name, icon: MODULE.icon, color: 'var(--module-health)', colorKey: MODULE.colorKey,
  description: 'Workout, water, sleep, and medication tracking with optional GeoHealth integration.',
  alwaysEnabled: false, getAIContext, getWidgets, getNavItems, getPages, getAnalyticsMetrics, getTaskTemplates,
  integrations: { geohealth: { id: 'geohealth', name: 'GeoHealth', description: 'Connect to GeoHealth for full health analytics.', optional: true, isConnected: () => false, connect: async () => { throw new Error('Not yet implemented.'); }, disconnect: async () => {} } },
});
export default MODULE_ID.HEALTH;
