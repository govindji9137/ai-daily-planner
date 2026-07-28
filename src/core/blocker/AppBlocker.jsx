/**
 * GeoPlaner V2 — AppBlocker (Core Layer)
 * Moved from src/components/AppBlocker.jsx
 * Logic fully preserved. Only path changed.
 */
import React, { useState, useEffect } from 'react';

const AppBlocker = () => {
  const [strictMode, setStrictMode] = useState(true);
  const [maxStrikes, setMaxStrikes] = useState(3);
  const [penalty, setPenalty] = useState('fail_session'); // 'fail_session', 'warn_only'

  // Normally we would save this to the Profile/DB, but local state is fine for now
  useEffect(() => {
    const saved = localStorage.getItem('geo_blocker_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStrictMode(parsed.strictMode ?? true);
        setMaxStrikes(parsed.maxStrikes ?? 3);
        setPenalty(parsed.penalty ?? 'fail_session');
      } catch (e) {}
    }
  }, []);

  const saveSettings = (updates) => {
    const newSettings = { strictMode, maxStrikes, penalty, ...updates };
    localStorage.setItem('geo_blocker_settings', JSON.stringify(newSettings));
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.3s ease-in-out' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>App Blocker & Strict Focus</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '8px', lineHeight: '1.5' }}>
          Instead of using intrusive device permissions to block apps, GeoPlaner uses a smart <strong>Strict Focus Mode</strong>. 
          When active, if you leave the app or switch to another app during a Focus Session, you will receive a strike.
        </p>
      </header>

      <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Strict Mode Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🛡️ Strict Focus Engine
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px', maxWidth: '400px' }}>
              Monitors if you leave GeoPlaner while a Focus Timer is running. Sends instant notifications to pull you back.
            </p>
          </div>
          <label className="toggle-switch" style={{ marginTop: '4px' }}>
            <input
              type="checkbox"
              checked={strictMode}
              onChange={(e) => {
                setStrictMode(e.target.checked);
                saveSettings({ strictMode: e.target.checked });
              }}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        {/* Configuration */}
        <div style={{ opacity: strictMode ? 1 : 0.4, pointerEvents: strictMode ? 'auto' : 'none', transition: 'var(--transition-fast)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            
            {/* Strikes */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Allowed Distractions (Strikes)</label>
              <select 
                className="glass-input" 
                value={maxStrikes}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setMaxStrikes(val);
                  saveSettings({ maxStrikes: val });
                }}
              >
                <option value={1}>1 Strike (Hardcore)</option>
                <option value={3}>3 Strikes (Standard)</option>
                <option value={5}>5 Strikes (Lenient)</option>
                <option value={999}>Unlimited (Warn Only)</option>
              </select>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                How many times you can leave the app before a penalty is applied.
              </p>
            </div>

            {/* Penalty */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Penalty on Max Strikes</label>
              <select 
                className="glass-input" 
                value={penalty}
                onChange={(e) => {
                  setPenalty(e.target.value);
                  saveSettings({ penalty: e.target.value });
                }}
              >
                <option value="fail_session">Fail & Cancel Session</option>
                <option value="warn_only">Record Distraction Only</option>
              </select>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                What happens when you exceed your allowed strikes.
              </p>
            </div>

          </div>
        </div>
      </div>
      
      <div className="glass-panel" style={{ marginTop: '24px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'rgba(0, 210, 255, 0.05)', border: '1px solid rgba(0, 210, 255, 0.15)' }}>
        <div style={{ fontSize: '24px' }}>💡</div>
        <div>
          <h4 style={{ color: 'var(--accent-secondary)', marginBottom: '4px' }}>Privacy First</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Traditional App Blockers require Android's highly sensitive Accessibility Service, which can read your screen and track all your taps. 
            GeoPlaner's Strict Focus Engine completely avoids this by using standard background state detection, keeping your device fast, battery-efficient, and 100% private.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppBlocker;
