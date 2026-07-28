/**
 * GeoPlaner V2 — PlannerContext
 *
 * Single source of truth for the daily schedule.
 * Replaces in-component state from the old Planner.jsx.
 *
 * Any part of the app (AI, Timer, Analytics, Modules) can read
 * the current schedule without prop-drilling.
 */
import React, {
  createContext, useContext, useState,
  useEffect, useRef, useCallback, useMemo
} from 'react';
import { apiGetSchedule, apiGenerateSchedule, apiSaveSchedule, apiLogFocusSession } from '../utils/api';
import { fromLegacySlot, toLegacySlot } from '../shared/models/task.model';
import ReminderEngine from '../core/planner/ReminderEngine';

// ─── Default schedule (24-hour skeleton) ─────────────────────────────────────
const buildDefaultSchedule = () => [
  { id: 1,  time: '06:00 AM', task: 'Wake up & Stretch',   type: 'break',  isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 2,  time: '07:00 AM', task: 'Breakfast',           type: 'break',  isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 3,  time: '08:00 AM', task: 'Morning Commute',     type: 'break',  isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 4,  time: '09:00 AM', task: 'Deep Work: Coding',   type: 'focus',  isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 5,  time: '10:00 AM', task: 'Team Meeting',        type: 'focus',  isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 6,  time: '11:00 AM', task: 'Code Review',         type: 'focus',  isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 7,  time: '12:00 PM', task: 'Lunch Break',         type: 'break',  isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 8,  time: '01:00 PM', task: 'Client Calls',        type: 'focus',  isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 9,  time: '02:00 PM', task: 'Focused Work',        type: 'focus',  isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 10, time: '03:00 PM', task: 'Planning & Emails',   type: 'focus',  isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 11, time: '04:00 PM', task: 'Wrap up tasks',       type: 'focus',  isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 12, time: '05:00 PM', task: 'Commute',             type: 'break',  isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 13, time: '06:00 PM', task: 'Workout',             type: 'break',  isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 14, time: '07:00 PM', task: 'Dinner',              type: 'break',  isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 15, time: '08:00 PM', task: 'Reading / Learning',  type: 'focus',  isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 16, time: '09:00 PM', task: 'Relaxation',          type: 'break',  isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 17, time: '10:00 PM', task: 'Wind down',           type: 'break',  isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 18, time: '11:00 PM', task: 'Sleep',               type: 'break',  isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 19, time: '12:00 AM', task: 'Sleep',               type: 'break',  isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 20, time: '01:00 AM', task: 'Sleep',               type: 'break',  isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 21, time: '02:00 AM', task: 'Sleep',               type: 'break',  isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 22, time: '03:00 AM', task: 'Sleep',               type: 'break',  isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 23, time: '04:00 AM', task: 'Sleep',               type: 'break',  isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 24, time: '05:00 AM', task: 'Sleep',               type: 'break',  isCompleted: null, notes: '', incompleteReason: '', expanded: false },
];

// ─── Context ──────────────────────────────────────────────────────────────────
const PlannerContext = createContext(null);

