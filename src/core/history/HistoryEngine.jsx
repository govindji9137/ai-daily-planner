/**
 * GeoPlaner V2 — HistoryEngine (Core Layer)
 * Refactored from src/pages/History.jsx
 * Logic fully preserved. Now in core/history/.
 */
import React, { useState, useEffect } from 'react';
import { apiGetHistory } from '../../utils/api';

const HistoryEngine = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'focus' | 'break'

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await apiGetHistory();
        setHistory(res.data || []);
        if (res.data?.length > 0) setSelectedDate(res.data[0]);
      } catch (err) {
        console.error('[HistoryEngine] Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: '300px' }}>
        <div className="loading-ring" />
        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading history…</span>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <header style={{ marginBottom: '28px' }}>
          <h1>History</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Review your past schedules.</p>
        </header>
        <div className="glass-panel empty-state">
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-title">No History Yet</div>
          <div className="empty-state-desc">Your daily schedules will appear here once saved.</div>
        </div>
      </div>
    );
  }

  const selectedSlots = (selectedDate?.slots || []).filter((s) =>
    filter === 'all' ? true : s.type === filter
  );

  const dayStats = (() => {
    const slots = selectedDate?.slots || [];
    const tracked = slots.filter((s) => s.type === 'focus');
    const done = tracked.filter((s) => s.status === 'COMPLETED').length;
    return { total: slots.length, tracked: tracked.length, done };
  })();

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '100px' }}>
      <header style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>History</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Review your past schedules and reflections.</p>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Date sidebar */}
        <div style={{ width: '200px', flexShrink: 0 }}>
          <h3 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Past Days</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '600px', overflowY: 'auto' }}>
            {history.map((record) => (
              <button
                key={record.id}
                className={`nav-btn ${selectedDate?.id === record.id ? 'active' : ''}`}
                style={{ padding: '10px 14px', fontSize: '13px', borderRadius: 'var(--radius-md)' }}
                onClick={() => setSelectedDate(record)}
              >
                {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule display */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '18px' }}>
              {new Date(selectedDate.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              {/* Day stats */}
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                ✅ {dayStats.done}/{dayStats.tracked} completed
              </span>

              {/* Filter */}
              <select
                className="glass-input"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="focus">Focus only</option>
                <option value="break">Break only</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {selectedSlots.map((slot) => (
              <div
                key={slot.id}
                className="glass-panel"
                style={{ borderLeft: `4px solid ${slot.type === 'focus' ? 'var(--accent-primary)' : 'var(--accent-secondary)'}` }}
              >
                <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', gap: '14px' }}>
                  <div style={{ fontWeight: '600', width: '90px', color: 'var(--text-secondary)', fontSize: '13px', flexShrink: 0 }}>
                    {slot.time}
                  </div>
                  <div style={{ flex: 1, fontSize: '15px', fontWeight: '500' }}>{slot.task}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <span className={`task-type-badge ${slot.type === 'focus' ? 'task-type-focus' : 'task-type-break'}`}>
                      {slot.type === 'focus' ? 'Focus' : 'Break'}
                    </span>
                    {slot.status === 'COMPLETED'  && <span className="status-done">✅ Done</span>}
                    {slot.status === 'SKIPPED' && <span className="status-missed">❌ Skipped</span>}
                    {(slot.status === 'SCHEDULED' || slot.status === 'DRAFT')  && <span className="status-pending">➖ Pending</span>}
                  </div>
                </div>

                {(slot.notes || slot.incompleteReason) && (
                  <div style={{ padding: '0 18px 16px', borderTop: '1px solid var(--glass-border)', paddingTop: '14px' }}>
                    {slot.notes && (
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notes</span>
                        <div style={{ marginTop: '4px', padding: '8px 12px', background: 'rgba(0,0,0,0.1)', borderRadius: 'var(--radius-md)', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
                          {slot.notes}
                        </div>
                      </div>
                    )}
                    {slot.incompleteReason && (
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--status-error)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reason Missed</span>
                        <div style={{ marginTop: '4px', padding: '8px 12px', background: 'rgba(255,77,77,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,77,77,0.2)', fontSize: '13px', whiteSpace: 'pre-wrap', color: 'var(--status-error)' }}>
                          {slot.incompleteReason}
                        </div>
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

export default HistoryEngine;
