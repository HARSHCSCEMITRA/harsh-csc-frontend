// src/admin/Dashboard.tsx
import React, { useEffect, useState } from 'react';

interface Order {
  order_ref: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  status: string;
  delivery_type: string;
  created_at: string;
  total_amount?: number;
}

interface Summary {
  summary_text?: string;
}

const BACKEND_URL = "https://emitra-worker.harshcscemitra.workers.dev";

const STATUS_COLORS: Record<string, string> = {
  flagged:      'background: rgba(239,68,68,0.15); color: #ef4444;',
  verified:     'background: rgba(52,211,153,0.15); color: #34d399;',
  pending:      'background: rgba(251,191,36,0.15); color: #fbbf24;',
  accepted:     'background: rgba(37,99,235,0.15); color: #60a5fa;',
  paid:         'background: rgba(139,92,246,0.15); color: #a78bfa;',
  completed:    'background: rgba(52,211,153,0.15); color: #34d399;',
  rejected:     'background: rgba(239,68,68,0.15); color: #ef4444;',
  cancelled:    'background: rgba(100,116,139,0.15); color: #94a3b8;',
  docs_reviewed:'background: rgba(251,191,36,0.15); color: #fbbf24;',
};

const AdminDashboard = () => {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        if (!token) {
          setError('Admin token nahi mila. Please login karein.');
          setLoading(false);
          return;
        }

        const res = await fetch(`${BACKEND_URL}/api/admin/orders`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!res.ok) {
          setError(`Orders fetch failed: ${res.status}`);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setOrders(data.orders || []);

        try {
          const summaryRes = await fetch(`${BACKEND_URL}/api/admin/summary`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (summaryRes.ok) {
            const summaryData = await summaryRes.json();
            setSummary(summaryData);
          }
        } catch {
          // Summary optional
        }
      } catch (err) {
        setError('Network error. Backend se connection nahi ho paya.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const filteredOrders = orders.filter(o => {
    const matchStatus = filter === 'all' || o.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.order_ref.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_phone.includes(q);
    return matchStatus && matchSearch;
  });

  const counts = {
    total:     orders.length,
    pending:   orders.filter(o => o.status === 'pending').length,
    verified:  orders.filter(o => o.status === 'verified').length,
    flagged:   orders.filter(o => o.status === 'flagged').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return iso; }
  };

  const getDeliveryLabel = (type: string) => {
    if (type === 'digital_whatsapp') return '📲 Digital';
    if (type === 'shop_visit') return '🏪 Shop Visit';
    return type;
  };

  const s = {
    page:       { minHeight: '100vh', background: '#050913', color: '#e2e8f0', fontFamily: 'Inter, sans-serif', padding: '24px' },
    header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)' },
    logoSection:{ display: 'flex', alignItems: 'center', gap: '15px' },
    logoImg:    { width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover' as const },
    title:      { fontSize: '22px', fontWeight: 800, color: '#60a5fa', letterSpacing: '-0.02em', lineHeight: '1.2' },
    subtitle:   { fontSize: '12px', color: '#64748b', marginTop: '2px', fontWeight: 500 },
    badge:      { background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 },
    grid3:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
    card:       { background: '#0f1729', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' },
    cardBlue:   { background: '#0f1729', border: '1px solid rgba(37,99,235,0.3)', borderRadius: '12px', padding: '20px' },
    label:      { fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '8px' },
    bigNum:     { fontSize: '32px', fontWeight: 800, lineHeight: 1 },
    summaryTxt: { fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6, fontStyle: 'italic' as const },
    toolbar:    { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' as const },
    input:      { background: '#0f1729', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: '#e2e8f0', fontSize: '13px', outline: 'none', flex: 1, minWidth: '200px' },
    select:     { background: '#0f1729', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: '#e2e8f0', fontSize: '13px', outline: 'none' },
    table:      { width: '100%', borderCollapse: 'collapse' as const },
    th:         { padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.06em', textAlign: 'left' as const, borderBottom: '1px solid rgba(255,255,255,0.06)' },
    td:         { padding: '14px 16px', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.04)' },
    mono:       { fontFamily: 'monospace', color: '#60a5fa', fontWeight: 700 },
    name:       { fontWeight: 600, fontSize: '13px' },
    phone:      { fontSize: '11px', color: '#64748b', marginTop: '2px' },
    actionBtn:  { background: 'rgba(37,99,235,0.15)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.3)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' },
    errorBox:   { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '16px', color: '#ef4444', marginBottom: '20px' },
    loader:     { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b', fontSize: '15px' },
    empty:      { padding: '60px', textAlign: 'center' as const, color: '#64748b' },
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.logoSection}>
          <img src="/logo.png" alt="Harsh CSC" style={s.logoImg} onError={(e) => (e.currentTarget.style.display = 'none')} />
          <div>
            <div style={s.title}>Harsh CSC e-Mitra</div>
            <div style={s.subtitle}>Digital Documentation Services and Consultancy</div>
          </div>
        </div>
        <div style={s.badge}>● Live</div>
      </div>

      {error && <div style={s.errorBox}>⚠️ {error}</div>}

      <div style={s.grid3}>
        <div style={s.cardBlue}>
          <div style={s.label}>AI Business Insights</div>
          <p style={s.summaryTxt}>
            {summary?.summary_text || 'Aaj raat 10 baje AI manager apni report yahan pesh karega.'}
          </p>
        </div>
        <div style={s.card}>
          <div style={s.label}>Total Orders</div>
          <div style={{ ...s.bigNum, color: '#60a5fa' }}>{counts.total}</div>
        </div>
        <div style={s.card}>
          <div style={s.label}>Pending Review</div>
          <div style={{ ...s.bigNum, color: '#fbbf24' }}>{counts.pending + counts.verified}</div>
        </div>
        <div style={s.card}>
          <div style={s.label}>Flagged by AI</div>
          <div style={{ ...s.bigNum, color: '#ef4444' }}>{counts.flagged}</div>
        </div>
        <div style={s.card}>
          <div style={s.label}>Completed</div>
          <div style={{ ...s.bigNum, color: '#34d399' }}>{counts.completed}</div>
        </div>
      </div>

      <div style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '15px' }}>📋 Service Requests</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>{filteredOrders.length} records</div>
        </div>

        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={s.toolbar}>
            <input
              style={s.input}
              placeholder="🔍 Search by name, ref, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select style={s.select} value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="flagged">Flagged</option>
              <option value="docs_reviewed">Docs Reviewed</option>
              <option value="accepted">Accepted</option>
              <option value="paid">Paid</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={s.loader}>⏳ Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📭</div>
            <div>Koi order nahi mila</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <th style={s.th}>Ref No.</th>
                  <th style={s.th}>Customer</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Delivery</th>
                  <th style={s.th}>Amount</th>
                  <th style={s.th}>Date</th>
                  <th style={s.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.order_ref} style={{ transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={s.td}><span style={s.mono}>{order.order_ref}</span></td>
                    <td style={s.td}>
                      <div style={s.name}>{order.customer_name}</div>
                      <div style={s.phone}>{order.customer_phone}</div>
                    </td>
                    <td style={s.td}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'inline-block',
                        ...(STATUS_COLORS[order.status]
                          ? Object.fromEntries(STATUS_COLORS[order.status].split(';').filter(Boolean).map(s => s.split(':').map(x => x.trim())))
                          : { background: 'rgba(100,116,139,0.15)', color: '#94a3b8' })
                      }}>
                        {order.status.toUpperCase().replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ ...s.td, color: '#94a3b8' }}>{getDeliveryLabel(order.delivery_type)}</td>
                    <td style={{ ...s.td, fontWeight: 600 }}>{order.total_amount ? `₹${order.total_amount}` : '—'}</td>
                    <td style={{ ...s.td, color: '#64748b', fontSize: '12px' }}>{formatDate(order.created_at)}</td>
                    <td style={s.td}>
                      <button style={s.actionBtn} onClick={() => window.open(`/track/${order.order_ref}`, '_blank')}>View →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
