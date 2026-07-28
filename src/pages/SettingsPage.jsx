import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { apiGetProfile, apiUpdateProfile } from '../utils/api';

const SettingsPage = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const actualUser = user?.data || user?.user || user;
  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState(actualUser?.name || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  // Profile state
  const [weekContext, setWeekContext] = useState('');
  const [wakeTime, setWakeTime] = useState('');
  const [sleepTime, setSleepTime] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    if (actualUser?.name) setName(actualUser.name);
  }, [actualUser]);

  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await apiGetProfile();
        const p = res.data;
        if (p.weekContext) setWeekContext(p.weekContext);
        if (p.wakeTime) setWakeTime(p.wakeTime);
        if (p.sleepTime) setSleepTime(p.sleepTime);
      } catch (err) {
        console.warn('[Settings] Could not load profile:', err.message);
      }
    };
    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileError('');
    setProfileSaved(false);
    try {
      await apiUpdateProfile({ weekContext, wakeTime: wakeTime || null, sleepTime: sleepTime || null });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      setProfileError(err.message || 'Failed to save profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const tabStyle = (tab) => ({
    padding: '12px 16px',
    textAlign: 'left',
    borderRadius: '8px',
    background: activeTab === tab ? 'var(--accent-primary-dim)' : 'transparent',
    color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-secondary)',
    fontWeight: activeTab === tab ? '600' : '500',
    transition: 'var(--transition-fast)',
    border: 'none',
    cursor: 'pointer',
    flex: '1 1 auto',
    minWidth: '130px',
  });

  return (
    <div className="settings-page" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.3s ease-in-out' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>Settings &amp; Preferences</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your profile, integrations, and application preferences.</p>
      </header>

      <div className="glass-panel" style={{ display: 'flex', flexWrap: 'wrap', minHeight: '500px', padding: 0 }}>
        <aside style={{ flex: '1 1 240px', background: 'rgba(0,0,0,0.1)', borderRight: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)', padding: '24px', display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', gap: '8px' }}>
          {['profile', 'preferences', 'integrations', 'security'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={tabStyle(tab)}>
              {{ profile: '👤 Profile', preferences: '⚙️ Preferences', integrations: '🔗 Integrations', security: '🔒 Security' }[tab]}
            </button>
          ))}
        </aside>

        <main style={{ flex: '99 1 400px', padding: '32px', minWidth: '0' }}>

          {/* ─── PROFILE TAB ─── */}
          {activeTab === 'profile' && (
            <div className="animate-slide-up">
              <h2>Personal Information</h2>
              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '520px' }}>

                {/* Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Name</label>
                  <input
                    type="text"
                    className="glass-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', color: 'var(--text-primary)' }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Email</label>
                  <input
                    type="email"
                    className="glass-input"
                    value={actualUser?.email || ''}
                    readOnly
                    disabled
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', color: 'var(--text-secondary)', opacity: 0.7 }}
                  />
                </div>

                {/* Wake / Sleep Time */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>⏰ Wake Time (default)</label>
                    <select
                      className="glass-input"
                      value={wakeTime}
                      onChange={(e) => setWakeTime(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px' }}
                    >
                      <option value="">Auto</option>
                      <option value="04:00 AM">04:00 AM</option>
                      <option value="05:00 AM">05:00 AM</option>
                      <option value="06:00 AM">06:00 AM</option>
                      <option value="07:00 AM">07:00 AM</option>
                      <option value="08:00 AM">08:00 AM</option>
                      <option value="09:00 AM">09:00 AM</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>🌙 Sleep Time (default)</label>
                    <select
                      className="glass-input"
                      value={sleepTime}
                      onChange={(e) => setSleepTime(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px' }}
                    >
                      <option value="">Auto</option>
                      <option value="09:00 PM">09:00 PM</option>
                      <option value="10:00 PM">10:00 PM</option>
                      <option value="11:00 PM">11:00 PM</option>
                      <option value="12:00 AM">12:00 AM</option>
                      <option value="01:00 AM">01:00 AM</option>
                    </select>
                  </div>
                </div>

                {/* ─── WEEK CONTEXT BOX ─── */}
                <div style={{ maxWidth: '100%' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--accent-primary)', marginBottom: '6px' }}>
                    📅 Week — AI Context
                  </label>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: '1.5' }}>
                    Describe your week — exams, deadlines, events, how you're feeling. The AI reads this every time it creates your daily plan.
                    <strong> No word limit.</strong>
                  </p>
                  <textarea
                    className="glass-input"
                    value={weekContext}
                    onChange={(e) => setWeekContext(e.target.value)}
                    placeholder={`e.g. This week I have Physics exam on Friday. Monday is free. I'm trying to finish chapter 5-8 of Organic Chemistry. I feel a bit tired, need lighter mornings...`}
                    style={{
                      width: '100%',
                      minHeight: '160px',
                      resize: 'vertical',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      padding: '14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(138,43,226,0.4)',
                      background: 'rgba(138,43,226,0.05)',
                    }}
                  />
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    {weekContext.length} characters written. AI will attach this to every plan generation automatically.
                  </p>
                </div>

                {/* Save Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    className="glass-button primary"
                    onClick={handleSaveProfile}
                    disabled={profileSaving}
                    style={{ padding: '12px 24px' }}
                  >
                    {profileSaving ? '💾 Saving…' : '💾 Save Profile'}
                  </button>
                  {profileSaved && (
                    <span style={{ color: 'var(--status-success)', fontSize: '14px', fontWeight: '600', animation: 'fadeIn 0.3s ease' }}>
                      ✅ Saved!
                    </span>
                  )}
                  {profileError && (
                    <span style={{ color: 'var(--status-error)', fontSize: '14px' }}>❌ {profileError}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── PREFERENCES TAB ─── */}
          {activeTab === 'preferences' && (
            <div className="animate-slide-up">
              <h2>Application Preferences</h2>
              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px' }}>Theme</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Current theme: {theme}</p>
                  </div>
                  <button onClick={toggleTheme} className="glass-button">Toggle Theme</button>
                </div>
                
                <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px' }}>App Blocker strict mode</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Automatically block distracting apps during Focus Sessions.</p>
                  </div>
                  <input type="checkbox" defaultChecked style={{ width: '24px', height: '24px' }} />
                </div>

                <div className="glass-panel" style={{ padding: '16px', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>⏰ Auto Plan Generation</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    A daily plan is auto-generated at <strong>3:50 AM</strong> if you don't have one for the day.
                    It uses your Week context and preferences from the Profile tab.
                  </p>
                  <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(0,255,100,0.08)', borderRadius: '8px', border: '1px solid rgba(0,255,100,0.2)', fontSize: '13px', color: 'var(--status-success)' }}>
                    ✅ Auto-planner is active — runs at 3:50 AM daily
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── INTEGRATIONS TAB ─── */}
          {activeTab === 'integrations' && (
            <div className="animate-slide-up">
              <h2>Connected Services</h2>
              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="glass-panel" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'rgba(59,130,246,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontWeight: 'bold' }}>S</div>
                    <div>
                      <h3 style={{ fontSize: '16px' }}>Srixam</h3>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Sync academic schedule</p>
                    </div>
                  </div>
                  <button className="glass-button" style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}>Disconnect</button>
                </div>

                <div className="glass-panel" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'rgba(234,67,53,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea4335', fontWeight: 'bold' }}>G</div>
                    <div>
                      <h3 style={{ fontSize: '16px' }}>Google Calendar</h3>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Sync events and meetings</p>
                    </div>
                  </div>
                  <button className="glass-button">Connect</button>
                </div>
              </div>
            </div>
          )}

          {/* ─── SECURITY TAB ─── */}
          {activeTab === 'security' && (
            <div className="animate-slide-up">
              <h2>Security</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Manage your account security and sessions.</p>
              
              <div className="glass-panel" style={{ marginTop: '24px', padding: '16px', borderRadius: '8px', border: '1px solid var(--status-error)' }}>
                <h3 style={{ color: 'var(--status-error)', marginBottom: '8px' }}>Danger Zone</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Once you delete your account, there is no going back. Please be certain.</p>
                {!showDeleteConfirm ? (
                  <button className="glass-button" onClick={() => setShowDeleteConfirm(true)} style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--status-error)', border: '1px solid var(--status-error)' }}>Delete Account</button>
                ) : (
                  <div style={{ marginTop: '16px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
                    <p style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--status-error)' }}>Enter your password to confirm deletion:</p>
                    <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Your password" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white', marginBottom: '12px' }} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="glass-button" onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1 }}>Cancel</button>
                      <button className="glass-button" onClick={() => { alert('Account deleted (Simulation)'); setShowDeleteConfirm(false); }} disabled={!deletePassword} style={{ flex: 1, background: 'var(--status-error)', color: 'white', border: 'none' }}>Confirm Delete</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
