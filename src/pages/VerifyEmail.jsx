import React, { useState, useEffect } from 'react';
import { apiVerifyEmail, apiResendVerification } from '../utils/api';

const VerifyEmail = ({ onNavigate }) => {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [isUrlVerify, setIsUrlVerify] = useState(false);

  // Support verification via URL query param (?token=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (t) {
      setIsUrlVerify(true);
      setToken(t);
      handleVerify(t);
    }
  }, []);

  const handleVerify = async (t) => {
    const verifyToken = t || token;
    if (!verifyToken.trim()) return;
    setError('');
    setLoading(true);
    try {
      await apiVerifyEmail(verifyToken);
      setSuccess('Email verified! You can now log in.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) { setResendMsg('Please enter your email address first.'); return; }
    setResendLoading(true);
    setResendMsg('');
    try {
      await apiResendVerification(email);
      setResendMsg('Verification email resent! Check your inbox.');
    } catch (err) {
      setResendMsg(err.message);
    } finally {
      setResendLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.page}>
        <div className="glass-panel" style={styles.card}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'48px', marginBottom:'16px'}}>✅</div>
            <h2>Email Verified!</h2>
            <p style={{color:'var(--text-secondary)', marginTop:'12px'}}>Your account is now active.</p>
            <button className="glass-button" style={{marginTop:'24px', padding:'12px 32px'}} onClick={() => onNavigate('login')}>
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isUrlVerify && loading) {
    return (
      <div style={styles.page}>
        <div className="glass-panel" style={styles.card}>
          <div style={{textAlign:'center'}}>
            <div className="loading-ring" style={{ margin: '0 auto 20px', width: '40px', height: '40px', borderWidth: '4px' }} />
            <h2>Verifying Magic Link...</h2>
            <p style={{color:'var(--text-secondary)', marginTop:'12px'}}>Please wait while we verify your email address.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div className="glass-panel" style={styles.card}>
        <h1 style={styles.logo}><span style={{color:'var(--accent-primary)'}}>AI</span> Planner</h1>
        <h2 style={styles.title}>Verify your email</h2>
        <p style={styles.subtitle}>We've sent a 6-digit code and a Magic Link to your email. Click the link, or enter the code below if you are on another device.</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <div style={styles.form}>
          <label style={styles.label}>6-Digit Verification Code</label>
          <input id="verify-token" type="text" className="glass-input" style={{marginBottom:'20px', fontSize: '20px', letterSpacing: '4px', textAlign: 'center'}}
            placeholder="000000" value={token} onChange={(e) => setToken(e.target.value)} maxLength={6} />
          <button id="verify-submit" className="glass-button primary" style={{...styles.submitBtn, background: 'var(--accent-primary)', color: 'var(--bg-primary)'}} onClick={() => handleVerify()} disabled={loading || token.length < 6}>
            {loading ? 'Verifying…' : 'Verify Code'}
          </button>
        </div>

        <hr style={{border:'none', borderTop:'1px solid var(--glass-border)', margin:'30px 0'}} />

        <p style={{...styles.subtitle, marginBottom:'12px'}}>Didn't receive the email?</p>
        <label style={styles.label}>Your Email</label>
        <input type="email" className="glass-input" style={{marginBottom:'12px'}}
          placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="glass-button secondary" style={styles.submitBtn} onClick={handleResend} disabled={resendLoading}>
          {resendLoading ? 'Sending…' : 'Resend Verification Email'}
        </button>
        {resendMsg && <p style={{marginTop:'12px', fontSize:'13px', color:'var(--accent-secondary)'}}>{resendMsg}</p>}

        <p style={styles.footerText}>
          <button style={styles.link} onClick={() => onNavigate('login')}>← Back to login</button>
        </p>
      </div>
    </div>
  );
};

const styles = {
  page: { display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'20px' },
  card: { width:'100%', maxWidth:'440px', padding:'40px' },
  logo: { textAlign:'center', fontSize:'28px', marginBottom:'8px' },
  title: { textAlign:'center', fontSize:'22px', marginBottom:'6px' },
  subtitle: { textAlign:'center', color:'var(--text-secondary)', marginBottom:'24px', fontSize:'14px' },
  form: { display:'flex', flexDirection:'column' },
  label: { fontSize:'13px', color:'var(--text-secondary)', marginBottom:'6px' },
  submitBtn: { width:'100%', padding:'12px', fontSize:'15px' },
  footerText: { textAlign:'center', marginTop:'24px', color:'var(--text-secondary)', fontSize:'14px' },
  link: { background:'none', border:'none', color:'var(--accent-primary)', cursor:'pointer', fontSize:'14px', fontWeight:'600', padding:'0' },
  errorBox: { background:'rgba(255,80,80,0.15)', border:'1px solid rgba(255,80,80,0.4)', borderRadius:'8px', padding:'12px', marginBottom:'20px', fontSize:'14px', color:'#ff6b6b' },
};

export default VerifyEmail;
