/**
 * GeoPlaner V2 — FocusTimer (Core Layer)
 * Phase 5 Architectural Integration
 */
import React, { useState, useEffect, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { usePlanner } from '../../contexts/PlannerContext';

const FocusTimer = ({ task: initialTask, onClose }) => {
  const { schedule, updateSlot, completeFocusSession, startTaskFocus } = usePlanner();

  // If standalone, we don't have a bound task yet. The user must select one.
  const isStandalone = initialTask?.id === 'standalone';
  const [selectedTaskId, setSelectedTaskId] = useState('');
  
  // The actual bound task (either passed in or selected)
  const task = isStandalone 
    ? schedule.find(s => String(s.id) === selectedTaskId) || null 
    : initialTask;

  const [position, setPosition] = useState({ x: window.innerWidth - 320, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);

  // Setup initial duration logic (Pomodoro segmentation)
  const initialMinutes = task?.estimatedDuration && task.estimatedDuration > 25 ? 25 : (task?.estimatedDuration || 25);
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(0);

  // App Blocker toggle
  const [enableBlocker, setEnableBlocker] = useState(false);
  const [distractions, setDistractions] = useState(0);

  // Load blocker settings
  const blockerSettings = useRef({ strictMode: true, maxStrikes: 3, penalty: 'fail_session' });
  useEffect(() => {
    try {
      const saved = localStorage.getItem('geo_blocker_settings');
      if (saved) blockerSettings.current = { ...blockerSettings.current, ...JSON.parse(saved) };
      setEnableBlocker(blockerSettings.current.strictMode);
    } catch(e) {}
  }, []);

  // Completion Form State
  const [endStatus, setEndStatus] = useState('COMPLETED');
  const [notes, setNotes] = useState('');
  const [skipReason, setSkipReason] = useState('');

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const beep = (startTime) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(880, startTime);
        gainNode.gain.setValueAtTime(0.2, startTime);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.2);
      };
      beep(audioCtx.currentTime);
      beep(audioCtx.currentTime + 0.4);
      setTimeout(() => audioCtx.close(), 1000);
    } catch (e) {}
  };

  // ─── STRICT FOCUS ENGINE (App Blocker) ───
  useEffect(() => {
    if (!enableBlocker || !isActive || isCompleted) return;

    const handleDistraction = async () => {
      const newDistractions = distractions + 1;
      setDistractions(newDistractions);
      
      const { maxStrikes, penalty } = blockerSettings.current;
      
      // Fire notification
      try {
        await LocalNotifications.schedule({
          notifications: [{
            title: 'GeoPlaner Strict Focus',
            body: `Get back to work! (Strike ${newDistractions}/${maxStrikes === 999 ? '∞' : maxStrikes})`,
            id: new Date().getTime(),
          }]
        });
      } catch (e) {
        console.warn('LocalNotifications failed', e);
      }

      // Check penalty
      if (newDistractions >= maxStrikes) {
        if (penalty === 'fail_session') {
          setIsActive(false);
          setIsCompleted(true);
          setEndStatus('SKIPPED');
          setSkipReason(`Failed due to Strict Focus Mode penalty. Exceeded ${maxStrikes} allowed distractions.`);
          setSessionDurationMinutes(Math.round((initialMinutes * 60 - timeLeft) / 60));
          playBeep();
        }
      }
    };

    // 1. Web visibility listener
    const onVisChange = () => {
      if (document.hidden) handleDistraction();
    };
    document.addEventListener('visibilitychange', onVisChange);

    // 2. Capacitor App background listener
    let capListener = null;
    CapApp.addListener('appStateChange', (state) => {
      if (!state.isActive) handleDistraction();
    }).then(listener => { capListener = listener; }).catch(() => {});

    return () => {
      document.removeEventListener('visibilitychange', onVisChange);
      if (capListener) capListener.remove();
    };
  }, [isActive, enableBlocker, isCompleted, distractions, initialMinutes, timeLeft]);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (isActive && timeLeft <= 0) {
      setIsActive(false);
      setIsCompleted(true);
      playBeep();
      setSessionDurationMinutes(Math.round((initialMinutes * 60 - timeLeft) / 60) || initialMinutes);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, initialMinutes]);

  // Drag logic
  const handleMouseDown = (e) => {
    if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'button' || e.target.tagName.toLowerCase() === 'textarea' || e.target.tagName.toLowerCase() === 'select') return;
    setIsDragging(true);
    dragRef.current = { startX: e.clientX - position.x, startY: e.clientY - position.y };
  };
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragRef.current.startX, y: e.clientY - dragRef.current.startY });
  };
  const handleMouseUp = () => setIsDragging(false);
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const toggleTimer = () => {
    if (!isActive && !isCompleted && task) {
      // Transition to ACTIVE in planner timeline
      updateSlot(task.id, 'status', 'ACTIVE');
    }
    setIsActive(!isActive);
  };

  const handleEndEarly = () => {
    setIsActive(false);
    setIsCompleted(true);
    setSessionDurationMinutes(Math.round((initialMinutes * 60 - timeLeft) / 60));
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    let finalStatus = endStatus;
    if (endStatus === 'CONTINUE_LATER') finalStatus = 'ACTIVE';
    
    await completeFocusSession(task.id, sessionDurationMinutes, finalStatus, notes, skipReason);
  };

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = (initialMinutes * 60 - timeLeft) / (initialMinutes * 60);

  return (
    <div
      className="glass-panel"
      style={{
        position: 'fixed',
        width: '300px',
        padding: '20px',
        zIndex: 1000,
        userSelect: 'none',
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        boxShadow: '0 15px 35px rgba(0,0,0,0.5), 0 0 20px rgba(138, 43, 226, 0.4)',
        border: '1px solid rgba(138, 43, 226, 0.3)',
      }}
      onMouseDown={handleMouseDown}
    >
      <button
        style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer' }}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        ×
      </button>

      {/* Header */}
      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isActive ? 'var(--status-success)' : 'var(--accent-secondary)', boxShadow: `0 0 8px ${isActive ? 'var(--status-success)' : 'var(--accent-secondary)'}`, display: 'inline-block' }} />
        {isActive ? 'Focusing…' : (isCompleted ? 'Session Ended' : 'Focus Timer')}
      </div>
      
      {/* Task Selection or Display */}
      {isStandalone && !isActive && !isCompleted ? (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Select Task to Focus On</div>
          <select 
            className="glass-input" 
            value={selectedTaskId}
            onChange={(e) => {
              setSelectedTaskId(e.target.value);
              // Reset time left to the selected task's duration
              const selectedTask = schedule.find(s => String(s.id) === e.target.value);
              if (selectedTask) {
                const initMins = selectedTask.estimatedDuration && selectedTask.estimatedDuration > 25 ? 25 : (selectedTask.estimatedDuration || 25);
                setTimeLeft(initMins * 60);
              }
            }}
          >
            <option value="" disabled>-- Choose a scheduled task --</option>
            {schedule.filter(s => s.type === 'focus' && s.status !== 'COMPLETED').map(s => (
              <option key={s.id} value={s.id}>{s.task}</option>
            ))}
          </select>
        </div>
      ) : (
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {task?.task || 'No task selected'}
        </div>
      )}

      {!isCompleted ? (
        <>
          {/* Time Display */}
          <div style={{ fontSize: '42px', fontWeight: '700', textAlign: 'center', margin: '10px 0', fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(timeLeft)}
          </div>

          <div className="progress-bar" style={{ marginBottom: '14px' }}>
            <div className="progress-fill" style={{ width: `${Math.max(0, progress * 100)}%` }} />
          </div>

          {/* App Blocker Toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>🛡️ Strict Focus Engine</span>
              <input 
                type="checkbox" 
                checked={enableBlocker} 
                onChange={(e) => setEnableBlocker(e.target.checked)} 
                style={{ cursor: 'pointer' }}
              />
            </div>
            {enableBlocker && (
              <div style={{ background: 'rgba(231,76,60,0.1)', color: 'var(--status-error)', padding: '6px 10px', borderRadius: '4px', fontSize: '11px' }}>
                Strikes: {distractions} / {blockerSettings.current.maxStrikes === 999 ? '∞' : blockerSettings.current.maxStrikes}
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="glass-button" 
              style={{ flex: 1, padding: '8px', fontSize: '14px', background: isActive ? 'var(--glass-bg)' : 'var(--accent-primary)', color: isActive ? 'inherit' : 'var(--bg-primary)', opacity: (!task && isStandalone) ? 0.5 : 1 }} 
              onClick={(e) => { e.stopPropagation(); toggleTimer(); }}
              disabled={!task && isStandalone}
            >
              {isActive ? 'Pause' : 'Start Focus'}
            </button>
            <button className="glass-button secondary" style={{ flex: 1, padding: '8px', fontSize: '14px' }} onClick={(e) => { e.stopPropagation(); handleEndEarly(); }}>
              End Early
            </button>
          </div>
        </>
      ) : (
        /* Completion Form */
        <form onSubmit={handleFinalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            You focused for <strong>{sessionDurationMinutes} minutes</strong>. What's the status of this task?
          </div>
          
          <select 
            className="glass-input" 
            value={endStatus} 
            onChange={(e) => setEndStatus(e.target.value)}
          >
            <option value="COMPLETED">✅ Completed</option>
            <option value="CONTINUE_LATER">⏳ Continue Later</option>
            <option value="SKIPPED">❌ Skipped</option>
            <option value="CANCELLED">🚫 Cancelled</option>
          </select>

          {endStatus === 'SKIPPED' && (
            <textarea
              className="glass-input"
              style={{ minHeight: '60px', resize: 'vertical' }}
              placeholder="Why did you skip?"
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              required
            />
          )}

          <textarea
            className="glass-input"
            style={{ minHeight: '60px', resize: 'vertical' }}
            placeholder="Any session notes?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button type="submit" className="glass-button primary" style={{ background: 'var(--accent-primary)', color: 'var(--bg-primary)' }}>
            Save Session
          </button>
        </form>
      )}
    </div>
  );
};

export default FocusTimer;
