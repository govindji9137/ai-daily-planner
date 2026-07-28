/**
 * GeoPlaner V2 — Creator Module
 *
 * Provides content creation and publishing pipeline features.
 * Optionally connects to YouTube.
 */
import React from 'react';
import { registerModule } from '../registry';
import { createTask, TASK_TYPE, TASK_PRIORITY, MODULE_ID } from '../../shared/models/task.model';
import CreatorDashboardWidget from './CreatorDashboard';
import { CreatorContentCalendar } from './CreatorPages';

const MODULE = { id: MODULE_ID.CREATOR, name: 'Creator', icon: '🎬', colorKey: 'creator' };

const getAIContext = () => `
[CREATOR MODULE]
You are also a content creation and creative productivity coach.
Help the user schedule content ideation, recording, editing, and publishing.
Respect creative energy — schedule creative tasks during peak energy hours.
Batch similar content tasks together (e.g. all recording in one session).
Account for upload/render times and platform publish schedules.
`.trim();

const getWidgets = () => [{ id: 'creator-pipeline', component: CreatorDashboardWidget, fullWidth: false, order: 40 }];
const getNavItems = () => [{ id: 'creator-content', label: 'Creator Today', icon: '📆', colorKey: 'creator' }];
const getPages = () => [{ id: 'creator-content', component: CreatorContentCalendar }];
const getAnalyticsMetrics = () => [
  { moduleColorKey: MODULE.colorKey, moduleIcon: MODULE.icon, moduleName: MODULE.name, label: 'Content Published This Week', value: '0', color: 'var(--module-creator)', description: 'Videos, articles, or posts published' },
];
const getTaskTemplates = () => [
  createTask({ title: 'Content Ideation',  taskType: TASK_TYPE.OPTIONAL,  priority: TASK_PRIORITY.MEDIUM, duration: 30,  module: MODULE_ID.CREATOR, category: 'ideation' }),
  createTask({ title: 'Recording Session', taskType: TASK_TYPE.PREFERRED, priority: TASK_PRIORITY.HIGH,   duration: 120, module: MODULE_ID.CREATOR, category: 'recording' }),
  createTask({ title: 'Video Editing',     taskType: TASK_TYPE.FLEXIBLE,  priority: TASK_PRIORITY.HIGH,   duration: 180, module: MODULE_ID.CREATOR, category: 'editing' }),
  createTask({ title: 'Thumbnail Design',  taskType: TASK_TYPE.FLEXIBLE,  priority: TASK_PRIORITY.MEDIUM, duration: 45,  module: MODULE_ID.CREATOR, category: 'design' }),
  createTask({ title: 'Publish & Promote', taskType: TASK_TYPE.PREFERRED, priority: TASK_PRIORITY.HIGH,   duration: 30,  module: MODULE_ID.CREATOR, category: 'publishing' }),
];

registerModule({
  id: MODULE_ID.CREATOR, name: MODULE.name, icon: MODULE.icon, color: 'var(--module-creator)', colorKey: MODULE.colorKey,
  description: 'Content pipeline management, recording scheduling, and optional YouTube integration.',
  alwaysEnabled: false, getAIContext, getWidgets, getNavItems, getPages, getAnalyticsMetrics, getTaskTemplates,
  integrations: { youtube: { id: 'youtube', name: 'YouTube', description: 'Sync your YouTube analytics and schedule.', optional: true, isConnected: () => false, connect: async () => { throw new Error('Not yet implemented.'); }, disconnect: async () => {} } },
});
export default MODULE_ID.CREATOR;
