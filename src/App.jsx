import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ModuleProvider, useModules } from './contexts/ModuleContext';
import { PlannerProvider, usePlanner } from './contexts/PlannerContext';

// Core Components
import Sidebar from './shared/components/Sidebar';
import AIAssistant from './core/ai/AIAssistant';
import FocusTimer from './core/timer/FocusTimer';

// Core Views
import Dashboard from './shared/components/Dashboard';
import PlannerEngine from './core/planner/PlannerEngine';
import HistoryEngine from './core/history/HistoryEngine';
import AnalyticsEngine from './core/analytics/AnalyticsEngine';
import AppBlocker from './core/blocker/AppBlocker';

// Auth & Onboarding
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import ModuleSelector from './pages/onboarding/ModuleSelector';
import SettingsPage from './pages/SettingsPage';
import GoalsManager from './pages/GoalsManager';

// Ensure all modules are loaded into the registry
import './modules/personal';
import './modules/student';
import './modules/health';
import './modules/professional';
import './modules/creator';

import './index.css';

// ─── Inner App (Authenticated Area) ──────────────────────────────────────────

const AuthenticatedApp = ({ setView }) => {
  const { user, logout } = useAuth();
  const { onboardingDone, modulePages } = useModules();
  const { activeTimerTask, closeTaskFocus } = usePlanner();

  const [activeSection, setActiveSection] = useState('dashboard');

  // If user hasn't configured modules yet, force them to onboarding
  if (!onboardingDone) {
    return <ModuleSelector />;
  }

  const handleLogout = async () => {
    await logout();
    setView('login');
  };

  return (
    <div className="app-container">
      <Sidebar
          activeView={activeSection}
          setActiveView={setActiveSection}
        />

        <main className="main-content">
          {activeSection === 'dashboard' && <Dashboard />}
          {activeSection === 'planner' && <PlannerEngine />}
          {activeSection === 'history' && <HistoryEngine />}
          {activeSection === 'analytics' && <AnalyticsEngine />}
          {activeSection === 'blocker' && <AppBlocker />}
          {activeSection === 'settings' && <SettingsPage />}
          {activeSection === 'goals' && <GoalsManager />}
          
          {activeSection === 'modules' && (
            <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
              <ModuleSelector onComplete={() => setActiveSection('dashboard')} />
            </div>
          )}

          {/* Dynamic Module Pages */}
          {modulePages.find(p => p.id === activeSection) && 
            React.createElement(modulePages.find(p => p.id === activeSection).component)
          }

          {/* Fallback for unhandled sections (Settings, or module-specific tabs) */}
          {!['dashboard', 'planner', 'history', 'analytics', 'blocker', 'settings', 'goals', 'modules'].includes(activeSection) && !modulePages.find(p => p.id === activeSection) && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '48px', marginBottom: '16px' }}>🚧</span>
              <h2>Coming Soon</h2>
              <p>This view ({activeSection}) is not yet implemented.</p>
              <button className="glass-button" style={{ marginTop: '16px' }} onClick={() => setActiveSection('dashboard')}>Back to Dashboard</button>
            </div>
          )}
        </main>

        {activeTimerTask && <FocusTimer task={activeTimerTask} onClose={closeTaskFocus} />}
        <AIAssistant />
      </div>
  );
};

// ─── App Shell (Routing & Providers) ─────────────────────────────────────────

const AppShell = () => {
  const { user, loading } = useAuth();
  const initialView = window.location.pathname === '/verify-email' ? 'verify-email' : 'login';
  const [view, setView] = useState(initialView);

  // Auto-login routing
  useEffect(() => {
    if (user && view !== 'app') setView('app');
  }, [user, view]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-ring" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading GeoPlaner…</p>
      </div>
    );
  }

  // Unauthenticated routes
  if (view !== 'app') {
    return (
      <>
        {view === 'login' && <Login onNavigate={setView} />}
        {view === 'signup' && <Signup onNavigate={setView} />}
        {view === 'verify-email' && <VerifyEmail onNavigate={setView} />}
        {view === 'forgot-password' && <Login onNavigate={setView} />}
      </>
    );
  }

  // Authenticated routes (wrapped in ModuleProvider so it can fetch settings from API)
  return (
    <ModuleProvider>
      <PlannerProvider>
        <AuthenticatedApp setView={setView} />
      </PlannerProvider>
    </ModuleProvider>
  );
};

// ─── Root ────────────────────────────────────────────────────────────────────

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
