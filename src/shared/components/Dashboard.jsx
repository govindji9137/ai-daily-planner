/**
 * GeoPlaner V2 — Dashboard (Shared Component)
 *
 * The modular dashboard assembler.
 * Assembles widgets injected by all enabled modules.
 */
import React from 'react';
import { useModules } from '../../contexts/ModuleContext';
import { usePlanner } from '../../contexts/PlannerContext';
import { useAuth } from '../../contexts/AuthContext';

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
