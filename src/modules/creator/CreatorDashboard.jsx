import React from 'react';
import ModuleWidget from '../../shared/components/ModuleWidget';
import { MODULE_ID } from '../../shared/models/task.model';

const MODULE = { id: MODULE_ID.CREATOR, name: 'Creator', icon: '🎬', colorKey: 'creator' };

const CreatorDashboardWidget = () => (
  <ModuleWidget moduleId={MODULE.id} moduleIcon={MODULE.icon} moduleName={MODULE.name} colorKey={MODULE.colorKey} title="Content Pipeline">
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      {[
        { icon: '💡', label: 'Ideas Queued',   value: '0', color: 'var(--module-creator)' },
        { icon: '🎙️', label: 'Recording',      value: '—', color: 'var(--status-error)' },
        { icon: '✂️',  label: 'In Editing',     value: '0', color: 'var(--status-warning)' },
        { icon: '🚀', label: 'Published',       value: '0', color: 'var(--status-success)' },
      ].map((s) => (
        <div key={s.label} style={{ textAlign: 'center', padding: '12px', background: 'rgba(230,57,70,0.05)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: s.color }}>{s.value}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>{s.label}</div>
        </div>
      ))}
    </div>
    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>YouTube Integration</span>
      <span style={{ fontSize: '11px', padding: '3px 10px', background: 'rgba(108,117,125,0.15)', color: 'var(--text-muted)', borderRadius: 'var(--radius-full)', fontWeight: '600' }}>Optional</span>
    </div>
  </ModuleWidget>
);

export default CreatorDashboardWidget;
