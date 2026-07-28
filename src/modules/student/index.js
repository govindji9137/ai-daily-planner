/**
 * GeoPlaner V2 — Student Module
 *
 * Provides study-focused productivity features.
 * Optionally connects to Srixam (academic platform).
 * Student module works FULLY without Srixam.
 */
import React from 'react';
import { registerModule } from '../registry';
import { createTask, TASK_TYPE, TASK_PRIORITY, MODULE_ID } from '../../shared/models/task.model';
import StudentDashboardWidget from './StudentDashboard';
import { StudentStudyPlanner, StudentExams } from './StudentPages';

const MODULE = {
  id:       MODULE_ID.STUDENT,
  name:     'Student',
  icon:     '🎓',
  colorKey: 'student',
};

// ─── AI Context ───────────────────────────────────────────────────────────────
const getAIContext = () => `
[STUDENT MODULE]
You are also a study planner assistant.
Help the user schedule effective study sessions using spaced repetition principles.
Consider exam deadlines, subject difficulty, and revision needs.
Recommend Pomodoro technique for study blocks (25 min focus, 5 min break).
Prioritize weaker subjects during peak energy hours.
`.trim();

// ─── Widgets ──────────────────────────────────────────────────────────────────
const getWidgets = () => [
  {
    id:        'student-overview',
    component: StudentDashboardWidget,
    fullWidth: false,
    order:     10,
  },
];

// ─── Sidebar Nav ──────────────────────────────────────────────────────────────
const getNavItems = () => [
  { id: 'student-study', label: 'Today\'s Learning', icon: '📚', colorKey: 'student' },
  { id: 'student-exams', label: 'Learning Overview', icon: '📝', colorKey: 'student' },
];

// ─── Pages ────────────────────────────────────────────────────────────────────
const getPages = () => [
  { id: 'student-study', component: StudentStudyPlanner },
  { id: 'student-exams', component: StudentExams },
];

// ─── Analytics Metrics ────────────────────────────────────────────────────────
const getAnalyticsMetrics = () => [
  {
    moduleColorKey: MODULE.colorKey,
    moduleIcon:     MODULE.icon,
    moduleName:     MODULE.name,
    label:          'Study Hours This Week',
    value:          '0h',
    color:          'var(--module-student)',
    description:    'Track time spent studying across all subjects',
  },
];

// ─── Task Templates ───────────────────────────────────────────────────────────
const getTaskTemplates = () => [
  createTask({ title: 'Study Block',       taskType: TASK_TYPE.FLEXIBLE,  priority: TASK_PRIORITY.HIGH,     duration: 90,  module: MODULE_ID.STUDENT, category: 'study' }),
  createTask({ title: 'Revision Session',  taskType: TASK_TYPE.FLEXIBLE,  priority: TASK_PRIORITY.HIGH,     duration: 60,  module: MODULE_ID.STUDENT, category: 'revision' }),
  createTask({ title: 'Practice Problems', taskType: TASK_TYPE.FLEXIBLE,  priority: TASK_PRIORITY.MEDIUM,   duration: 45,  module: MODULE_ID.STUDENT, category: 'practice' }),
  createTask({ title: 'Lecture',           taskType: TASK_TYPE.FIXED,     priority: TASK_PRIORITY.CRITICAL, duration: 60,  module: MODULE_ID.STUDENT, category: 'college' }),
  createTask({ title: 'Assignment',        taskType: TASK_TYPE.FLEXIBLE,  priority: TASK_PRIORITY.HIGH,     duration: 120, module: MODULE_ID.STUDENT, category: 'assignment' }),
  createTask({ title: 'Watch Lecture',     taskType: TASK_TYPE.OPTIONAL,  priority: TASK_PRIORITY.LOW,      duration: 45,  module: MODULE_ID.STUDENT, category: 'lecture' }),
];

// ─── Srixam Integration Stub ──────────────────────────────────────────────────
const srixamIntegration = {
  id:          'srixam',
  name:        'Srixam',
  description: 'Connect to Srixam for AI-powered study planning and syllabus tracking.',
  optional:    true,
  isConnected: () => false,
  connect:     async () => { throw new Error('Srixam integration not yet implemented.'); },
  disconnect:  async () => {},
};

// ─── Registration ─────────────────────────────────────────────────────────────
registerModule({
  id:           MODULE_ID.STUDENT,
  name:         MODULE.name,
  icon:         MODULE.icon,
  color:        'var(--module-student)',
  colorKey:     MODULE.colorKey,
  description:  'Study planning, revision scheduling, exam tracking, and optional Srixam integration.',
  alwaysEnabled: false,
  getAIContext,
  getWidgets,
  getNavItems,
  getPages,
  getAnalyticsMetrics,
  getTaskTemplates,
  integrations: { srixam: srixamIntegration },
});

export default MODULE_ID.STUDENT;
