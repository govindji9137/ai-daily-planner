/**
 * GeoPlaner V2 — Universal Task Model
 * 
 * ALL modules must use this factory to create tasks.
 * The Planner Engine never cares which module generated a task.
 */

// ─── Task Types ─────────────────────────────────────────────────────────────
export const TASK_TYPE = Object.freeze({
  FIXED:    'fixed',     // Cannot move — meetings, flights, classes
  PREFERRED:'preferred', // Prefer this time, shift slightly if needed
  FLEXIBLE: 'flexible',  // Can occur anytime — study, coding, reading
  OPTIONAL: 'optional',  // Can be skipped if schedule is full
});

// ─── Task Status ─────────────────────────────────────────────────────────────
export const TASK_STATUS = Object.freeze({
  PENDING:   null,
  COMPLETED: true,
  MISSED:    false,
});

// ─── Task Priority ────────────────────────────────────────────────────────────
export const TASK_PRIORITY = Object.freeze({
  CRITICAL: 5,
  HIGH:     4,
  MEDIUM:   3,
  LOW:      2,
  OPTIONAL: 1,
});

// ─── Module IDs ──────────────────────────────────────────────────────────────
export const MODULE_ID = Object.freeze({
  PERSONAL:     'personal',
  STUDENT:      'student',
  HEALTH:       'health',
  PROFESSIONAL: 'professional',
  CREATOR:      'creator',
});

// ─── Legacy slot types (preserved for API compatibility) ──────────────────────
export const SLOT_TYPE = Object.freeze({
  FOCUS: 'focus',
  BREAK: 'break',
});

// ─── Universal Task Factory ──────────────────────────────────────────────────
let _idCounter = 1;

/**
 * Creates a standardized task object.
 * All modules must use this factory.
 * 
 * @param {Object} overrides - Fields to override from defaults
 * @returns {Object} Fully-typed task object
 */
export const createTask = (overrides = {}) => ({
  // Identity
  id:           overrides.id ?? `task_${Date.now()}_${_idCounter++}`,
  title:        overrides.title ?? '',
  description:  overrides.description ?? '',

  // Module metadata
  module:       overrides.module ?? MODULE_ID.PERSONAL,
  category:     overrides.category ?? 'general',

  // Scheduling
  priority:     overrides.priority ?? TASK_PRIORITY.MEDIUM,
  duration:     overrides.duration ?? 60,          // in minutes
  taskType:     overrides.taskType ?? TASK_TYPE.FLEXIBLE,
  preferredTime: overrides.preferredTime ?? null,  // "09:00 AM" or null

  // Time slots (set by scheduler)
  startTime:    overrides.startTime ?? null,       // "09:00 AM"
  endTime:      overrides.endTime ?? null,         // "10:00 AM"

  // Legacy slot shape (for API backward compatibility)
  time:         overrides.time ?? overrides.startTime ?? null,
  task:         overrides.task ?? overrides.title ?? '',
  type:         overrides.type ?? SLOT_TYPE.FOCUS, // 'focus' | 'break'

  // Lifecycle
  deadline:     overrides.deadline ?? null,
  repeat:       overrides.repeat ?? null,          // 'daily' | 'weekly' | null
  reminder:     overrides.reminder ?? null,        // minutes before

  // Tracking
  status:       overrides.status ?? TASK_STATUS.PENDING,
  isCompleted:  overrides.isCompleted ?? null,     // backward compat
  notes:        overrides.notes ?? '',
  incompleteReason: overrides.incompleteReason ?? '',
  expanded:     overrides.expanded ?? false,

  // Tagging
  tags:         overrides.tags ?? [],
  sourceId:     overrides.sourceId ?? null,        // external ID (e.g. Google Calendar event)

  // Audit
  createdBy:    overrides.createdBy ?? 'user',     // 'user' | 'ai' | module ID
  createdAt:    overrides.createdAt ?? new Date().toISOString(),
  updatedAt:    overrides.updatedAt ?? new Date().toISOString(),

  // Module-specific extension data (opaque to core)
  metadata:     overrides.metadata ?? {},
});

/**
 * Upgrade a legacy slot (from existing API) to the universal task model.
 * Preserves all original fields while adding new ones.
 * 
 * @param {Object} legacySlot - Existing slot from DB/API
 * @param {string} moduleId   - Which module owns this slot
 * @returns {Object} Universal task object
 */
export const fromLegacySlot = (legacySlot, moduleId = MODULE_ID.PERSONAL) =>
  createTask({
    ...legacySlot,
    id:           legacySlot.id,
    title:        legacySlot.task ?? '',
    module:       moduleId,
    startTime:    legacySlot.time ?? null,
    type:         legacySlot.type ?? SLOT_TYPE.FOCUS,
    taskType:     legacySlot.type === SLOT_TYPE.FOCUS ? TASK_TYPE.FLEXIBLE : TASK_TYPE.PREFERRED,
    status:       legacySlot.isCompleted,
    isCompleted:  legacySlot.isCompleted,
    notes:        legacySlot.notes ?? '',
    incompleteReason: legacySlot.incompleteReason ?? '',
    expanded:     legacySlot.expanded ?? false,
    createdBy:    'ai',
  });

/**
 * Convert a universal task back to a legacy slot shape for API persistence.
 * This ensures we don't break the existing backend DB schema.
 * 
 * @param {Object} task - Universal task object
 * @returns {Object} Legacy slot compatible with DB
 */
export const toLegacySlot = (task) => ({
  id:               task.id,
  time:             task.time ?? task.startTime,
  task:             task.task ?? task.title,
  type:             task.type,
  isCompleted:      task.isCompleted ?? task.status,
  notes:            task.notes ?? '',
  incompleteReason: task.incompleteReason ?? '',
  expanded:         task.expanded ?? false,
});

/**
 * Convert an array of tasks to legacy slots for persistence.
 */
export const scheduleToLegacySlots = (tasks) => tasks.map(toLegacySlot);

export default createTask;
