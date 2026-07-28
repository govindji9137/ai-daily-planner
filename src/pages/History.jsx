import React, { useState, useEffect } from 'react';
import { apiGetHistory } from '../utils/api';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await apiGetHistory();
        setHistory(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedDate(res.data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return <div style={{textAlign:'center', padding:'50px', color:'var(--text-secondary)'}}>Loading history...</div>;
  }

  if (history.length === 0) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <h1>History</h1>
          <p style={{color: 'var(--text-secondary)'}}>Review your past schedules.</p>
        </header>
        <div className="glass-panel" style={{textAlign: 'center', padding: '40px'}}>
          <div style={{fontSize: '48px', marginBottom: '16px'}}>📅</div>
          <h3>No History Yet</h3>
          <p style={{color: 'var(--text-secondary)'}}>Your daily schedules will appear here once saved.</p>
        </div>
      </div>
    );
  }

  const selectedSlots = selectedDate?.slots || [];

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>History</h1>
        <p style={{color: 'var(--text-secondary)'}}>Review your past schedules and reflections.</p>
      </header>

      <div style={{display: 'flex', gap: '20px'}}>
        {/* Date Selector Sidebar */}
        <div style={styles.sidebar}>
          <h3 style={{marginBottom: '15px'}}>Past Days</h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '600px', overflowY: 'auto'}}>
            {history.map(record => (
              <button 
                key={record.id}
                className={`glass-button ${selectedDate?.id === record.id ? 'primary' : 'secondary'}`}
                style={{textAlign: 'left', padding: '10px 15px', border: selectedDate?.id === record.id ? '1px solid var(--accent-primary)' : '1px solid transparent'}}
                onClick={() => setSelectedDate(record)}
              >
                {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule Display */}
        <div style={{flex: 1}}>
          <h2 style={{marginBottom: '20px'}}>
            Schedule for {new Date(selectedDate.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h2>
          
          <div style={styles.timeline}>
            {selectedSlots.map((slot) => (
              <div key={slot.id} className="glass-panel" style={{...styles.timeSlotWrapper, borderLeft: `4px solid ${slot.type === 'focus' ? 'var(--accent-primary)' : 'var(--accent-secondary)'}`}}>
                <div style={styles.timeSlotMain}>
                  <div style={styles.time}>{slot.time}</div>
                  <div style={styles.task}>{slot.task}</div>
                  
                  <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                    <span style={{...styles.badge, background: slot.type === 'focus' ? 'rgba(138, 43, 226, 0.2)' : 'rgba(0, 210, 255, 0.2)', color: slot.type === 'focus' ? 'var(--accent-primary)' : 'var(--accent-secondary)'}}>
                      {slot.type === 'focus' ? 'Focus Mode' : 'Break'}
                    </span>
                    
                    {slot.isCompleted === true && <span style={{color: '#00cc66', fontWeight: 'bold'}}>✅ Done</span>}
                    {slot.isCompleted === false && <span style={{color: '#ff4d4d', fontWeight: 'bold'}}>❌ Missed</span>}
                    {slot.isCompleted === null && <span style={{color: 'var(--text-secondary)'}}>➖ No Data</span>}
                  </div>
                </div>

                {(slot.notes || slot.incompleteReason) && (
                  <div style={styles.expandedArea}>
                    {slot.notes && (
                      <div style={{marginBottom: '10px'}}>
                        <label style={styles.label}>Notes</label>
                        <div style={styles.readonlyText}>{slot.notes}</div>
                      </div>
                    )}
                    
                    {slot.incompleteReason && (
                      <div>
                        <label style={{...styles.label, color: '#ff4d4d'}}>Reason for missing</label>
                        <div style={{...styles.readonlyText, borderColor: 'rgba(255,77,77,0.3)'}}>{slot.incompleteReason}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    paddingBottom: '100px'
  },
  header: {
    marginBottom: '30px'
  },
  sidebar: {
    width: '200px',
    flexShrink: 0
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  timeSlotWrapper: {
    display: 'flex',
    flexDirection: 'column',
  },
  timeSlotMain: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px 20px',
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
    fontSize: '16px',
    fontWeight: '500'
  },
  badge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  label: {
    display: 'block',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    marginBottom: '6px'
  },
  readonlyText: {
    padding: '10px 15px',
    background: 'rgba(0,0,0,0.1)',
    borderRadius: '8px',
    border: '1px solid var(--glass-border)',
    fontSize: '14px',
    whiteSpace: 'pre-wrap'
  }
};

export default History;
