import React, { useState, useEffect } from 'react';
import { healthService } from './health.service';
import { ExecutionTaskCard } from '../../shared/components/ExecutionTaskCard';

export const HealthTracker = () => {
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    healthService.getTodayHealthPlan().then(setPlan);
  }, []);

  if (!plan) return <div style={{ padding: '24px', textAlign: 'center' }}>Loading GeoHealth Sync...</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>💊 Health Today</h1>
          <p style={{ color: 'var(--text-secondary)' }}>GeoPlaner Execution Layer synced with GeoHealth</p>
        </div>
        <div style={{ padding: '8px 12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
          {plan.syncStatus === 'synced' ? '✓ Synced with GeoHealth' : 'Syncing...'}
        </div>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent-primary)', marginBottom: '8px' }}>{plan.completionPercentage}%</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Today's Completion</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>{plan.todayWater.current}/{plan.todayWater.target}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Glasses of Water</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '8px' }}>{plan.healthStreakDays} 🔥</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Health Streak</div>
        </div>
      </div>

      <section className="glass-panel" style={{ padding: '24px', marginBottom: '24px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
        <h3 style={{ marginBottom: '8px', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>✨</span> AI Health Recommendation
        </h3>
        <p style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.5' }}>{plan.aiRecommendation}</p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <section className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Today's Workout</h3>
          <ExecutionTaskCard 
            task={plan.todayWorkout} 
            onTaskUpdate={(updated) => setPlan({ ...plan, todayWorkout: updated })}
          />
        </section>

        <section className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Today's Medicines</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {plan.todayMedicines.map(med => (
              <ExecutionTaskCard 
                key={med.id} 
                task={med} 
                onTaskUpdate={(updated) => {
                  const newMeds = plan.todayMedicines.map(m => m.id === updated.id ? updated : m);
                  setPlan({ ...plan, todayMedicines: newMeds });
                }}
              />
            ))}
          </div>
        </section>
      </div>

      <section className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
        <h3 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🌙</span> Sleep Goal
        </h3>
        <p style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{plan.todaySleepGoal}</p>
      </section>
    </div>
  );
};
