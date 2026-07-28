/**
 * GeoPlaner V2 — AnalyticsEngine (Core Layer)
 * Refactored from src/pages/Analytics.jsx
 * All existing EWMA + PieChart logic preserved.
 * Extended to accept additional metrics from modules.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { apiGetHistory } from '../../utils/api';
import { useModules } from '../../contexts/ModuleContext';
import { collectAnalyticsMetrics } from '../../modules/registry';

const COLORS = ['#8A2BE2', '#00D2FF', '#FF4D4D', '#FFC107', '#06D6A0', '#F77F00'];

const AnalyticsEngine = () => {
  const { enabledModules } = useModules();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await apiGetHistory();
        setHistory(res.data || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // ─── Core analytics (EWMA + completion) ────────────────────────────────────
  const coreData = useMemo(() => {
    if (!history?.length) return null;

    const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
    const alpha = 0.3;
    let ewmaByHour = {};
    let totalFocus = 0, completedFocus = 0;
    let totalBreak = 0, completedBreak = 0;
    const reasonsMap = {};

    sortedHistory.forEach((day) => {
      if (!day.slots) return;
      day.slots.forEach((slot) => {
        const isPending = slot.status === 'SCHEDULED' || slot.status === 'DRAFT';
        if (!isPending) {
          const val = slot.status === 'COMPLETED' ? 100 : 0;
          ewmaByHour[slot.time] = ewmaByHour[slot.time] === undefined
            ? val
            : alpha * val + (1 - alpha) * ewmaByHour[slot.time];
        }
        if (slot.type === 'focus' && !isPending) {
          totalFocus++;
          if (slot.status === 'COMPLETED') completedFocus++;
        }
        if (slot.type === 'break' && !isPending) {
          totalBreak++;
          if (slot.status === 'COMPLETED') completedBreak++;
        }
        if (slot.status === 'SKIPPED' && slot.incompleteReason) {
          slot.incompleteReason.toLowerCase().replace(/[.,!?;]/g, '').split(/\s+/).forEach((w) => {
            if (w.length > 3 && !['this', 'that', 'with', 'from'].includes(w)) {
              reasonsMap[w] = (reasonsMap[w] || 0) + 1;
            }
          });
        }
      });
    });

    return {
      ewmaChartData: Object.keys(ewmaByHour).map((time) => ({
        time: time.replace(':00', ''),
        score: Math.round(ewmaByHour[time]),
      })),
      completionData: [
        { name: 'Focus Done',   value: completedFocus },
        { name: 'Focus Missed', value: totalFocus - completedFocus },
        { name: 'Break Done',   value: completedBreak },
        { name: 'Break Missed', value: totalBreak - completedBreak },
      ],
      topReasons: Object.entries(reasonsMap).sort((a, b) => b[1] - a[1]).slice(0, 10),
      totalDays: sortedHistory.length,
      overallCompletion: totalFocus + totalBreak > 0
        ? Math.round(((completedFocus + completedBreak) / (totalFocus + totalBreak)) * 100)
        : 0,
    };
  }, [history]);

  // ─── Module analytics metrics (extensible) ──────────────────────────────────
  const moduleMetrics = useMemo(
    () => collectAnalyticsMetrics(enabledModules, history),
    [enabledModules, history]
  );

  const tooltipStyle = {
    contentStyle: {
      background: 'rgba(10,10,18,0.95)',
      border: '1px solid var(--glass-border)',
      borderRadius: '8px',
      color: 'var(--text-primary)',
      fontSize: '13px',
    },
  };

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: '300px' }}>
        <div className="loading-ring" />
        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading analytics…</span>
      </div>
    );
  }

  if (!coreData) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <header style={{ marginBottom: '28px' }}>
          <h1>Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Insights into your consistency and habits.</p>
        </header>
        <div className="glass-panel empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">No Data Yet</div>
          <div className="empty-state-desc">Start using the planner and mark tasks as done or missed to see analytics.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '100px' }}>
      <header style={{ marginBottom: '28px' }}>
        <h1>Analytics Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Insights into your consistency and habits.</p>
      </header>

      {/* Summary Stats */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        {[
          { label: 'Days Tracked',    value: coreData.totalDays,              color: 'var(--accent-primary)' },
          { label: 'Overall Rate',    value: `${coreData.overallCompletion}%`, color: 'var(--status-success)' },
          { label: 'Focus Completed', value: coreData.completionData[0].value, color: 'var(--accent-primary)' },
          { label: 'Breaks Done',     value: coreData.completionData[2].value, color: 'var(--accent-secondary)' },
        ].map((stat) => (
          <div key={stat.label} className="glass-panel stat-card">
            <div className="stat-card-value" style={{ color: stat.color }}>{stat.value}</div>
            <div className="stat-card-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* EWMA Chart */}
        <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '28px' }}>
          <h3 style={{ marginBottom: '8px' }}>Hourly Consistency Score (EWMA)</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            A weighted score (0–100) showing how consistently you complete tasks at each hour. Recent days carry more weight.
          </p>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coreData.ewmaChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" fontSize={11} tickMargin={10} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} domain={[0, 100]} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} {...tooltipStyle} />
                <Bar dataKey="score" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Completion Pie */}
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '20px' }}>Completion by Type</h3>
          <div style={{ height: '220px', position: 'relative', flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={coreData.completionData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value">
                  {coreData.completionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: '800' }}>
                {coreData.completionData[0].value + coreData.completionData[2].value}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Completed</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
            {coreData.completionData.map((entry, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}>
                <div style={{ width: '10px', height: '10px', backgroundColor: COLORS[idx % COLORS.length], borderRadius: '2px', flexShrink: 0 }} />
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>

        {/* Top Reasons */}
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '8px' }}>Top Missed Reasons</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
            Words from missed task explanations.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {coreData.topReasons.length === 0 ? (
              <div style={{ color: 'var(--status-success)', fontStyle: 'italic', fontSize: '14px' }}>No missed tasks yet. Great job! 🎉</div>
            ) : (
              coreData.topReasons.map((reason, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '6px 12px',
                    background: `rgba(255,77,77,${0.08 + (idx < 3 ? 0.12 : 0)})`,
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid rgba(255,77,77,0.25)',
                    fontSize: `${Math.max(11, 17 - idx)}px`,
                    color: '#ff6b6b',
                  }}
                >
                  {reason[0]} <span style={{ fontSize: '10px', opacity: 0.7 }}>({reason[1]})</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Module-injected metrics */}
      {moduleMetrics.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>Module Analytics</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {moduleMetrics.map((metric, idx) => (
              <div key={idx} className="glass-panel module-widget" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span className={`module-chip ${metric.moduleColorKey}`}>{metric.moduleIcon} {metric.moduleName}</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{metric.label}</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: metric.color || 'var(--accent-primary)', marginTop: '4px' }}>
                  {metric.value}
                </div>
                {metric.description && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>{metric.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsEngine;
