/**
 * GeoPlaner — ReminderEngine
 *
 * Manages task reminders with Web Audio API tones.
 * Reminders are persisted to localStorage so they survive page refresh.
 * On app launch, call ReminderEngine.restoreAll(schedule) to re-register.
 */

const STORAGE_KEY = 'geo_reminders';

// ─── Built-in sound generators ─────────────────────────────────────────────
const playBuiltinSound = (type = 'soft') => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const sounds = {
      soft: () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.0);
      },
      bell: () => {
        [523, 659, 784].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18);
          gain.gain.setValueAtTime(0.4, ctx.currentTime + i * 0.18);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.8);
          osc.start(ctx.currentTime + i * 0.18);
          osc.stop(ctx.currentTime + i * 0.18 + 0.8);
        });
      },
      alarm: () => {
        for (let i = 0; i < 4; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'square';
          osc.frequency.setValueAtTime(i % 2 === 0 ? 880 : 660, ctx.currentTime + i * 0.25);
          gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.25);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.25 + 0.22);
          osc.start(ctx.currentTime + i * 0.25);
          osc.stop(ctx.currentTime + i * 0.25 + 0.22);
        }
      },
      ping: () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    };

    (sounds[type] || sounds.soft)();
  } catch (err) {
    console.warn('[ReminderEngine] Audio playback failed:', err);
  }
};

// ─── Custom audio file player ──────────────────────────────────────────────
let _customAudioUrl = null;

const playCustomSound = (url) => {
  try {
    const audio = new Audio(url);
    audio.volume = 0.9;
    audio.play().catch(e => console.warn('[ReminderEngine] Custom audio failed:', e));
  } catch (err) {
    console.warn('[ReminderEngine] Custom audio error:', err);
  }
};

// ─── Timer registry ────────────────────────────────────────────────────────
const _timers = {}; // slotId -> setTimeout handle

// ─── Parse time string to Date today ──────────────────────────────────────
const parseTimeToDate = (timeStr) => {
  const match = timeStr?.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (h === 12) h = period === 'AM' ? 0 : 12;
  else if (period === 'PM') h += 12;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

// ─── Schedule a reminder for a slot ───────────────────────────────────────
const scheduleReminder = (slot) => {
  const reminder = slot.metadata?.reminder;
  if (!reminder?.enabled) return;

  cancelReminder(slot.id); // clear existing

  const taskTime = parseTimeToDate(slot.time);
  if (!taskTime) return;

  const offsetMs = (reminder.offsetMinutes || 0) * 60 * 1000;
  const fireAt = new Date(taskTime.getTime() - offsetMs);
  const msUntilFire = fireAt.getTime() - Date.now();

  if (msUntilFire <= 0) return; // already passed

  _timers[slot.id] = setTimeout(() => {
    // Play sound
    if (reminder.soundType === 'custom' && reminder.customSoundUrl) {
      playCustomSound(reminder.customSoundUrl);
    } else {
      playBuiltinSound(reminder.soundType || 'soft');
    }

    // Browser notification
    if (Notification.permission === 'granted') {
      new Notification(`⏰ Reminder: ${slot.task}`, {
        body: `Starting ${reminder.offsetMinutes > 0 ? `in ${reminder.offsetMinutes} min` : 'now'} at ${slot.time}`,
        icon: '/favicon.ico',
        tag: `geo-reminder-${slot.id}`,
      });
    }

    delete _timers[slot.id];
  }, msUntilFire);
};

// ─── Cancel a specific reminder ────────────────────────────────────────────
const cancelReminder = (slotId) => {
  if (_timers[slotId]) {
    clearTimeout(_timers[slotId]);
    delete _timers[slotId];
  }
};

// ─── Restore all reminders after page load ─────────────────────────────────
const restoreAll = (schedule) => {
  if (!schedule?.length) return;
  // Request notification permission first
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
  schedule.forEach(slot => {
    if (slot.metadata?.reminder?.enabled) {
      scheduleReminder(slot);
    }
  });
};

// ─── Cancel all active timers ──────────────────────────────────────────────
const cancelAll = () => {
  Object.keys(_timers).forEach(cancelReminder);
};

// ─── Expose custom sound URL setter ───────────────────────────────────────
const setCustomAudioUrl = (url) => {
  _customAudioUrl = url;
};

export const ReminderEngine = {
  playBuiltinSound,
  playCustomSound,
  scheduleReminder,
  cancelReminder,
  restoreAll,
  cancelAll,
  setCustomAudioUrl,
};

export default ReminderEngine;
