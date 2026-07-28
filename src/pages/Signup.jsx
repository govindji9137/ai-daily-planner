import React, { useState } from 'react';
import { apiSignup } from '../utils/api';

const Signup = ({ onNavigate }) => {
  const [form, setForm] = useState({ name:'', email:'', password:'', confirmPassword:'' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrors({});
    setSuccess('');
    setLoading(true);
    try {
      await apiSignup(form);
      setSuccess('Account created! Check your email to verify your account.');
    } catch (err) {
      if (err.errors) {
        const fieldErrors = {};
        err.errors.forEach(({ field, message }) => { fieldErrors[field] = message; });
        setErrors(fieldErrors);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.page}>
        <div className="glass-panel" style={styles.card}>
          <h1 style={styles.logo}><span style={{color:'var(--accent-primary)'}}>AI</span> Planner</h1>
          <div style={{textAlign:'center', marginTop:'20px'}}>
            <div style={{fontSize:'48px', marginBottom:'16px'}}>📧</div>
            <h2>Check your email</h2>
            <p style={{color:'var(--text-secondary)', marginTop:'12px', lineHeight:'1.6'}}>{success}</p>
            <button className="glass-button" style={{marginTop:'24px', padding:'12px 32px'}} onClick={() => onNavigate('verify-email')}>
              I didn't get the email (Resend)
            </button>
            <br/>
            <button style={styles.link} onClick={() => onNavigate('login')}>Back to login</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div className="glass-panel" style={styles.card}>
        <h1 style={styles.logo}><span style={{color:'var(--accent-primary)'}}>AI</span> Planner</h1>
        <h2 style={styles.title}>Create account</h2>
        <p style={styles.subtitle}>Start planning your day with AI.</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {[
            { label:'Full Name', name:'name', type:'text', placeholder:'John Doe', autoComplete:'name' },
            { label:'Email', name:'email', type:'email', placeholder:'you@example.com', autoComplete:'email' },
            { label:'Password', name:'password', type:'password', placeholder:'Min. 8 chars, upper, number, symbol', autoComplete:'new-password' },
            { label:'Confirm Password', name:'confirmPassword', type:'password', placeholder:'Re-enter password', autoComplete:'new-password' },
          ].map(({ label, name, type, placeholder, autoComplete }) => (
            <div key={name}>
              <label style={styles.label}>{label}</label>
              <input id={`signup-${name}`} name={name} type={type} className="glass-input" style={{...styles.input, borderColor: errors[name] ? '#ff6b6b' : undefined}}
                placeholder={placeholder} value={form[name]} onChange={handleChange} required autoComplete={autoComplete} />
              {errors[name] && <p style={styles.fieldError}>{errors[name]}</p>}
            </div>
          ))}

          <button id="signup-submit" type="submit" className="glass-button" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={styles.footerText}>
          Already have an account?{' '}
          <button style={styles.link} onClick={() => onNavigate('login')}>Log in</button>
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
  subtitle: { textAlign:'center', color:'var(--text-secondary)', marginBottom:'30px', fontSize:'14px' },
  form: { display:'flex', flexDirection:'column' },
  label: { fontSize:'13px', color:'var(--text-secondary)', marginBottom:'6px' },
  input: { marginBottom:'4px' },
  submitBtn: { width:'100%', padding:'12px', fontSize:'16px', marginTop:'10px' },
  footerText: { textAlign:'center', marginTop:'24px', color:'var(--text-secondary)', fontSize:'14px' },
  link: { background:'none', border:'none', color:'var(--accent-primary)', cursor:'pointer', fontSize:'14px', fontWeight:'600', padding:'0', marginTop:'16px', display:'inline-block' },
  errorBox: { background:'rgba(255,80,80,0.15)', border:'1px solid rgba(255,80,80,0.4)', borderRadius:'8px', padding:'12px', marginBottom:'20px', fontSize:'14px', color:'#ff6b6b' },
  fieldError: { color:'#ff6b6b', fontSize:'12px', marginBottom:'12px', marginTop:'4px' },
};

export default Signup;