export const PlannerProvider = ({ children }) => {
  const [schedule, setSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastPrompt, setLastPrompt] = useState('');
  const [activeTimerTask, setActiveTimerTask] = useState(null);
  const saveTimeoutRef = useRef(null);

  // ─── Load today's schedule on mount ─────────────────────────────────────
  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiGetSchedule();
      if (res.data?.slots?.length > 0) {
        setSchedule(res.data.slots);
        // Re-register reminders from persisted metadata
        ReminderEngine.restoreAll(res.data.slots);
      } else {
        setSchedule(buildDefaultSchedule());
      }
    } catch {
      setSchedule(buildDefaultSchedule());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Debounced save ──────────────────────────────────────────────────────
  const triggerSave = useCallback((newSchedule) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await apiSaveSchedule(newSchedule);
      } catch (err) {
        console.error('[PlannerContext] Auto-save failed:', err);
      }
    }, 1000);
  }, []);

  // ─── Update a single slot field ─────────────────────────────────────
  const updateSlot = useCallback((id, field, value) => {
    setSchedule((prev) => {
      const next = prev.map((slot) => {
        if (slot.id !== id) return slot;
        return { ...slot, [field]: value };
      });
      triggerSave(next);
      return next;
    });
  }, [triggerSave]);

  // ─── Update entire slot object ──────────────────────────────────────
  const updateFullSlot = useCallback((updatedSlot) => {
    setSchedule((prev) => {
      const next = prev.map((slot) => (slot.id === updatedSlot.id ? updatedSlot : slot));
      triggerSave(next);
      // Re-register reminder if metadata changed
      if (updatedSlot.metadata?.reminder) {
        ReminderEngine.scheduleReminder(updatedSlot);
      } else {
        ReminderEngine.cancelReminder(updatedSlot.id);
      }
      return next;
    });
  }, [triggerSave]);

  // ─── Toggle expanded state ───────────────────────────────────────────────
  const toggleExpand = useCallback((id) => {
    setSchedule((prev) =>
      prev.map((slot) => slot.id === id ? { ...slot, expanded: !slot.expanded } : slot)
    );
  }, []);

  // ─── Focus Timer Management ──────────────────────────────────────────────
  const startTaskFocus = useCallback((task) => {
    setActiveTimerTask(task);
  }, []);

  const closeTaskFocus = useCallback(() => {
    setActiveTimerTask(null);
  }, []);

  const openStandaloneTimer = useCallback(() => {
    setActiveTimerTask({ id: 'standalone' });
  }, []);

  const completeFocusSession = useCallback(async (taskId, duration, status, notes, skipReason) => {
    try {
      // 1. Log the session
      await apiLogFocusSession(taskId, duration, 'pomodoro', notes);
      
      // 2. Update task status and duration locally
      setSchedule((prev) => {
        const next = prev.map((slot) => {
          if (slot.id !== taskId) return slot;
          return {
            ...slot,
            status: status || slot.status,
            incompleteReason: skipReason || slot.incompleteReason,
            actualDuration: (slot.actualDuration || 0) + duration,
            notes: notes ? `${slot.notes ? slot.notes + '\n' : ''}${notes}` : slot.notes
          };
        });
        triggerSave(next);
        return next;
      });
      
      setActiveTimerTask(null);
    } catch (err) {
      console.error('[PlannerContext] Failed to log focus session:', err);
      throw err;
    }
  }, [triggerSave]);

  // ─── Generate AI schedule ────────────────────────────────────────────────
  const generateSchedule = useCallback(async (userPrompt, wakeTime = 'auto', sleepTime = 'auto') => {
    setIsGenerating(true);
    setLastPrompt(userPrompt);
    try {
      const res = await apiGenerateSchedule(userPrompt, wakeTime, sleepTime);
      const parsed = res.data.map((slot) => ({
        ...slot,
        isCompleted: null,
        notes: '',
        incompleteReason: '',
        expanded: false,
      }));
      setSchedule(parsed);
    } catch (err) {
      console.error('[PlannerContext] Generate failed:', err);
      throw err; // Let UI handle toast/alert
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // ─── Derived: today's progress ───────────────────────────────────────────
  const progress = useMemo(() => {
    const tracked = schedule.filter(s => s.type === 'focus');
    const done = tracked.filter(s => s.status === 'COMPLETED').length;
    return {
      tracked: tracked.length,
      done,
      percent: tracked.length === 0 ? 0 : Math.round((done / tracked.length) * 100)
    };
  }, [schedule]);

  // ─── Current task (based on system time) ─────────────────────────────────
  const [currentTask, setCurrentTask] = useState(null);

  useEffect(() => {
    const updateCurrentTask = () => {
      if (!schedule || schedule.length === 0) {
        setCurrentTask(null);
        return;
      }

      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();

      // Parse HH:MM AM/PM to minutes since midnight
      const parseMins = (timeStr) => {
        const match = timeStr?.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) return -1;
        let h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        const p = match[3].toUpperCase();
        if (h === 12) h = p === 'AM' ? 0 : 12;
        else if (p === 'PM') h += 12;
        return h * 60 + m;
      };

      // Find the slot that the current time falls into (assuming 1-hour slots)
      // or the closest upcoming slot if we are somehow before the first slot.
      let activeSlot = null;
      for (let i = 0; i < schedule.length; i++) {
        const slotMins = parseMins(schedule[i].time);
        if (slotMins === -1) continue;
        
        // If current time is within this 60-minute block
        if (currentMins >= slotMins && currentMins < slotMins + 60) {
          activeSlot = schedule[i];
          break;
        }
      }

      // Fallback: If no exact match (maybe schedule isn't 24h), find the next upcoming task
      if (!activeSlot) {
        activeSlot = schedule.find((s) => parseMins(s.time) > currentMins) || null;
      }

      setCurrentTask(activeSlot);
    };

    updateCurrentTask(); // run immediately
    const interval = setInterval(updateCurrentTask, 60000); // update every minute
    return () => clearInterval(interval);
  }, [schedule]);

  return (
    <PlannerContext.Provider value={{
      schedule,
      isLoading,
      isGenerating,
      lastPrompt,
      progress,
      currentTask,
      fetchSchedule,
      updateSlot,
      updateFullSlot,
      triggerSave,
      toggleExpand,
      generateSchedule,
      setSchedule,
      
      activeTimerTask,
      startTaskFocus,
      closeTaskFocus,
      openStandaloneTimer,
      completeFocusSession,
    }}>
      {children}
    </PlannerContext.Provider>
  );
};

export const usePlanner = () => {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error('usePlanner must be used inside PlannerProvider');
  return ctx;
};
