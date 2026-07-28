import React, { useState, useEffect, useRef } from 'react';
import { apiGetSchedule, apiGenerateSchedule, apiSaveSchedule } from '../utils/api';

const initialSchedule = [
  { id: 1, time: '12:00 AM', task: 'Sleep', type: 'break', isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 2, time: '01:00 AM', task: 'Sleep', type: 'break', isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 3, time: '02:00 AM', task: 'Sleep', type: 'break', isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 4, time: '03:00 AM', task: 'Sleep', type: 'break', isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 5, time: '04:00 AM', task: 'Sleep', type: 'break', isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 6, time: '05:00 AM', task: 'Sleep', type: 'break', isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 7, time: '06:00 AM', task: 'Wake up & Stretch', type: 'break', isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 8, time: '07:00 AM', task: 'Breakfast', type: 'break', isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 9, time: '08:00 AM', task: 'Morning Commute', type: 'break', isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 10, time: '09:00 AM', task: 'Deep Work: Coding', type: 'focus', isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 11, time: '10:00 AM', task: 'Team Meeting', type: 'focus', isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 12, time: '11:00 AM', task: 'Code Review', type: 'focus', isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 13, time: '12:00 PM', task: 'Lunch Break', type: 'break', isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 14, time: '01:00 PM', task: 'Client Calls', type: 'focus', isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 15, time: '02:00 PM', task: 'Focused Work', type: 'focus', isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 16, time: '03:00 PM', task: 'Planning & Emails', type: 'focus', isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 17, time: '04:00 PM', task: 'Wrap up tasks', type: 'focus', isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 18, time: '05:00 PM', task: 'Commute', type: 'break', isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 19, time: '06:00 PM', task: 'Workout', type: 'break', isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 20, time: '07:00 PM', task: 'Dinner', type: 'break', isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 21, time: '08:00 PM', task: 'Reading / Learning', type: 'focus', isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 22, time: '09:00 PM', task: 'Relaxation', type: 'break', isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 23, time: '10:00 PM', task: 'Wind down', type: 'break', isCompleted: null, notes: '', incompleteReason: '', expanded: false },
  { id: 24, time: '11:00 PM', task: 'Sleep', type: 'break', isCompleted: null, notes: '', incompleteReason: '', expanded: false },
];

