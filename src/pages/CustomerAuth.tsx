// filepath: src/pages/CustomerAuth.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '../store/languageStore';
import { createT } from '../utils/i18n';

interface CustomerAuthProps {
  mode: 'login' | 'signup';
}

export default function CustomerAuth({ mode: initialMode }: CustomerAuthProps) {
  const navigate = useNavigate();
  const { lang } = useLanguageStore();
  const t = createT(lang);
  
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return;
    }

    setLoading(true);
    
    // Simulate authentication (replace with real API call)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store customer data
      const customerData = {
        id: 'cust_' + Date.now(),
        name: formData.name || formData.phone,
        email: formData.email,
        phone: formData.phone,
        createdAt: new Date().toISOString(),
      };
      
      localStorage.setItem('csc_customer', JSON.stringify(customerData));
      localStorage.setItem('csc_customer_token', 'cust_token_' + Date.now());
      
      // Redirect to home or cart
      navigate('/');
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const s = {
    wrapper: { minHeight: '100vh', background: 'var(--bg-900)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
    card: { width: '100%', maxWidth: '420px', background: 'var(--bg-800)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px' },
    header: { textAlign: 'center' as const, marginBottom: '28px' },
    title: { fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, marginBottom: '8px' },
    subtitle: { fontSize: '14px', color: 'var(--text-muted)' },
    toggle: { display: 'flex', background: 'var(--bg-700)', borderRadius: '10px', padding: '4px', marginBottom: '24px' },
    toggleBtn: { flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
    toggleBtnActive: { background: 'var(--blue)', color: '#fff' },
    input: { width: '100%', background: 'var(--bg-700)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', marginBottom: '16px', boxSizing: 'border-box' as const },
    inputFocus: { borderColor: 'var(--blue)' },
    label: { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' },
    btn: { width: '100%', padding: '16px', borderRadius: '10px', border: 'none', background: 'var(--blue)', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', marginTop: '8px' },
    btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
    error: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px', color: 'var(--red)', fontSize: '13px', marginBottom: '16px' },
    divider: { display: 'flex', alignItems: 'center', gap: '16px', margin: '24px 0' },
    dividerLine: { flex: 1, height: '1px', background: 'var(--border)' },
    dividerText: { fontSize: '12px', color: 'var(--text-muted)' },
    guestBtn: { width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  };

  return (
    <div style={s.wrapper}>
      <div style={s.card}>
        <div style={s.header}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🏠</div>
          <h1 style={s.title}>
            {mode === 'login' ? t('auth.login') || 'Login' : t('auth.signup') || 'Sign Up'}
          </h1>
          <p style={s.subtitle}>
            {mode === 'login' 
              ? 'Welcome back! Login to continue' 
              : 'Create account to get started'}
          </p>
        </div>

        {/* Toggle */}
        <div style={s.toggle}>
          <button
            style={{ ...s.toggleBtn, ...(mode === 'login' ? s.toggleBtnActive : {}) }}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            style={{ ...s.toggleBtn, ...(mode === 'signup' ? s.toggleBtnActive : {}) }}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
        </div>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <label style={s.label}>Full Name</label>
              <input
                style={s.input}
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
              />
            </>
          )}

          <label style={s.label}>Phone Number *</label>
          <input
            style={s.input}
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="10-digit mobile number"
            required
          />

          {mode === 'signup' && (
            <>
              <label style={s.label}>Email (Optional)</label>
              <input
                style={s.input}
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
              />
            </>
          )}

          <label style={s.label}>Password</label>
          <input
            style={s.input}
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
          />

          <button
            type="submit"
            style={{ ...s.btn, ...(loading ? s.btnDisabled : {}) }}
            disabled={loading}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>

        <div style={s.divider}>
          <div style={s.dividerLine} />
          <span style={s.dividerText}>OR</span>
          <div style={s.dividerLine} />
        </div>

        <button style={s.guestBtn} onClick={() => navigate('/')}>
          Continue as Guest →
        </button>
      </div>
    </div>
  );
}