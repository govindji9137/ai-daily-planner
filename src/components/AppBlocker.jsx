import React, { useState } from 'react';

const initialProfiles = [
  { id: 1, name: 'Deep Work', socialBlocked: true, gamesBlocked: true, newsBlocked: true },
  { id: 2, name: 'Reading', socialBlocked: true, gamesBlocked: true, newsBlocked: false },
];

const AppBlocker = () => {
  const [profiles, setProfiles] = useState(initialProfiles);

  const toggleToggle = (id, field) => {
    setProfiles(profiles.map(p => {
      if (p.id === id) {
        return { ...p, [field]: !p[field] };
      }
      return p;
    }));
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Focus Profiles (Android)</h1>
        <p style={{color: 'var(--text-secondary)'}}>UI prepared for future Capacitor integration to block Android apps during focus modes.</p>
      </header>

      <div style={styles.grid}>
        {profiles.map(profile => (
          <div key={profile.id} className="glass-panel" style={styles.card}>
            <h3>{profile.name}</h3>
            
            <div style={styles.toggles}>
              <div style={styles.toggleRow}>
                <span>Social Media</span>
                <button 
                  style={{...styles.toggleBtn, background: profile.socialBlocked ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)'}}
                  onClick={() => toggleToggle(profile.id, 'socialBlocked')}
                >
                  <div style={{...styles.toggleKnob, transform: profile.socialBlocked ? 'translateX(20px)' : 'translateX(0)'}} />
                </button>
              </div>
              <div style={styles.toggleRow}>
                <span>Games</span>
                <button 
                  style={{...styles.toggleBtn, background: profile.gamesBlocked ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)'}}
                  onClick={() => toggleToggle(profile.id, 'gamesBlocked')}
                >
                  <div style={{...styles.toggleKnob, transform: profile.gamesBlocked ? 'translateX(20px)' : 'translateX(0)'}} />
                </button>
              </div>
              <div style={styles.toggleRow}>
                <span>News & Entertainment</span>
                <button 
                  style={{...styles.toggleBtn, background: profile.newsBlocked ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)'}}
                  onClick={() => toggleToggle(profile.id, 'newsBlocked')}
                >
                  <div style={{...styles.toggleKnob, transform: profile.newsBlocked ? 'translateX(20px)' : 'translateX(0)'}} />
                </button>
              </div>
            </div>
            
            <button className="glass-button secondary" style={{width: '100%', marginTop: '20px'}}>Edit Profile</button>
          </div>
        ))}
        
        <div className="glass-panel" style={{...styles.card, display: 'flex', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed'}}>
          <button className="glass-button" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span style={{fontSize: '20px'}}>+</span> Create New Profile
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '30px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px'
  },
  card: {
    padding: '24px',
  },
  toggles: {
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '15px'
  },
  toggleBtn: {
    width: '44px',
    height: '24px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 0.3s'
  },
  toggleKnob: {
    width: '20px',
    height: '20px',
    background: 'white',
    borderRadius: '50%',
    position: 'absolute',
    top: '2px',
    left: '2px',
    transition: 'transform 0.3s',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
  }
};

export default AppBlocker;
