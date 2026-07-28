/**
 * GeoPlaner V2 — Personal Module
 *
 * The base module. Always enabled. Cannot be disabled.
 * Represents the current MVP behavior.
 * Migrates all existing planner functionality into the module system.
 */
import { registerModule } from '../registry';
import { createTask, TASK_TYPE, TASK_PRIORITY, MODULE_ID } from '../../shared/models/task.model';

// ─── AI Context ───────────────────────────────────────────────────────────────
const getAIContext = () => `
[PERSONAL MODULE]
You are helping with general personal productivity.
Focus on time management, daily routines, and work-life balance.
Help the user optimize their daily schedule for maximum effectiveness.
`.trim();

// ─── Dashboard Widgets ────────────────────────────────────────────────────────
// Personal module provides no additional widgets — the main planner IS its dashboard.
const getWidgets = () => [];

// ─── Sidebar Nav Items ────────────────────────────────────────────────────────
const getNavItems = () => [];

// ─── Analytics Metrics ────────────────────────────────────────────────────────
const getAnalyticsMetrics = () => [];

// ─── Task Templates ───────────────────────────────────────────────────────────
const getTaskTemplates = () => [
  createTask({ title: 'Morning Routine',  taskType: TASK_TYPE.FIXED,    priority: TASK_PRIORITY.HIGH,   duration: 60,  module: MODULE_ID.PERSONAL, category: 'routine' }),
  createTask({ title: 'Deep Work Block',  taskType: TASK_TYPE.FLEXIBLE,  priority: TASK_PRIORITY.HIGH,   duration: 120, module: MODULE_ID.PERSONAL, category: 'work' }),
  createTask({ title: 'Exercise',         taskType: TASK_TYPE.PREFERRED, priority: TASK_PRIORITY.MEDIUM, duration: 60,  module: MODULE_ID.PERSONAL, category: 'health', preferredTime: '06:00 PM' }),
  createTask({ title: 'Reading',          taskType: TASK_TYPE.OPTIONAL,  priority: TASK_PRIORITY.LOW,    duration: 30,  module: MODULE_ID.PERSONAL, category: 'learning' }),
  createTask({ title: 'Evening Review',   taskType: TASK_TYPE.PREFERRED, priority: TASK_PRIORITY.MEDIUM, duration: 15,  module: MODULE_ID.PERSONAL, category: 'routine', preferredTime: '09:00 PM' }),
];

// ─── Module Registration ──────────────────────────────────────────────────────
registerModule({
  id:           MODULE_ID.PERSONAL,
  name:         'Personal',
  icon:         '👤',
  color:        'var(--module-personal)',
  colorKey:     'personal',
  description:  'General productivity and daily planning. The foundation of GeoPlaner.',
  alwaysEnabled: true,
  getAIContext,
  getWidgets,
  getNavItems,
  getAnalyticsMetrics,
  getTaskTemplates,
  integrations:  {},
});

export default MODULE_ID.PERSONAL;