const Planner = () => {
  const [prompt, setPrompt] = useState('');
  const [schedule, setSchedule] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use a ref to debounce saves so we don't spam the API on every keystroke
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    setIsLoading(true);
    try {
      const res = await apiGetSchedule();
      if (res.data && res.data.slots && res.data.slots.length > 0) {
        setSchedule(res.data.slots);
      } else {
        setSchedule(initialSchedule);
      }
    } catch (err) {
      console.error('Failed to load schedule:', err);
      setSchedule(initialSchedule); // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const generatePlan = async (userPrompt) => {
    setIsGenerating(true);
    try {
      // The backend uses the Gemini key from .env and fetches yesterday's context automatically!
      const res = await apiGenerateSchedule(userPrompt);
      const parsedSchedule = res.data.map(slot => ({
        ...slot,
        isCompleted: null,
        notes: '',
        incompleteReason: '',
        expanded: false
      }));
      setSchedule(parsedSchedule);
      setPrompt('');
    } catch (err) {
      console.error(err);
      alert("Error generating schedule: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    generatePlan(prompt);
  };

  const countWords = (str) => {
    return str.trim() ? str.trim().split(/\s+/).length : 0;
  };

  // Helper to trigger a save to backend whenever schedule changes
  const triggerSave = (newSchedule) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await apiSaveSchedule(newSchedule);
      } catch (err) {
        console.error('Failed to save schedule:', err);
      }
    }, 1000); // 1-second debounce
  };

  const updateSlot = (id, field, value) => {
    setSchedule(prev => {
      const newSchedule = prev.map(slot => {
        if (slot.id === id) {
          if (field === 'notes' && countWords(value) > 200) return slot;
          if (field === 'incompleteReason' && countWords(value) > 100) return slot;
          return { ...slot, [field]: value };
        }
        return slot;
      });
      triggerSave(newSchedule);
      return newSchedule;
    });
  };

  const toggleExpand = (id) => {
    setSchedule(prev => prev.map(slot => 
      slot.id === id ? { ...slot, expanded: !slot.expanded } : slot
    ));
  };

  if (isLoading) {
    return <div style={{textAlign:'center', padding:'50px', color:'var(--text-secondary)'}}>Loading your schedule...</div>;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <div>
            <h1>Your Day</h1>
            <p style={{color: 'var(--text-secondary)'}}>Plan your hours for maximum productivity.</p>
          </div>
          {/* We completely removed the API key input because the backend handles it safely now! */}
          <div style={styles.secureBadge}>
            🔒 Secured by Server
          </div>
        </div>
      </header>

      <section className="glass-panel" style={styles.aiSection}>
        <h3 style={{marginBottom: '10px'}}>AI Auto-Schedule</h3>
        <form onSubmit={handleGenerate} style={{display: 'flex', gap: '10px'}}>
          <input 
            type="text" 
            className="glass-input" 
            placeholder="E.g., I wake up at 8 AM, need 1 hour for lunch, and want to study coding for 2 hours."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button type="submit" className="glass-button" disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </form>
      </section>

      <section style={styles.timeline}>
        {schedule.map((slot) => (
          <div key={slot.id} className="glass-panel" style={{...styles.timeSlotWrapper, borderLeft: `4px solid ${slot.type === 'focus' ? 'var(--accent-primary)' : 'var(--accent-secondary)'}`}}>
            <div style={styles.timeSlotMain}>
              <div style={styles.time}>{slot.time}</div>
              <div style={styles.task}>{slot.task}</div>
              
              <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                <span style={{...styles.badge, background: slot.type === 'focus' ? 'rgba(138, 43, 226, 0.2)' : 'rgba(0, 210, 255, 0.2)', color: slot.type === 'focus' ? 'var(--accent-primary)' : 'var(--accent-secondary)'}}>
                  {slot.type === 'focus' ? 'Focus Mode' : 'Break'}
                </span>
                
                <select 
                  className="glass-input"
                  style={{width: 'auto', padding: '6px', fontSize: '12px'}}
                  value={slot.isCompleted === true ? 'true' : (slot.isCompleted === false ? 'false' : '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateSlot(slot.id, 'isCompleted', val === '' ? null : val === 'true');
                    if(val !== '') toggleExpand(slot.id);
                  }}
                >
                  <option value="">Status</option>
                  <option value="true">✅ Done</option>
                  <option value="false">❌ Missed</option>
                </select>

                <button className="glass-button secondary" style={styles.iconBtn} onClick={() => toggleExpand(slot.id)}>
                  {slot.expanded ? '−' : '+'}
                </button>
              </div>
            </div>

            {slot.expanded && (
              <div style={styles.expandedArea}>
                <div style={{marginBottom: '10px'}}>
                  <label style={styles.label}>Notes (max 200 words): {countWords(slot.notes || '')}/200</label>
                  <textarea 
                    className="glass-input" 
                    style={styles.textarea}
                    value={slot.notes || ''}
                    onChange={(e) => updateSlot(slot.id, 'notes', e.target.value)}
                    placeholder="Add task notes here..."
                  />
                </div>
                
                {slot.isCompleted === false && (
                  <div>
                    <label style={{...styles.label, color: '#ff4d4d'}}>Reason for missing (Required, max 100 words): {countWords(slot.incompleteReason || '')}/100</label>
                    <textarea 
                      className="glass-input" 
                      style={{...styles.textarea, borderColor: (slot.incompleteReason || '').trim() === '' ? '#ff4d4d' : 'var(--glass-border)'}}
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
        ))}
      </section>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    paddingBottom: '100px'
  },
  header: {
    marginBottom: '30px'
  },
  secureBadge: {
    background: 'rgba(0,255,100,0.1)',
    color: '#00cc66',
    padding: '8px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    border: '1px solid rgba(0,255,100,0.2)'
  },
  aiSection: {
    padding: '20px',
    marginBottom: '40px'
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  timeSlotWrapper: {
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s',
  },
  timeSlotMain: {
    display: 'flex',
    alignItems: 'center',
    padding: '20px',
  },
  expandedArea: {
    padding: '0 20px 20px 20px',
    borderTop: '1px solid var(--glass-border)',
    marginTop: '-5px',
    paddingTop: '15px'
  },
  time: {
    fontWeight: '600',
    width: '100px',
    color: 'var(--text-secondary)'
  },
  task: {
    flex: 1,
    fontSize: '18px',
    fontWeight: '500'
  },
  badge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  iconBtn: {
    width: '32px',
    height: '32px',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    border: '1px solid var(--glass-border)',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    marginBottom: '6px'
  },
  textarea: {
    width: '100%',
    minHeight: '60px',
    resize: 'vertical',
    fontFamily: 'inherit',
    fontSize: '14px'
  }
};

export default Planner;
