import React, { useState } from 'react';
import { apiLogin } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const Login = ({ onNavigate }) => {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiLogin(form);
      login(res.data.user, res.data.accessToken);
      onNavigate('app');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div className="glass-panel" style={styles.card}>
        <h1 style={styles.logo}><span style={{color:'var(--accent-primary)'}}>AI</span> Planner</h1>
        <h2 style={styles.title}>Welcome back</h2>
        <p style={styles.subtitle}>Log in to your account to continue.</p>

        {error && (
          <div style={styles.errorBox}>
            {error}
            {error.toLowerCase().includes('verify your email') && (
              <div style={{ marginTop: '10px' }}>
                <button type="button" style={styles.link} onClick={() => onNavigate('verify-email')}>
                  Go to Verification Page
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input id="login-email" name="email" type="email" className="glass-input" style={styles.input}
            placeholder="you@example.com" value={form.email} onChange={handleChange} required autoComplete="email" />

          <label style={styles.label}>Password</label>
          <input id="login-password" name="password" type="password" className="glass-input" style={styles.input}
            placeholder="••••••••" value={form.password} onChange={handleChange} required autoComplete="current-password" />

          <div style={{textAlign: 'right', marginBottom: '20px'}}>
            <button type="button" style={styles.link} onClick={() => onNavigate('forgot-password')}>
              Forgot password?
            </button>
          </div>

          <button id="login-submit" type="submit" className="glass-button" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <p style={styles.footerText}>
          Don't have an account?{' '}
          <button style={styles.link} onClick={() => onNavigate('signup')}>Sign up</button>
        </p>
      </div>
    </div>
  );
};

const styles = {
  page: { display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'20px' },
  card: { width:'100%', maxWidth:'420px', padding:'40px' },
  logo: { textAlign:'center', fontSize:'28px', marginBottom:'8px' },
  title: { textAlign:'center', fontSize:'22px', marginBottom:'6px' },
  subtitle: { textAlign:'center', color:'var(--text-secondary)', marginBottom:'30px', fontSize:'14px' },
  form: { display:'flex', flexDirection:'column' },
  label: { fontSize:'13px', color:'var(--text-secondary)', marginBottom:'6px' },
  input: { marginBottom:'18px' },
  submitBtn: { width:'100%', padding:'12px', fontSize:'16px' },
  footerText: { textAlign:'center', marginTop:'24px', color:'var(--text-secondary)', fontSize:'14px' },
  link: { background:'none', border:'none', color:'var(--accent-primary)', cursor:'pointer', fontSize:'14px', fontWeight:'600', padding:'0' },
  errorBox: { background:'rgba(255,80,80,0.15)', border:'1px solid rgba(255,80,80,0.4)', borderRadius:'8px', padding:'12px', marginBottom:'20px', fontSize:'14px', color:'#ff6b6b' },
};

export default Login;
