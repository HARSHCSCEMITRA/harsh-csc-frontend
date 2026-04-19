// src/admin/Login.tsx
import React, { useState } from 'react';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('admin_token', data.token);
        window.location.href = '/admin/dashboard';
      } else {
        setError(data.error || 'Galat password. Kripya dubara try karein.');
      }
    } catch {
      setError('Network error. Backend se jud nahi paya.');
    } finally {
      setLoading(false);
    }
  };

  const s = {
    page: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#050913',
      color: '#e2e8f0',
      fontFamily: 'Inter, sans-serif',
      padding: '16px',
      boxSizing: 'border-box' as const,
    },
    card: {
      background: '#0f1729',
      border: '1px solid rgba(37,99,235,0.3)',
      borderRadius: '16px',
      padding: '40px 36px',
      width: '100%',
      maxWidth: '400px',
      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
      boxSizing: 'border-box' as const,
    },
    logo: {
      fontSize: '2.5rem',
      textAlign: 'center' as const,
      marginBottom: '12px',
    },
    title: {
      fontSize: '22px',
      fontWeight: 800,
      color: '#60a5fa',
      marginBottom: '6px',
      textAlign: 'center' as const,
      letterSpacing: '-0.02em',
    },
    subtitle: {
      fontSize: '13px',
      color: '#64748b',
      marginBottom: '32px',
      textAlign: 'center' as const,
    },
    label: {
      display: 'block',
      fontSize: '11px',
      fontWeight: 600,
      color: '#64748b',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.06em',
      marginBottom: '8px',
    },
    input: {
      width: '100%',
      background: '#050913',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      padding: '12px 16px',
      color: '#e2e8f0',
      fontSize: '15px',
      marginBottom: '24px',
      outline: 'none',
      boxSizing: 'border-box' as const,
      transition: 'border-color 0.2s',
    },
    btn: {
      width: '100%',
      background: loading ? '#1e3a8a' : '#2563eb',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      padding: '13px',
      fontSize: '15px',
      fontWeight: 700,
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.7 : 1,
      transition: 'background 0.2s, opacity 0.2s',
      letterSpacing: '0.01em',
    },
    error: {
      background: 'rgba(239,68,68,0.1)',
      border: '1px solid rgba(239,68,68,0.3)',
      color: '#ef4444',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '13px',
      marginBottom: '20px',
      textAlign: 'center' as const,
      lineHeight: 1.5,
    },
    divider: {
      borderTop: '1px solid rgba(255,255,255,0.06)',
      marginTop: '28px',
      paddingTop: '20px',
      textAlign: 'center' as const,
      fontSize: '12px',
      color: '#334155',
    },
  };

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Logo + Title */}
        <div style={s.logo}>🏛️</div>
        <div style={s.title}>Harsh CSC Admin</div>
        <div style={s.subtitle}>Secure Control Room Access</div>

        {/* Error */}
        {error && <div style={s.error}>⚠️ {error}</div>}

        {/* Form */}
        <form onSubmit={handleLogin}>
          <label style={s.label}>Admin Password</label>
          <input
            type="password"
            placeholder="••••••••••••"
            style={s.input}
            value={password}
            onChange={e => setPassword(e.target.value)}
            onFocus={e => (e.target.style.borderColor = 'rgba(37,99,235,0.6)')}
            onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            required
            autoComplete="current-password"
          />
          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? '⏳ Verifying...' : '🔐 Unlock Dashboard'}
          </button>
        </form>

        {/* Footer */}
        <div style={s.divider}>
          Harsh CSC eMitra Center · Admin Only
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
