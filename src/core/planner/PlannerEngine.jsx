/**
 * GeoPlaner V2 — Premium Planner Engine (Phase 2)
 *
 * Implements a Drag & Drop timeline using @hello-pangea/dnd.
 * Respects the Universal Task Model and ONE Planner rule.
 */
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { usePlanner } from '../../contexts/PlannerContext';
import TaskModal from '../../shared/components/TaskModal';

// ─── Word counter helper ──────────────────────────────────────────────────────
const countWords = (str) => (str?.trim() ? str.trim().split(/\s+/).length : 0);

// ─── StrictMode Helper for Drag and Drop ──────────────────────────────────────
const StrictModeDroppable = ({ children, ...props }) => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  if (!enabled) return null;
  return <Droppable {...props}>{children}</Droppable>;
};

// ─── Time Slot Row ────────────────────────────────────────────────────────────
const TimeSlotRow = ({ slot, index, onEdit }) => {
  const { updateSlot, toggleExpand, startTaskFocus } = usePlanner();

  return (
    <Draggable draggableId={String(slot.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`glass-panel animate-fade-in ${snapshot.isDragging ? 'dragging' : ''}`}
          style={{
            ...provided.draggableProps.style,
            display: 'flex',
            flexDirection: 'column',
            borderLeft: `4px solid ${slot.type === 'focus' ? 'var(--accent-primary)' : 'var(--accent-secondary)'}`,
            marginBottom: '12px',
            opacity: snapshot.isDragging ? 0.8 : 1,
            transform: snapshot.isDragging ? `${provided.draggableProps.style.transform} scale(1.02)` : provided.draggableProps.style.transform,
            zIndex: snapshot.isDragging ? 1000 : 1,
            boxShadow: snapshot.isDragging ? '0 16px 32px rgba(0,0,0,0.4)' : undefined,
          }}
        >
          {/* Main row */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '18px 20px', gap: '16px', flexWrap: 'wrap' }}>
            <div
              {...provided.dragHandleProps}
              style={{
                cursor: 'grab',
                color: 'var(--text-muted)',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
              }}
              title="Drag to reorder"
            >
              ⋮⋮
            </div>
            
            <div style={{ fontWeight: '600', width: '85px', color: 'var(--text-secondary)', fontSize: '13px', flexShrink: 0 }}>
              {slot.time}
            </div>

            <button 
              type="button"
              style={{ flex: 1, minWidth: '150px', textAlign: 'left', fontSize: '16px', fontWeight: '500', cursor: 'pointer', background: 'none', border: 'none', color: 'inherit', padding: 0, outline: 'none' }}
              onClick={() => onEdit(slot)}
              title="Click to edit task details"
            >
              {slot.task} <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>✏️</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, flexWrap: 'wrap' }}>
              <span className={`task-type-badge ${slot.type === 'focus' ? 'task-type-focus' : 'task-type-break'}`}>
                {slot.type === 'focus' ? 'Focus' : 'Break'}
              </span>

              <select
                className="glass-input"
                style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}
                value={slot.status || 'SCHEDULED'}
                onChange={(e) => {
                  const val = e.target.value;
                  updateSlot(slot.id, 'status', val);
                  if (val !== 'SCHEDULED' && val !== 'DRAFT') toggleExpand(slot.id);
                }}
              >
                <option value="SCHEDULED">Scheduled</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">✅ Done</option>
                <option value="SKIPPED">❌ Skipped</option>
              </select>

              <button
                className="glass-button secondary"
                style={{ width: '32px', height: '32px', padding: 0, fontSize: '18px', flexShrink: 0 }}
                onClick={() => toggleExpand(slot.id)}
                title={slot.expanded ? 'Collapse' : 'Expand Details'}
              >
                {slot.expanded ? '−' : '+'}
              </button>

              <button
                className="glass-button primary"
                style={{ width: '32px', height: '32px', padding: 0, fontSize: '14px', flexShrink: 0, background: 'var(--accent-primary)', color: 'var(--bg-primary)' }}
                onClick={() => startTaskFocus(slot)}
                title="Start Focus Timer for this task"
              >
                ▶
              </button>
            </div>
          </div>

          {/* Expanded area */}
          {slot.expanded && (
            <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Notes
                </label>
                <textarea
                  className="glass-input"
                  style={{ minHeight: '60px', resize: 'vertical', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}
                  value={slot.notes || ''}
                  onChange={(e) => updateSlot(slot.id, 'notes', e.target.value)}
                  placeholder="Add task notes here..."
                />
              </div>

              {slot.status === 'SKIPPED' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--status-error)', marginBottom: '6px' }}>
                    Reason for skipping (required, max 100 words): {countWords(slot.incompleteReason)}/100
                  </label>
                  <textarea
                    className="glass-input"
                    style={{
                      minHeight: '60px',
                      resize: 'vertical',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      borderColor: (slot.incompleteReason || '').trim() === '' ? 'var(--status-error)' : undefined,
                    }}
                    value={slot.incompleteReason || ''}
                    onChange={(e) => updateSlot(slot.id, 'incompleteReason', e.target.value)}
                    placeholder="Why did you miss this task?"
                    required
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

// ─── PlannerEngine ─────────────────────────────────────────────────────────────
const PlannerEngine = () => {
  const { schedule, setSchedule, isLoading, isGenerating, progress, generateSchedule, triggerSave, updateFullSlot } = usePlanner();
  const [prompt, setPrompt] = useState('');
  const [wakeTime, setWakeTime] = useState('auto');
  const [sleepTime, setSleepTime] = useState('auto');
  const [generateError, setGenerateError] = useState('');
  const [editingSlot, setEditingSlot] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setGenerateError('');
    try {
      await generateSchedule(prompt, wakeTime, sleepTime);
      setPrompt('');
    } catch (err) {
      setGenerateError(err.message || 'Failed to generate schedule. Please try again.');
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    if (sourceIndex === destIndex) return;

    const items = Array.from(schedule);
    
    // We want to move the task, but preserve the sequential times!
    // We just keep the array of times exactly as it is, and map the tasks into those times based on the new order.
    const originalTimes = schedule.map(s => s.time);
    const [reorderedItem] = items.splice(sourceIndex, 1);
    items.splice(destIndex, 0, reorderedItem);

    // Re-assign times strictly based on their new index order
    // to ensure the planner flows chronologically from the start time.
    const remapped = items.map((item, idx) => {
      return { ...item, time: originalTimes[idx] };
    });

    setSchedule(remapped);
    // Explicitly call the API save so backend creates new Task models with updated times
    if (triggerSave) triggerSave(remapped);
  };

  const handleSaveModal = (updatedSlotData) => {
    updateFullSlot(updatedSlotData);
    setEditingSlot(null);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px' }}>
        <div className="loading-ring" />
        <span style={{ color: 'var(--text-secondary)' }}>Loading your schedule…</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
      {/* Header */}
      <header style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h1 style={{ marginBottom: '4px' }}>Daily Planner</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Drag tasks to reschedule them across your timeline.</p>
          </div>
          <div style={{
            background: 'rgba(0,255,100,0.1)',
            color: 'var(--status-success)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '12px',
            fontWeight: '700',
            border: '1px solid rgba(0,255,100,0.2)',
            flexShrink: 0,
          }}>
            🔒 Geo AI
          </div>
        </div>

        {/* Progress bar */}
        {progress.tracked > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="progress-bar" style={{ flex: 1 }}>
              <div className="progress-fill" style={{ width: `${progress.percent}%` }} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-primary)', flexShrink: 0 }}>
              {progress.done}/{progress.tracked} done ({progress.percent}%)
            </span>
          </div>
        )}
      </header>

      {/* AI Scheduler */}
      <section className="glass-panel" style={{ padding: '22px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <span style={{ fontSize: '18px' }}>⚡</span>
          <h3 style={{ fontSize: '15px', fontWeight: '700' }}>AI Decision Engine</h3>
        </div>

        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            className="glass-input"
            style={{ width: '100%' }}
            placeholder="Instruct the AI: E.g., 'Need 2 hours for physics revision tonight'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select
                className="glass-input"
                style={{ width: 'auto', minWidth: '130px', paddingRight: '28px' }}
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                title="Wake Time"
              >
                <option value="auto">Wake: Auto</option>
                <option value="04:00 AM">04:00 AM</option>
                <option value="05:00 AM">05:00 AM</option>
                <option value="06:00 AM">06:00 AM</option>
                <option value="07:00 AM">07:00 AM</option>
                <option value="08:00 AM">08:00 AM</option>
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
              </select>
              <select
                className="glass-input"
                style={{ width: 'auto', minWidth: '130px', paddingRight: '28px' }}
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                title="Sleep Time"
              >
                <option value="auto">Sleep: Auto</option>
                <option value="09:00 PM">09:00 PM</option>
                <option value="10:00 PM">10:00 PM</option>
                <option value="11:00 PM">11:00 PM</option>
                <option value="12:00 AM">12:00 AM</option>
                <option value="01:00 AM">01:00 AM</option>
                <option value="02:00 AM">02:00 AM</option>
              </select>
            </div>
            <button
              type="submit"
              className="glass-button primary"
              disabled={isGenerating || !prompt.trim()}
              style={{ padding: '12px 24px', flexShrink: 0, minWidth: '130px' }}
            >
              {isGenerating ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <div className="loading-ring" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                  Thinking…
                </span>
              ) : '✨ Generate'}
            </button>
          </div>
        </form>

        {generateError && (
          <div style={{
            marginTop: '12px',
            padding: '10px 14px',
            background: 'var(--status-error-dim)',
            border: '1px solid rgba(255,77,77,0.3)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            color: 'var(--status-error)',
          }}>
            {generateError}
          </div>
        )}
      </section>

      {/* Drag & Drop Timeline */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <StrictModeDroppable droppableId="planner-timeline">
          {(provided) => (
            <section
              {...provided.droppableProps}
              ref={provided.innerRef}
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              {schedule.map((slot, index) => (
                <TimeSlotRow key={slot.id} slot={slot} index={index} onEdit={setEditingSlot} />
              ))}
              {provided.placeholder}
            </section>
          )}
        </StrictModeDroppable>
      </DragDropContext>

      {/* Advanced Task Edit Modal */}
      {editingSlot && (
        <TaskModal 
          slot={editingSlot} 
          onClose={() => setEditingSlot(null)}
          onSave={handleSaveModal}
        />
      )}
    </div>
  );
};

export default PlannerEngine;
