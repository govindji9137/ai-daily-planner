import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { apiGetHistory } from '../utils/api';

const COLORS = ['#8A2BE2', '#00D2FF', '#FF4D4D', '#FFC107'];

const Analytics = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await apiGetHistory();
        setHistory(res.data || []);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const analyticsData = useMemo(() => {
    if (!history || history.length === 0) return null;

    // Sort history chronologically (oldest first for EWMA calculation)
    const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));

    // EWMA for hourly completion (alpha = 0.3)
    const alpha = 0.3;
    let ewmaByHour = {}; // "12:00 AM": value

    // Stats variables
    let totalFocus = 0;
    let completedFocus = 0;
    let totalBreak = 0;
    let completedBreak = 0;
    const reasonsMap = {};

    sortedHistory.forEach(day => {
      if (!day.slots) return;
      
      day.slots.forEach(slot => {
        // Track hourly completion (1 for done, 0 for missed)
        // If it's null (not set), we can ignore it or treat it as 0. We'll ignore nulls for EWMA if possible, or treat as 0 for simplicity.
        if (slot.isCompleted !== null) {
          const val = slot.isCompleted ? 100 : 0;
          if (ewmaByHour[slot.time] === undefined) {
            ewmaByHour[slot.time] = val; // Initialize with first value
          } else {
            ewmaByHour[slot.time] = (alpha * val) + ((1 - alpha) * ewmaByHour[slot.time]);
          }
        }

        // Track focus vs break
        if (slot.type === 'focus' && slot.isCompleted !== null) {
          totalFocus++;
          if (slot.isCompleted) completedFocus++;
        }
        if (slot.type === 'break' && slot.isCompleted !== null) {
          totalBreak++;
          if (slot.isCompleted) completedBreak++;
        }

        // Track reasons
        if (slot.isCompleted === false && slot.incompleteReason) {
          // simple word cloud mapping
          const words = slot.incompleteReason.toLowerCase().replace(/[.,!?;]/g, '').split(/\s+/);
          words.forEach(w => {
            if (w.length > 3 && !['this', 'that', 'with', 'from'].includes(w)) {
              reasonsMap[w] = (reasonsMap[w] || 0) + 1;
            }
          });
        }
      });
    });

    const ewmaChartData = Object.keys(ewmaByHour).map(time => ({
      time: time.replace(':00', ''), // e.g. "12 AM"
      score: Math.round(ewmaByHour[time])
    }));

    const completionData = [
      { name: 'Focus Completed', value: completedFocus },
      { name: 'Focus Missed', value: totalFocus - completedFocus },
      { name: 'Break Completed', value: completedBreak },
      { name: 'Break Missed', value: totalBreak - completedBreak },
    ];

    const topReasons = Object.entries(reasonsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return { ewmaChartData, completionData, topReasons };
  }, [history]);

  if (loading) return <div style={{textAlign:'center', padding:'50px'}}>Loading analytics...</div>;

  if (!analyticsData) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <h1>Analytics</h1>
          <p style={{color: 'var(--text-secondary)'}}>No data available. Start using the planner!</p>
        </header>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Analytics Dashboard</h1>
        <p style={{color: 'var(--text-secondary)'}}>Insights into your consistency and habits.</p>
      </header>

      <div style={styles.grid}>
        {/* Most Consistent Hours (EWMA) */}
        <div className="glass-panel" style={styles.cardFull}>
          <h3 style={{marginBottom: '20px'}}>Hourly Consistency Score (EWMA)</h3>
          <p style={{fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px'}}>
            A weighted score (0-100) showing how consistently you complete tasks at specific hours. Recent days carry more weight.
          </p>
          <div style={{height: '300px', width: '100%'}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.ewmaChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" fontSize={12} tickMargin={10} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} domain={[0, 100]} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{background: 'rgba(0,0,0,0.8)', border: '1px solid var(--glass-border)', borderRadius: '8px'}} />
                <Bar dataKey="score" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Completion Rate */}
        <div className="glass-panel" style={styles.cardHalf}>
          <h3 style={{marginBottom: '20px'}}>Completion by Type</h3>
          <div style={{height: '250px', width: '100%', position: 'relative'}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.completionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analyticsData.completionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{background: 'rgba(0,0,0,0.8)', border: '1px solid var(--glass-border)', borderRadius: '8px'}} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center'}}>
              <div style={{fontSize: '24px', fontWeight: 'bold'}}>{analyticsData.completionData[0].value + analyticsData.completionData[2].value}</div>
              <div style={{fontSize: '12px', color: 'var(--text-secondary)'}}>Completed</div>
            </div>
          </div>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginTop: '10px'}}>
            {analyticsData.completionData.map((entry, idx) => (
              <div key={idx} style={{display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px'}}>
                <div style={{width: '10px', height: '10px', backgroundColor: COLORS[idx % COLORS.length], borderRadius: '2px'}}></div>
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>

        {/* Common Missed Reasons */}
        <div className="glass-panel" style={styles.cardHalf}>
          <h3 style={{marginBottom: '20px'}}>Top Distractions / Reasons</h3>
          <p style={{fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '15px'}}>Based on words used when marking tasks as missed.</p>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
            {analyticsData.topReasons.length === 0 ? (
              <div style={{color: 'var(--text-secondary)', fontStyle: 'italic'}}>No missed tasks yet. Great job!</div>
            ) : (
              analyticsData.topReasons.map((reason, idx) => (
                <div key={idx} style={{
                  padding: '8px 12px',
                  background: `rgba(255, 77, 77, ${0.1 + (idx < 3 ? 0.2 : 0)})`,
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 77, 77, 0.3)',
                  fontSize: `${18 - idx}px`,
                  color: '#ff6b6b'
                }}>
                  {reason[0]} <span style={{fontSize: '12px', color: 'var(--text-secondary)'}}>({reason[1]})</span>
                </div>
              ))
            )}
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
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px'
  },
  cardFull: {
    gridColumn: '1 / -1',
    padding: '30px'
  },
  cardHalf: {
    padding: '30px',
    display: 'flex',
    flexDirection: 'column'
  }
};

export default Analytics;
