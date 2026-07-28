import React, { useState } from 'react';
import { usePlanner } from '../../contexts/PlannerContext';

/**
 * ExecutionTaskCard
 * 
 * A unified component to render executable tasks across all module dashboards.
 * Hooks into the PlannerContext for starting focus sessions, skipping, completing, and rescheduling.
 */
export const ExecutionTaskCard = ({ task, onTaskUpdate }) => {
  const { startTaskFocus, updateFullSlot } = usePlanner();
  const [showSkipPrompt, setShowSkipPrompt] = useState(false);
  const [skipReason, setSkipReason] = useState('');
  const [showAI, setShowAI] = useState(false);

  // If the component doesn't get a strict ID, we generate a temporary one 
  // so the planner context doesn't crash, but typically the mock backend should provide it.
  const executableTask = {
    ...task,
    actualDuration: task.actualDuration || 0
  };

  const handleStartFocus = () => {
    startTaskFocus(executableTask);
  };

  const handleComplete = () => {
    const updated = { ...executableTask, status: 'completed' };
    if (onTaskUpdate) onTaskUpdate(updated);
    // If it's part of the global schedule, updateFullSlot would sync it
    // updateFullSlot(updated);
  };

  const handleSkipSubmit = (e) => {
    e.preventDefault();
    if (!skipReason.trim()) return;
    const updated = { ...executableTask, status: 'skipped', incompleteReason: skipReason };
    if (onTaskUpdate) onTaskUpdate(updated);
    setShowSkipPrompt(false);
    setSkipReason('');
  };

  const handleReschedule = () => {
    const updated = { ...executableTask, status: 'rescheduled', incompleteReason: 'Rescheduled to AI Pool' };
    if (onTaskUpdate) onTaskUpdate(updated);
  };

  const isCompleted = executableTask.status === 'completed';
  const isSkipped = executableTask.status === 'skipped';
  const isRescheduled = executableTask.status === 'rescheduled';

  let borderLeftColor = 'var(--glass-border)';
  if (isCompleted) borderLeftColor = 'var(--status-success)';
  if (isSkipped) borderLeftColor = 'var(--status-error)';
  if (isRescheduled) borderLeftColor = 'var(--status-warning)';

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '8px',
      borderLeft: `4px solid ${borderLeftColor}`,
      padding: '16px',
      marginBottom: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {/* Top Row: Title, Status, Time */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ 
            fontWeight: '600', 
            fontSize: '15px',
            color: (isCompleted || isSkipped || isRescheduled) ? 'var(--text-muted)' : 'var(--text-primary)',
            textDecoration: (isCompleted || isSkipped) ? 'line-through' : 'none'
          }}>
            {executableTask.title}
          </div>
          {executableTask.aiExplanation && (
            <button 
              onClick={() => setShowAI(!showAI)}
              style={{ background: 'none', border: 'none', color: '#c084fc', fontSize: '12px', cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>✨</span> Why this task?
            </button>
          )}
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 'bold', color: 'var(--accent-primary)', fontSize: '14px' }}>
            {executableTask.duration} min
          </div>
          {(executableTask.actualDuration > 0) && (
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Actual: {executableTask.actualDuration}m
            </div>
          )}
        </div>
      </div>

      {/* AI Explanation Dropdown */}
      {showAI && executableTask.aiExplanation && (
        <div style={{ padding: '8px 12px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '4px', border: '1px solid rgba(139, 92, 246, 0.2)', fontSize: '12px', color: 'var(--text-secondary)' }}>
          {executableTask.aiExplanation}
        </div>
      )}

      {/* Skip Prompt Inline Form */}
      {showSkipPrompt && (
        <form onSubmit={handleSkipSubmit} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <input 
            type="text" 
            autoFocus
            className="glass-input" 
            placeholder="Mandatory: Why are you skipping this?"
            value={skipReason}
            onChange={(e) => setSkipReason(e.target.value)}
            style={{ flex: 1, fontSize: '12px', padding: '6px 10px' }}
          />
          <button type="submit" className="glass-button" style={{ color: 'var(--status-error)', borderColor: 'var(--status-error)', padding: '6px 12px', fontSize: '12px' }}>Confirm Skip</button>
          <button type="button" onClick={() => setShowSkipPrompt(false)} className="glass-button" style={{ padding: '6px 12px', fontSize: '12px' }}>Cancel</button>
        </form>
      )}

      {/* Skipped/Rescheduled Reason Display */}
      {(isSkipped || isRescheduled) && executableTask.incompleteReason && (
        <div style={{ fontSize: '12px', color: isSkipped ? 'var(--status-error)' : 'var(--status-warning)', fontStyle: 'italic' }}>
          Reason: {executableTask.incompleteReason}
        </div>
      )}

      {/* Action Buttons */}
      {!(isCompleted || isSkipped || isRescheduled) && !showSkipPrompt && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
          <button onClick={handleStartFocus} className="glass-button primary" style={{ flex: 1, padding: '8px', fontSize: '13px' }}>
            ▶️ Start Focus
          </button>
          <button onClick={handleComplete} className="glass-button" style={{ color: 'var(--status-success)', borderColor: 'var(--status-success)', padding: '8px', fontSize: '13px' }}>
            ✓ Complete
          </button>
          <button onClick={handleReschedule} className="glass-button" style={{ color: 'var(--status-warning)', borderColor: 'var(--status-warning)', padding: '8px', fontSize: '13px' }}>
            ⏳ Reschedule
          </button>
          <button onClick={() => setShowSkipPrompt(true)} className="glass-button" style={{ color: 'var(--status-error)', borderColor: 'var(--status-error)', padding: '8px', fontSize: '13px' }}>
            ⏭️ Skip
          </button>
        </div>
      )}
    </div>
  );
};
