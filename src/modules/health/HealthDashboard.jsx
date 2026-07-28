import React from 'react';
import ModuleWidget from '../../shared/components/ModuleWidget';
import { MODULE_ID } from '../../shared/models/task.model';

const MODULE = { id: MODULE_ID.HEALTH, name: 'Health', icon: '💪', colorKey: 'health' };

const HealthDashboardWidget = () => (
  <ModuleWidget moduleId={MODULE.id} moduleIcon={MODULE.icon} moduleName={MODULE.name} colorKey={MODULE.colorKey} title="Health Overview">
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      {[
        { icon: '🏋️', label: 'Workout',     value: '—', unit: 'today',     color: 'var(--module-health)' },
        { icon: '💧', label: 'Water',        value: '—', unit: 'glasses',   color: 'var(--accent-secondary)' },
        { icon: '😴', label: 'Sleep',        value: '—', unit: 'hrs',       color: 'var(--accent-primary)' },
        { icon: '💊', label: 'Medication',   value: '—', unit: 'pending',   color: 'var(--status-warning)' },
      ].map((s) => (
        <div key={s.label} style={{ background: 'rgba(6,214,160,0.05)', borderRadius: 'var(--radius-md)', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>{s.icon}</span>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: s.color }}>{s.value} <span style={{ fontSize: '11px', fontWeight: '400', color: 'var(--text-muted)' }}>{s.unit}</span></div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{s.label}</div>
          </div>
        </div>
      ))}
    </div>
    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>GeoHealth Integration</span>
      <span style={{ fontSize: '11px', padding: '3px 10px', background: 'rgba(108,117,125,0.15)', color: 'var(--text-muted)', borderRadius: 'var(--radius-full)', fontWeight: '600' }}>Optional</span>
    </div>
  </ModuleWidget>
);

export default HealthDashboardWidget;
