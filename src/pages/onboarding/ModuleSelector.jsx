/**
 * GeoPlaner V2 — Module Selector (Onboarding)
 *
 * Shown after first login. Lets user choose which modules to enable.
 * Personal is always on. User ranks remaining modules by toggling them
 * (order of selection = priority order).
 * Accessible later from Settings → Modules.
 */
import React, { useState, useMemo } from 'react';
import { useModules } from '../../contexts/ModuleContext';

const ModuleSelector = ({ onComplete }) => {
  const { allModuleDefs, completeOnboarding } = useModules();

  // Start with personal always selected, order = selection order
  const [selectedIds, setSelectedIds] = useState(['personal']);

  const toggleModule = (moduleId) => {
    if (moduleId === 'personal') return; // Always on
    setSelectedIds((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleContinue = () => {
    completeOnboarding(selectedIds);
    onComplete?.();
  };

  const optionalModules = allModuleDefs.filter((m) => !m.alwaysEnabled);

  return (
    <div className="onboarding-page">
      <div style={{ width: '100%', maxWidth: '640px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧩</div>
          <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>
            Welcome to <span style={{ color: 'var(--accent-primary)' }}>GeoPlaner</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.6', maxWidth: '480px', margin: '0 auto' }}>
            Choose the productivity modules you want to activate. You can always change this from Settings later.
          </p>
        </div>

        {/* Personal (always on) */}
        <div style={{ marginBottom: '24px' }}>
          <div className="sidebar-section-label" style={{ marginBottom: '12px', paddingLeft: '0' }}>Always Active</div>
          <div
            className="module-select-card selected"
            style={{ cursor: 'default', borderColor: 'var(--module-personal)', background: 'var(--module-personal-dim)', display: 'flex', alignItems: 'center', gap: '16px' }}
          >
            <div style={{ fontSize: '32px' }}>👤</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>Personal</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>General productivity and daily planning. The foundation of GeoPlaner.</div>
            </div>
            <div style={{ fontSize: '20px' }}>✅</div>
          </div>
        </div>

        {/* Optional modules */}
        <div>
          <div className="sidebar-section-label" style={{ marginBottom: '12px', paddingLeft: '0' }}>Optional Modules</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {optionalModules.map((mod) => {
              const isSelected = selectedIds.includes(mod.id);
              const selectionOrder = selectedIds.indexOf(mod.id);
              return (
                <div
                  key={mod.id}
                  className={`module-select-card ${isSelected ? 'selected' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    borderColor: isSelected ? `var(--module-${mod.colorKey})` : undefined,
                    background: isSelected ? `var(--module-${mod.colorKey}-dim)` : undefined,
                  }}
                  onClick={() => toggleModule(mod.id)}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') toggleModule(mod.id); }}
                >
                  <div style={{ fontSize: '32px' }}>{mod.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {mod.name}
                      {isSelected && selectionOrder > 0 && (
                        <span style={{
                          background: `var(--module-${mod.colorKey})`,
                          color: 'white',
                          fontSize: '11px',
                          fontWeight: '700',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {selectionOrder}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{mod.description}</div>
                  </div>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${isSelected ? `var(--module-${mod.colorKey})` : 'var(--glass-border)'}`,
                    background: isSelected ? `var(--module-${mod.colorKey})` : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: '0.2s ease',
                  }}>
                    {isSelected && <span style={{ color: 'white', fontSize: '12px', fontWeight: '700' }}>✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority note */}
        {selectedIds.length > 2 && (
          <div style={{
            marginTop: '20px', padding: '14px 18px',
            background: 'var(--accent-primary-dim)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(138,43,226,0.25)',
            fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5',
          }}>
            💡 The order you selected modules is their <strong style={{ color: 'var(--text-primary)' }}>priority order</strong>. When tasks conflict, higher-priority module tasks take precedence. You can reorder from Settings anytime.
          </div>
        )}

        {/* Continue */}
        <button
          className="glass-button"
          style={{ width: '100%', marginTop: '32px', padding: '16px', fontSize: '16px' }}
          onClick={handleContinue}
        >
          Continue with {selectedIds.length} module{selectedIds.length !== 1 ? 's' : ''} →
        </button>

        <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
          You can change modules anytime in Settings → Modules
        </div>
      </div>
    </div>
  );
};

export default ModuleSelector;
