import React, { useState, useEffect } from 'react';
import { creatorService } from './creator.service';
import { ExecutionTaskCard } from '../../shared/components/ExecutionTaskCard';

export const CreatorContentCalendar = () => {
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    creatorService.getTodayCreatorPlan().then(setPlan);
  }, []);

  if (!plan) return <div style={{ padding: '24px', textAlign: 'center' }}>Loading Creator Hub Sync...</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>🎬 Creator Today</h1>
          <p style={{ color: 'var(--text-secondary)' }}>GeoPlaner Execution Layer synced with Creator Hub</p>
        </div>
        <div style={{ padding: '8px 12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
          {plan.syncStatus === 'synced' ? '✓ Synced with Creator Hub' : 'Syncing...'}
        </div>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent-primary)', marginBottom: '8px' }}>{plan.completionPercentage}%</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Today's Completion</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px', lineHeight: '1.2' }}>{plan.weeklyProgress}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Weekly Progress</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '8px' }}>{plan.consistencyStreak} 🔥</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Consistency Streak</div>
        </div>
      </div>

      <section className="glass-panel" style={{ padding: '24px', marginBottom: '24px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
        <h3 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🎯</span> Current Goal
        </h3>
        <p style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{plan.currentGoal}</p>
      </section>

      <section className="glass-panel" style={{ padding: '24px', marginBottom: '24px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
        <h3 style={{ marginBottom: '8px', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>✨</span> AI Schedule Adjustment
        </h3>
        <p style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.5' }}>{plan.aiRecommendation}</p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <section className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Today's Recording</h3>
          <ExecutionTaskCard 
            task={plan.todayRecording} 
            onTaskUpdate={(updated) => setPlan({ ...plan, todayRecording: updated })}
          />
        </section>

        <section className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Today's Editing</h3>
          <ExecutionTaskCard 
            task={plan.todayEditing} 
            onTaskUpdate={(updated) => setPlan({ ...plan, todayEditing: updated })}
          />
        </section>
      </div>

      <section className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
        <h3 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🚀</span> Scheduled Upload Today
        </h3>
        <ExecutionTaskCard 
          task={plan.todayUpload} 
          onTaskUpdate={(updated) => setPlan({ ...plan, todayUpload: updated })}
        />
      </section>
    </div>
  );
};
