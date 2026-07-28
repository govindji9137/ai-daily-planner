import React, { useState, useEffect } from 'react';
import { apiGetGoals, apiCreateGoal, apiUpdateGoalProgress } from '../utils/api';

const GoalsManager = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', category: 'Personal', priority: 'medium', targetDate: '' });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await apiGetGoals();
      setGoals(res.data || []);
    } catch (err) {
      console.error('Failed to fetch goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      await apiCreateGoal(newGoal);
      setShowAdd(false);
      setNewGoal({ title: '', description: '', category: 'Personal', priority: 'medium', targetDate: '' });
      fetchGoals();
    } catch (err) {
      console.error('Failed to create goal:', err);
    }
  };

  const updateProgress = async (id, currentProgress, increment) => {
    try {
      const newProgress = Math.min(100, Math.max(0, currentProgress + increment));
      await apiUpdateGoalProgress(id, { progress: newProgress });
      fetchGoals();
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  };

  if (loading) return <div style={{textAlign:'center', padding:'50px'}}>Loading goals...</div>;

  return (
    <div className="goals-page" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.3s ease-in-out' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>Long-term Goals</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track your major milestones and life objectives.</p>
        </div>
        <button className="glass-button primary" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : '+ New Goal'}
        </button>
      </header>

      {showAdd && (
        <form onSubmit={handleCreateGoal} className="glass-panel animate-slide-up" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Create New Goal</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <input 
              type="text" 
              placeholder="Goal Title" 
              className="glass-input" 
              required
              value={newGoal.title}
              onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
            />
            <input 
              type="date" 
              className="glass-input" 
              value={newGoal.targetDate}
              onChange={(e) => setNewGoal({...newGoal, targetDate: e.target.value})}
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
              style={{ cursor: 'pointer' }}
            />
            <select 
              className="glass-input"
              value={newGoal.category}
              onChange={(e) => setNewGoal({...newGoal, category: e.target.value})}
            >
              <option value="Personal">Personal</option>
              <option value="Career">Career</option>
              <option value="Health">Health</option>
              <option value="Finance">Finance</option>
            </select>
            <select 
              className="glass-input"
              value={newGoal.priority}
              onChange={(e) => setNewGoal({...newGoal, priority: e.target.value})}
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
          <textarea 
            placeholder="Description or why this matters..." 
            className="glass-input" 
            style={{ width: '100%', minHeight: '80px', marginBottom: '16px' }}
            value={newGoal.description}
            onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
          />
          <button type="submit" className="glass-button primary">Create Goal</button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {goals.map(goal => (
          <div key={goal.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', margin: 0 }}>{goal.title}</h3>
              <span className={`badge ${goal.priority}`}>{goal.priority}</span>
            </div>
            {goal.description && <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', flex: 1 }}>{goal.description}</p>}
            
            <div style={{ marginTop: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <span>Progress</span>
                <span>{goal.progress}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ width: `${goal.progress}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.3s ease' }} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : 'No deadline'}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="glass-button" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => updateProgress(goal.id, goal.progress, -10)}>-10%</button>
                  <button className="glass-button primary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => updateProgress(goal.id, goal.progress, 10)}>+10%</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {goals.length === 0 && !showAdd && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <p>You haven't set any long-term goals yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalsManager;
