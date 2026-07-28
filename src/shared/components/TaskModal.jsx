import React, { useState, useEffect, useRef } from 'react';
import ReminderEngine from '../../core/planner/ReminderEngine';

const SOUND_OPTIONS = [
  { value: 'soft',  label: '🔔 Soft Beep' },
  { value: 'bell',  label: '🎵 Bell Chime' },
  { value: 'alarm', label: '🚨 Alarm Buzz' },
  { value: 'ping',  label: '✨ Ping' },
  { value: 'custom', label: '📁 From Device…' },
];

const OFFSET_OPTIONS = [
  { value: 0,  label: 'At task time' },
  { value: 5,  label: '5 min before' },
  { value: 10, label: '10 min before' },
  { value: 15, label: '15 min before' },
  { value: 30, label: '30 min before' },
];

const TaskModal = ({ slot, onClose, onSave }) => {
  const [formData, setFormData] = useState({ ...slot });
  const [reminder, setReminder] = useState({
    enabled: false,
    offsetMinutes: 5,
    soundType: 'soft',
    customSoundUrl: null,
    ...(slot?.metadata?.reminder || {}),
  });
  const [customFileName, setCustomFileName] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    setFormData({ ...slot });
    setReminder({
      enabled: false,
      offsetMinutes: 5,
      soundType: 'soft',
      customSoundUrl: null,
      ...(slot?.metadata?.reminder || {}),
    });
  }, [slot]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleReminderChange = (key, value) => {
    setReminder(prev => ({ ...prev, [key]: value }));
  };

  const handleCustomFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomFileName(file.name);
    setReminder(prev => ({ ...prev, customSoundUrl: url, soundType: 'custom' }));
  };

  const handlePreviewSound = () => {
    if (reminder.soundType === 'custom' && reminder.customSoundUrl) {
      ReminderEngine.playCustomSound(reminder.customSoundUrl);
    } else {
      ReminderEngine.playBuiltinSound(reminder.soundType);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Merge reminder into slot metadata
    const updatedSlot = {
      ...formData,
      metadata: {
        ...(formData.metadata || {}),
        reminder: reminder.enabled ? reminder : null,
      },
    };
    onSave(updatedSlot);
  };

  if (!slot) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '20px', margin: 0 }}>✏️ Edit Task</h2>
          <button className="glass-button secondary" style={{ width: '32px', height: '32px', padding: 0 }} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Task Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Task Title</label>
            <input
              type="text"
              name="task"
              className="glass-input"
              value={formData.task || ''}
              onChange={handleChange}
              placeholder="e.g. Read Chapter 4"
              required
            />
          </div>

          {/* Type + Priority */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Type</label>
              <select name="type" className="glass-input" value={formData.type || 'focus'} onChange={handleChange}>
                <option value="focus">Focus</option>
                <option value="break">Break</option>
                <option value="fixed">Fixed</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Priority</label>
              <select name="priority" className="glass-input" value={formData.priority || 'medium'} onChange={handleChange}>
                <option value="critical">🔴 Critical</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
          </div>

          {/* Module + Status */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Module</label>
              <select name="moduleId" className="glass-input" value={formData.moduleId || 'personal'} onChange={handleChange}>
                <option value="personal">Personal</option>
                <option value="student">Student</option>
                <option value="health">Health</option>
                <option value="professional">Professional</option>
                <option value="creator">Creator</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Status</label>
              <select name="status" className="glass-input" value={formData.status || 'SCHEDULED'} onChange={handleChange}>
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">✅ Done</option>
                <option value="SKIPPED">❌ Skipped</option>
              </select>
            </div>
          </div>



          {/* ─── REMINDER SECTION ─── */}
          <div style={{
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            padding: '16px',
            background: reminder.enabled ? 'rgba(138,43,226,0.06)' : 'rgba(0,0,0,0.05)',
            transition: 'background 0.3s',
          }}>
            {/* Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: reminder.enabled ? '16px' : 0 }}>
              <div>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>⏰ Reminder / Alarm</span>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Get notified with a sound alert</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={reminder.enabled}
                  onChange={(e) => handleReminderChange('enabled', e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '13px', color: reminder.enabled ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                  {reminder.enabled ? 'ON' : 'OFF'}
                </span>
              </label>
            </div>

            {reminder.enabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.2s ease' }}>

                {/* Offset */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>When to alert</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {OFFSET_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleReminderChange('offsetMinutes', opt.value)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: `1px solid ${reminder.offsetMinutes === opt.value ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                          background: reminder.offsetMinutes === opt.value ? 'var(--accent-primary-dim)' : 'transparent',
                          color: reminder.offsetMinutes === opt.value ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: reminder.offsetMinutes === opt.value ? '600' : '400',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sound Type */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Sound type</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {SOUND_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          if (opt.value === 'custom') {
                            fileInputRef.current?.click();
                          } else {
                            handleReminderChange('soundType', opt.value);
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: `1px solid ${reminder.soundType === opt.value ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                          background: reminder.soundType === opt.value ? 'var(--accent-primary-dim)' : 'transparent',
                          color: reminder.soundType === opt.value ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: reminder.soundType === opt.value ? '600' : '400',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      style={{ display: 'none' }}
                      onChange={handleCustomFile}
                    />
                    {customFileName && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>📁 {customFileName}</span>
                    )}
                  </div>
                </div>

                {/* Preview */}
                <button
                  type="button"
                  className="glass-button secondary"
                  style={{ alignSelf: 'flex-start', padding: '6px 16px', fontSize: '13px' }}
                  onClick={handlePreviewSound}
                >
                  ▶ Preview Sound
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
            <button type="button" className="glass-button secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="glass-button primary" style={{ background: 'var(--accent-primary)', color: 'var(--bg-primary)' }}>
              💾 Save Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
