import React, { useState, useEffect } from 'react';
import { professionalService } from './professional.service';
import { ExecutionTaskCard } from '../../shared/components/ExecutionTaskCard';

export const ProfessionalProjects = () => {
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    professionalService.getTodayWorkPlan().then(setPlan);
  }, []);

  if (!plan) return <div style={{ padding: '24px', textAlign: 'center' }}>Loading Professional Sync...</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>💼 Work Today</h1>
          <p style={{ color: 'var(--text-secondary)' }}>GeoPlaner Execution Layer synced with Professional & Calendar</p>
        </div>
        <div style={{ padding: '8px 12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
          {plan.syncStatus === 'synced' ? '✓ Synced with Workspace' : 'Syncing...'}
        </div>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent-primary)', marginBottom: '8px' }}>{plan.completionPercentage}%</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Today's Completion</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>{plan.productivityScore}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Productivity Score</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '8px', lineHeight: '1.2' }}>{plan.currentPriority}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Current Priority</div>
        </div>
      </div>

      <section className="glass-panel" style={{ padding: '24px', marginBottom: '24px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
        <h3 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⏱️</span> Deadlines Today
        </h3>
        <p style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{plan.deadlinesToday}</p>
      </section>

      <section className="glass-panel" style={{ padding: '24px', marginBottom: '24px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
        <h3 style={{ marginBottom: '8px', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>✨</span> AI Schedule Adjustment
        </h3>
        <p style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.5' }}>{plan.aiRecommendation}</p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <section className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Today's Meetings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {plan.todayMeetings.map(meeting => (
              <ExecutionTaskCard 
                key={meeting.id} 
                task={meeting} 
                onTaskUpdate={(updated) => {
                  const newMeetings = plan.todayMeetings.map(m => m.id === updated.id ? updated : m);
                  setPlan({ ...plan, todayMeetings: newMeetings });
                }}
              />
            ))}
          </div>
        </section>

        <section className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Today's Tasks</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {plan.todayTasks.map(task => (
              <ExecutionTaskCard 
                key={task.id} 
                task={task} 
                onTaskUpdate={(updated) => {
                  const newTasks = plan.todayTasks.map(t => t.id === updated.id ? updated : t);
                  setPlan({ ...plan, todayTasks: newTasks });
                }}
              />
            ))}
          </div>
          <button className="glass-button primary" style={{ marginTop: '16px', width: '100%' }}>Start Deep Work Focus</button>
        </section>
      </div>
    </div>
  );
};
