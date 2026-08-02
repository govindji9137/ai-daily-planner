/**
 * GeoPlaner V2 — Dashboard (Shared Component)
 *
 * The modular dashboard assembler.
 * Assembles widgets injected by all enabled modules.
 */
import React, { useState, useEffect } from 'react';
import { useModules } from '../../contexts/ModuleContext';
import { usePlanner } from '../../contexts/PlannerContext';
import { useAuth } from '../../contexts/AuthContext';
import { apiGetPlansForDate, apiSetDefaultPlan } from '../../utils/api';

const PlanSelector = () => {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { fetchSchedule } = usePlanner();

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await apiGetPlansForDate(todayStr);
      if (res.success && res.data) {
        setPlans(res.data);
      }
    } catch (err) {
      console.error('Failed to load plans', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleSelect = async (e) => {
    const scheduleId = e.target.value;
    if (!scheduleId) return;
    
    try {
      setIsLoading(true);
      const todayStr = new Date().toISOString().split('T')[0];
      await apiSetDefaultPlan(scheduleId, todayStr);
      await fetchSchedule();
      await loadPlans();
    } catch (err) {
      console.error('Failed to set default plan', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (plans.length <= 1) return null; // No variations to select from

  return (
    <select 
      onChange={handleSelect}
      disabled={isLoading}
      value={plans.find(p => p.isDefault)?.id || ''}
      style={{
        padding: '8px 12px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)',
        color: 'var(--text-primary)',
        outline: 'none',
        cursor: 'pointer'
      }}
    >
      {plans.map((plan, index) => (
        <option key={plan.id} value={plan.id}>
          {plan.isDefault ? 'Active Plan' : `Alternative ${index + 1}`} ({new Date(plan.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})
        </option>
      ))}
    </select>
  );
};

const Dashboard = () => {
  const { dashboardWidgets } = useModules();
  const { currentTask, progress } = usePlanner();
  const { user } = useAuth();

  // Sort widgets by their defined order
  const sortedWidgets = [...dashboardWidgets].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '100px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ marginBottom: '8px' }}>
          Welcome back, <span style={{ color: 'var(--accent-primary)' }}>{(user?.data || user?.user || user)?.name || 'User'}</span> 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Here's your productivity overview for today.</p>
      </header>

      {/* Fixed Top Section (Pinned) */}
      <div className="dashboard-pinned">
        {/* Today's Progress */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>Today's Progress</h3>
          {progress.tracked > 0 ? (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '36px', fontWeight: '800', lineHeight: '1', color: 'var(--accent-primary)' }}>
                  {progress.percent}%
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px', paddingBottom: '4px' }}>
                  ({progress.done}/{progress.tracked} tasks)
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress.percent}%` }} />
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No tasks tracked yet today.</div>
          )}
        </div>

        {/* Current Task */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>Up Next</h3>
          {currentTask ? (
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{currentTask.time}</div>
              <div style={{ fontSize: '18px', fontWeight: '700' }}>{currentTask.task}</div>
            </div>
          ) : (
            <div style={{ color: 'var(--status-success)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🎉</span> All caught up for now!
            </div>
          )}
        </div>
      </div>

      {/* Plan Selection Section */}
      <div className="glass-panel" style={{ padding: '20px', marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '15px', marginBottom: '4px' }}>Daily Plan Variation</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
              Select a different plan generated for today if you prefer.
            </p>
          </div>
          <PlanSelector />
        </div>
      </div>

      {/* Module Widgets Assembler */}
      {sortedWidgets.length > 0 && (
        <div className="dashboard-modules">
          <div className="sidebar-section-label" style={{ paddingLeft: 0, marginTop: '16px', marginBottom: '8px' }}>
            Module Insights
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            {sortedWidgets.map((WidgetDef, idx) => (
              <WidgetDef.component key={`${WidgetDef.id}-${idx}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
