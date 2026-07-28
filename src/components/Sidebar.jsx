import React from 'react';

const Sidebar = ({ activeView, setActiveView, showTimer, setShowTimer, user, onLogout }) => {
  return (
    <div className="glass-panel sidebar" style={styles.sidebar}>
      <h2 style={styles.logo}>
        <span style={{color: 'var(--accent-primary)'}}>AI</span> Planner
      </h2>
      
      <nav style={styles.nav}>
        <button 
          className={`nav-btn ${activeView === 'planner' ? 'active' : ''}`}
          onClick={() => setActiveView('planner')}
          style={{...styles.navBtn, ...(activeView === 'planner' ? styles.activeBtn : {})}}
        >
          Daily Planner
        </button>
        <button 
          className={`nav-btn ${activeView === 'history' ? 'active' : ''}`}
          onClick={() => setActiveView('history')}
          style={{...styles.navBtn, ...(activeView === 'history' ? styles.activeBtn : {})}}
        >
          History
        </button>
        <button 
          className={`nav-btn ${activeView === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveView('analytics')}
          style={{...styles.navBtn, ...(activeView === 'analytics' ? styles.activeBtn : {})}}
        >
          Analytics
        </button>
        <button 
          className={`nav-btn ${activeView === 'blocker' ? 'active' : ''}`}
          onClick={() => setActiveView('blocker')}
          style={{...styles.navBtn, ...(activeView === 'blocker' ? styles.activeBtn : {})}}
        >
          App Blocker
        </button>
        <div style={{height: '1px', background: 'var(--glass-border)', margin: '10px 0'}} />
        
        <button 
          className="nav-btn"
          onClick={() => setShowTimer(!showTimer)}
          style={styles.navBtn}
        >
          {showTimer ? 'Hide Timer' : 'Show Timer'}
        </button>
      </nav>

      {/* User profile + logout at bottom */}
      <div style={{marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
        {user && (
          <div style={{fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', textAlign: 'center'}}>
            Signed in as <strong style={{color:'var(--text-primary)'}}>{user.name}</strong>
          </div>
        )}
        <button 
          className="nav-btn"
          onClick={onLogout}
          style={{...styles.navBtn, color: '#ff6b6b', width: '100%', textAlign: 'center'}}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

const styles = {
  sidebar: {
    width: '260px',
    height: 'calc(100vh - 40px)',
    margin: '20px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
  },
  logo: {
    fontSize: '24px',
    marginBottom: '40px',
    textAlign: 'center'
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  navBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '16px',
    fontWeight: '500',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: '0.2s ease',
  },
  activeBtn: {
    background: 'rgba(138, 43, 226, 0.15)',
    color: 'var(--text-primary)',
    borderLeft: '4px solid var(--accent-primary)',
    borderTopLeftRadius: '0',
    borderBottomLeftRadius: '0'
  }
};

export default Sidebar;
