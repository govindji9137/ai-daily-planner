/**
 * GeoPlaner V2 — Sidebar (Shared Component)
 *
 * Module-aware navigation sidebar.
 * Core nav items are always shown.
 * Module nav items are injected via the module registry.
 */
import React from 'react';
import { useModules } from '../../contexts/ModuleContext';
import { useTheme } from '../../contexts/ThemeContext';
import { usePlanner } from '../../contexts/PlannerContext';
import { useAuth } from '../../contexts/AuthContext';

// ─── Core nav definition ──────────────────────────────────────────────────────
const CORE_NAV = [
  { id: 'dashboard', label: 'Dashboard',     icon: '🏠' },
  { id: 'planner',   label: 'Daily Planner', icon: '📅' },
  { id: 'history',   label: 'History',       icon: '📖' },
  { id: 'analytics', label: 'Analytics',     icon: '📊' },
  { id: 'blocker',   label: 'App Blocker',   icon: '🛡️' },
  { id: 'goals',     label: 'Goals',         icon: '🎯' },
];

const SETTINGS_NAV = [
  { id: 'modules',  label: 'Modules',  icon: '🧩' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

// ─── Sidebar Component ────────────────────────────────────────────────────────
const Sidebar = ({ activeView, setActiveView }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const { enabledModules, allModuleDefs, moduleNavItems } = useModules();
  const { theme, toggleTheme } = useTheme();
  const { progress, openStandaloneTimer, activeTimerTask, closeTaskFocus } = usePlanner();
  const { user, logout } = useAuth();

  const NavButton = ({ item, colorKey }) => (
    <button
      className={`nav-btn ${colorKey ? `module-${colorKey}` : ''} ${activeView === item.id ? 'active' : ''}`}
      onClick={() => setActiveView(item.id)}
      title={item.label}
    >
      <span className="nav-icon">{item.icon}</span>
      <span>{item.label}</span>
      {item.badge && <span className="nav-badge">{item.badge}</span>}
    </button>
  );

  return (
    <>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="glass-button ghost"
        style={{ 
          position: 'fixed', 
          top: '20px', 
          left: '20px', 
          zIndex: 9999, 
          padding: '8px', 
          minWidth: '42px', 
          height: '42px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderRadius: '50%',
          background: 'var(--bg-surface)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? '☰' : '✖'}
      </button>

      <div className={`glass-panel sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Logo & Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div className="sidebar-logo" style={{ marginBottom: 0, marginLeft: '48px' }}>
            <span style={{ color: 'var(--accent-primary)' }}>Geo</span>Planer
          </div>
        </div>

      {/* Today's progress pill */}
      {progress.tracked > 0 && !isCollapsed && (
        <div style={{
          background: 'var(--accent-primary-dim)',
          borderRadius: 'var(--radius-full)',
          padding: '8px 14px',
          marginBottom: '20px',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ color: 'var(--text-secondary)' }}>Today</span>
          <span style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>
            {progress.done}/{progress.tracked} done
          </span>
        </div>
      )}

      {/* Core navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div className="sidebar-section-label">Core</div>
        {CORE_NAV.map((item) => (
          <NavButton key={item.id} item={item} />
        ))}
      </nav>

      {/* Module Navigation (Injected dynamically) */}
      {moduleNavItems.length > 0 && (
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
          <div className="sidebar-section-label">Modules</div>
          {moduleNavItems.map((item) => (
            <NavButton key={item.id} item={item} colorKey={item.colorKey} />
          ))}
        </nav>
      )}

      {/* Tools */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
        <div className="sidebar-section-label">Tools</div>
        <button
          className={`nav-btn ${activeTimerTask ? 'active' : ''}`}
          onClick={activeTimerTask ? closeTaskFocus : openStandaloneTimer}
        >
          <span className="nav-icon">⏱️</span>
          <span>{activeTimerTask ? 'Hide Timer' : 'Focus Timer'}</span>
        </button>

        {/* Theme toggle in sidebar */}
        <button
          className="nav-btn"
          onClick={toggleTheme}
        >
          <span className="nav-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </nav>

      {/* Settings */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
        <div className="sidebar-section-label">System</div>
        {SETTINGS_NAV.map((item) => (
          <NavButton key={item.id} item={item} />
        ))}
      </nav>

      {/* User profile + logout */}
      <div className="mt-auto" style={{ paddingTop: '16px', borderTop: '1px solid var(--glass-border)', marginTop: 'auto' }}>
        {user && !isCollapsed && (
          <div style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(0,0,0,0.15)',
            marginBottom: '8px',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Signed in as</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {(user?.data || user?.user || user)?.name}
            </div>
          </div>
        )}
        <button
          className="nav-btn"
          onClick={logout}
          style={{ color: 'var(--status-error)', width: '100%' }}
        >
          <span className="nav-icon">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
