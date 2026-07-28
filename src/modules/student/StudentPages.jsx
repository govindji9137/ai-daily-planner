import React, { useState } from 'react';
import { usePlanner } from '../../contexts/PlannerContext';
import { studentService } from './student.service';
import { ExecutionTaskCard } from '../../shared/components/ExecutionTaskCard';
import { createTask, TASK_TYPE, TASK_PRIORITY, MODULE_ID } from '../../shared/models/task.model';
export const StudentStudyPlanner = () => {
  const { schedule, updateFullSlot } = usePlanner();
  const [topic, setTopic] = useState('');

  const studentTasks = schedule.filter(s => s.moduleId === MODULE_ID.STUDENT);

  const handleAddStudyBlock = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    // Find the first DRAFT or SCHEDULED slot that is 'flexible' or a 'break' to replace
    // This is a naive implementation; the Decision Engine will do this properly later
    const slotToReplace = schedule.find(s => s.status !== 'ACTIVE' && s.status !== 'COMPLETED' && s.type !== 'fixed');
    
    if (slotToReplace) {
      updateFullSlot({
        ...slotToReplace,
        task: `Study: ${topic}`,
        moduleId: MODULE_ID.STUDENT,
        type: 'focus',
        priority: 'high',
        energyLevel: 'HIGH',
        focusLevel: 'DEEP',
        category: 'study'
      });
      setTopic('');
    } else {
      alert("No available slots to schedule a study block today!");
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ marginBottom: '8px' }}>🎓 Today's Learning</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Schedule deep work sessions and track your academic progress locally before Srixam integration.</p>
      </header>

      <section className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Schedule a Study Block</h3>
        <form onSubmit={handleAddStudyBlock} style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            className="glass-input" 
            placeholder="What do you need to study? (e.g. Physics Chapter 4)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="glass-button primary">
            Add to Master Planner
          </button>
        </form>
      </section>

      <section>
        <h3 style={{ marginBottom: '16px' }}>Today's Study Plan</h3>
        {studentTasks.length === 0 ? (
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No study blocks scheduled for today.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {studentTasks.map(task => (
              <div key={task.id} className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: '600' }}>{task.task}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {task.time} • {task.focusLevel} Focus
                  </div>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: task.status === 'COMPLETED' ? 'var(--status-success)' : 'var(--text-secondary)' }}>
                  {task.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export const StudentExams = () => {
  const [plan, setPlan] = useState(null);

  React.useEffect(() => {
    studentService.getTodayExecutionPlan().then(setPlan);
  }, []);

  if (!plan) return <div style={{ padding: '24px', textAlign: 'center' }}>Loading Srixam Sync...</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>🎓 Learning Overview</h1>
          <p style={{ color: 'var(--text-secondary)' }}>GeoPlaner Execution Layer synced with Srixam</p>
        </div>
        <div style={{ padding: '8px 12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
          {plan.syncStatus === 'synced' ? '✓ Synced with Srixam' : 'Syncing...'}
        </div>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent-primary)', marginBottom: '8px' }}>{plan.completionPercentage}%</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Today's Completion</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>{plan.timeStudiedMinutes}m</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Time Studied Today</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '8px' }}>{plan.studyStreakDays} 🔥</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Day Streak</div>
        </div>
      </div>

      <section className="glass-panel" style={{ padding: '24px', marginBottom: '24px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
        <h3 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⏱️</span> Next Major Deadline
        </h3>
        <p style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{plan.upcomingExamCountdown}</p>
      </section>

      <section className="glass-panel" style={{ padding: '24px', marginBottom: '24px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
        <h3 style={{ marginBottom: '8px', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>✨</span> AI Recommendation
        </h3>
        <p style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.5' }}>{plan.aiRecommendation}</p>
      </section>

      <div className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>Today's Study Tasks</h3>
          <button className="glass-button primary" style={{ padding: '6px 16px', fontSize: '13px' }}>Quick Start Focus</button>
        </div>
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
      </div>
    </div>
  );
};
