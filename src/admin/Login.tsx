// src/admin/Login.tsx
import React, { useState } from 'react';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔥 AAPKA BACKEND URL
  const BACKEND_URL = "";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem('admin_token', data.token);
        window.location.href = '/admin/dashboard';
      } else {
        setError(data.error || 'Galat password. Kripya sahi password dalein.');
      }
    } catch (err) {
      setError('Network error. Backend se connection nahi ban pa raha hai.');
    } finally {
      setLoading(false);
    }
  };

  const s = {
    page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050913', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' },
    card: { background: '#0f1729', border: '1px solid rgba(37,99,235,0.3)', borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '400px' },
    input: { width: '100%', background: '#050913', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', marginBottom: '20px', outline: 'none' },
    btn: { width: '100%', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 600, cursor: 'pointer' },
    error: { color: '#ef4444', marginBottom: '20px', textAlign: 'center' as const, fontSize: '14px' }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h2 style={{textAlign: 'center', color: '#60a5fa', marginBottom: '20px'}}>🏛️ Harsh CSC Admin</h2>
        {error && <div style={s.error}>{error}</div>}
        <form onSubmit={handleLogin}>
          <input type="password" placeholder="Admin Password Dalein" style={s.input} value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" style={s.btn} disabled={loading}>{loading ? 'Checking...' : 'Login Karein'}</button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
