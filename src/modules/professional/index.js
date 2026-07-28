/**
 * GeoPlaner V2 — Professional Module
 *
 * Provides work and project management features.
 * Optionally connects to Google Calendar.
 */
import React from 'react';
import { registerModule } from '../registry';
import { createTask, TASK_TYPE, TASK_PRIORITY, MODULE_ID } from '../../shared/models/task.model';
import ProfessionalDashboardWidget from './ProfessionalDashboard';
import { ProfessionalProjects } from './ProfessionalPages';

const MODULE = { id: MODULE_ID.PROFESSIONAL, name: 'Professional', icon: '💼', colorKey: 'professional' };

const getAIContext = () => `
[PROFESSIONAL MODULE]
You are also a professional productivity and project management coach.
Help the user plan meetings, deep work sessions, and project milestones.
Apply time-blocking principles — batch similar tasks together.
Protect deep work time from interruptions by scheduling it during peak energy hours (typically 9–11 AM).
Suggest end-of-day reviews and next-day planning sessions.
`.trim();

const getWidgets = () => [{ id: 'professional-overview', component: ProfessionalDashboardWidget, fullWidth: false, order: 30 }];
const getNavItems = () => [{ id: 'professional-projects', label: 'Work Today', icon: '🗂️', colorKey: 'professional' }];
const getPages = () => [{ id: 'professional-projects', component: ProfessionalProjects }];
const getAnalyticsMetrics = () => [
  { moduleColorKey: MODULE.colorKey, moduleIcon: MODULE.icon, moduleName: MODULE.name, label: 'Deep Work Hours This Week', value: '0h', color: 'var(--module-professional)', description: 'Uninterrupted focused work blocks' },
];
const getTaskTemplates = () => [
  createTask({ title: 'Team Meeting',   taskType: TASK_TYPE.FIXED,    priority: TASK_PRIORITY.CRITICAL, duration: 60,  module: MODULE_ID.PROFESSIONAL, category: 'meeting' }),
  createTask({ title: 'Deep Work',      taskType: TASK_TYPE.PREFERRED, priority: TASK_PRIORITY.HIGH,    duration: 120, module: MODULE_ID.PROFESSIONAL, category: 'focus', preferredTime: '09:00 AM' }),
  createTask({ title: 'Email Triage',   taskType: TASK_TYPE.PREFERRED, priority: TASK_PRIORITY.MEDIUM,  duration: 30,  module: MODULE_ID.PROFESSIONAL, category: 'communication' }),
  createTask({ title: 'Day Planning',   taskType: TASK_TYPE.PREFERRED, priority: TASK_PRIORITY.MEDIUM,  duration: 15,  module: MODULE_ID.PROFESSIONAL, category: 'planning', preferredTime: '09:00 AM' }),
  createTask({ title: 'Code Review',    taskType: TASK_TYPE.FLEXIBLE,  priority: TASK_PRIORITY.MEDIUM,  duration: 60,  module: MODULE_ID.PROFESSIONAL, category: 'review' }),
];

registerModule({
  id: MODULE_ID.PROFESSIONAL, name: MODULE.name, icon: MODULE.icon, color: 'var(--module-professional)', colorKey: MODULE.colorKey,
  description: 'Meeting planning, deep work blocks, project tracking, and optional Google Calendar sync.',
  alwaysEnabled: false, getAIContext, getWidgets, getNavItems, getPages, getAnalyticsMetrics, getTaskTemplates,
  integrations: { 'google-calendar': { id: 'google-calendar', name: 'Google Calendar', description: 'Sync meetings and events from Google Calendar.', optional: true, isConnected: () => false, connect: async () => { throw new Error('Not yet implemented.'); }, disconnect: async () => {} } },
});
export default MODULE_ID.PROFESSIONAL;
