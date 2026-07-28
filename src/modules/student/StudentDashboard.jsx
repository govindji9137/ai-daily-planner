import React from 'react';
import ModuleWidget from '../../shared/components/ModuleWidget';
import { MODULE_ID } from '../../shared/models/task.model';

const MODULE = {
  id:       MODULE_ID.STUDENT,
  name:     'Student',
  icon:     '🎓',
  colorKey: 'student',
};

const StudentDashboardWidget = () => (
  <ModuleWidget moduleId={MODULE.id} moduleIcon={MODULE.icon} moduleName={MODULE.name} colorKey={MODULE.colorKey} title="Study Overview">
    <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      {[
        { label: 'Study Hours Today', value: '0h', color: 'var(--module-student)' },
        { label: 'Sessions Done',     value: '0',  color: 'var(--module-student)' },
        { label: 'Subjects Covered',  value: '0',  color: 'var(--accent-primary)' },
        { label: 'Revision Due',      value: '0',  color: 'var(--status-warning)' },
      ].map((s) => (
        <div key={s.label} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: '800', color: s.color }}>{s.value}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{s.label}</div>
        </div>
      ))}
    </div>

    <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(0,180,216,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,180,216,0.2)' }}>
      <div style={{ fontSize: '12px', color: 'var(--module-student)', fontWeight: '700', marginBottom: '6px' }}>📚 Coming Soon</div>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
        Full study tracking with subject management, revision scheduling, and Srixam integration.
      </div>
    </div>

    {/* Srixam integration placeholder */}
    <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Srixam Integration</span>
      <span style={{ fontSize: '11px', padding: '3px 10px', background: 'rgba(108,117,125,0.15)', color: 'var(--text-muted)', borderRadius: 'var(--radius-full)', fontWeight: '600' }}>
        Optional
      </span>
    </div>
  </ModuleWidget>
);

export default StudentDashboardWidget;
