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

interface Trial {
  machine_id: string;
  name: string;
  email?: string;
  phone: string;
  activated_at: string;
  trial_ends_at: string;
  usage_count: number;
}

interface License {
  id: string;
  license_key: string;
  order_ref: string;
  customer_name: string;
  customer_phone: string;
  plan: string;
  machine_id?: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

interface ResetRequest {
  id: string;
  license_key: string;
  email: string;
  reason: string;
  status: string;
  created_at: string;
}

interface Summary {
  summary_text?: string;
}

const BACKEND_URL = "";

const STATUS_COLORS: Record<string, string> = {
  flagged:      'background: rgba(239,68,68,0.15); color: #ef4444;',
  verified:     'background: rgba(52,211,153,0.15); color: #34d399;',
  pending:      'background: rgba(251,191,36,0.15); color: #fbbf24;',
  accepted:     'background: rgba(37,99,235,0.15); color: #60a5fa;',
  paid:         'background: rgba(167,139,250,0.15); color: #a78bfa;',
  completed:    'background: rgba(52,211,153,0.15); color: #34d399;',
  rejected:     'background: rgba(239,68,68,0.15); color: #ef4444;',
  cancelled:    'background: rgba(100,116,139,0.15); color: #94a3b8;',
  docs_reviewed:'background: rgba(251,191,36,0.15); color: #fbbf24;',
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'trials' | 'licenses' | 'resets'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [resets, setResets] = useState<ResetRequest[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingTrials, setLoadingTrials] = useState(false);
  const [loadingLicenses, setLoadingLicenses] = useState(false);
  const [loadingResets, setLoadingResets] = useState(false);
  
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  
  const token = localStorage.getItem('admin_token');

  // 1. Fetch Orders List
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      if (!token) {
        setError('Admin token missing. Please login again.');
        setLoadingOrders(false);
        return;
      }
      const res = await fetch(`${BACKEND_URL}/api/admin/orders`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      } else {
        setError(`Orders fetch failed: ${res.status}`);
      }
    } catch {
      setError('Network error fetching orders.');
    } finally {
      setLoadingOrders(false);
    }
  };

  // 2. Fetch Software Trials List
  const fetchTrials = async () => {
    setLoadingTrials(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/trials`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTrials(data.trials || []);
      }
    } catch {
      setError('Network error fetching trials.');
    } finally {
      setLoadingTrials(false);
    }
  };

  // 3. Fetch Software Licenses List
  const fetchLicenses = async () => {
    setLoadingLicenses(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/licenses`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLicenses(data.licenses || []);
      }
    } catch {
      setError('Network error fetching licenses.');
    } finally {
      setLoadingLicenses(false);
    }
  };

  // 4. Fetch PC Reset Requests List
  const fetchResets = async () => {
    setLoadingResets(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/reset-requests`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setResets(data.requests || []);
      }
    } catch {
      setError('Network error fetching reset requests.');
    } finally {
      setLoadingResets(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchOrders();
    // Optional summary
    if (token) {
      fetch(`${BACKEND_URL}/api/admin/summary`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => data && setSummary(data))
        .catch(() => {});
    }
  }, []);

  // Fetch when tabs change
  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'trials') fetchTrials();
    if (activeTab === 'licenses') fetchLicenses();
    if (activeTab === 'resets') fetchResets();
  }, [activeTab]);

  // Order Actions: Mark software order as Paid (manual approval)
  const handleMarkAsPaid = async (orderRef: string) => {
    if (!window.confirm(`Kya aap order ${orderRef} ko PAID mark karna chahte hain? Isse automatically license key generate hokar client ke email par send ho jaegi.`)) {
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/update-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ order_ref: orderRef, status: 'paid' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Order successfully mark paid & license sent to email!');
        fetchOrders();
      } else {
        alert(data.error || 'Failed to update order.');
      }
    } catch {
      alert('Network error updating order.');
    }
  };

  // License Actions: Toggle status (Activate / Block Key)
  const handleToggleLicenseStatus = async (licenseId: string, currentStatus: boolean) => {
    const actionText = currentStatus ? 'BLOCK (deactivate)' : 'ACTIVATE';
    if (!window.confirm(`Kya aap is license key ko ${actionText} karna chahte hain?`)) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/licenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ license_id: licenseId, is_active: !currentStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('License status successfully updated!');
        fetchLicenses();
      } else {
        alert(data.error || 'Failed to update license.');
      }
    } catch {
      alert('Network error updating license.');
    }
  };

  // Reset Actions: Approve Reset (Unlock machine_id)
  const handleApproveReset = async (requestId: string, licenseKey: string) => {
    if (!window.confirm(`Kya aap license key ${licenseKey} ka reset request APPROVE karna chahte hain? Isse purana hardware binding delete ho jaega.`)) {
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/reset-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reset_id: requestId, action: 'approve' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('PC Reset Approved! Key is now ready to bind on another computer.');
        fetchResets();
      } else {
        alert(data.error || 'Failed to approve reset.');
      }
    } catch {
      alert('Network error approving reset.');
    }
  };

  // Reset Actions: Reject Reset
  const handleRejectReset = async (requestId: string) => {
    if (!window.confirm('Kya aap is reset request को REJECT करना चाहते हैं?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/reset-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reset_id: requestId, action: 'reject' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('PC Reset request rejected!');
        fetchResets();
      } else {
        alert(data.error || 'Failed to reject reset.');
      }
    } catch {
      alert('Network error rejecting reset.');
    }
  };

  // Filtering Logic
  const getFilteredData = () => {
    const q = search.toLowerCase();
    
    if (activeTab === 'orders') {
      return orders.filter(o => {
        const matchStatus = filter === 'all' || o.status === filter;
        const matchSearch = !q || o.order_ref.toLowerCase().includes(q) || o.customer_name.toLowerCase().includes(q) || o.customer_phone.includes(q);
        return matchStatus && matchSearch;
      });
    }
    
    if (activeTab === 'trials') {
      return trials.filter(t => !q || t.name.toLowerCase().includes(q) || t.phone.includes(q) || t.machine_id.toLowerCase().includes(q));
    }
    
    if (activeTab === 'licenses') {
      return licenses.filter(l => !q || l.license_key.toLowerCase().includes(q) || l.customer_name.toLowerCase().includes(q) || l.customer_phone.includes(q) || l.order_ref.toLowerCase().includes(q));
    }
    
    if (activeTab === 'resets') {
      return resets.filter(r => !q || r.license_key.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
    }
    
    return [];
  };

  const filteredItems = getFilteredData();

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return iso; }
  };

  const getDaysLeft = (expiryStr: string) => {
    try {
      const diff = new Date(expiryStr).getTime() - Date.now();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days > 0 ? `${days} Days remaining` : 'EXPIRED';
    } catch { return '—'; }
  };

  const counts = {
    total:     orders.length,
    pending:   orders.filter(o => o.status === 'pending').length,
    verified:  orders.filter(o => o.status === 'verified').length,
    completed: orders.filter(o => o.status === 'completed').length,
    trials:    trials.length,
    licenses:  licenses.filter(l => l.is_active).length,
    resets:    resets.filter(r => r.status === 'pending').length,
  };

  const s = {
    page:       { minHeight: '100vh', background: '#050913', color: '#e2e8f0', fontFamily: 'Inter, sans-serif', padding: '24px' },
    header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)' },
    logoSection:{ display: 'flex', alignItems: 'center', gap: '15px' },
    logoImg:    { width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover' as const },
    title:      { fontSize: '22px', fontWeight: 800, color: '#60a5fa', letterSpacing: '-0.02em', lineHeight: '1.2' },
    subtitle:   { fontSize: '12px', color: '#64748b', marginTop: '2px', fontWeight: 500 },
    badge:      { background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 },
    grid4:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' },
    card:       { background: '#0f1729', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' },
    cardBlue:   { background: '#0f1729', border: '1px solid rgba(37,99,235,0.3)', borderRadius: '12px', padding: '20px' },
    label:      { fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '8px' },
    bigNum:     { fontSize: '32px', fontWeight: 800, lineHeight: 1 },
    summaryTxt: { fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6, fontStyle: 'italic' as const },
    toolbar:    { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' as const, alignItems: 'center' },
    input:      { background: '#0f1729', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: '#e2e8f0', fontSize: '13px', outline: 'none', flex: 1, minWidth: '200px' },
    select:     { background: '#0f1729', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: '#e2e8f0', fontSize: '13px', outline: 'none' },
    table:      { width: '100%', borderCollapse: 'collapse' as const },
    th:         { padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.06em', textAlign: 'left' as const, borderBottom: '1px solid rgba(255,255,255,0.06)' },
    td:         { padding: '14px 16px', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.04)' },
    mono:       { fontFamily: 'monospace', color: '#60a5fa', fontWeight: 700 },
    name:       { fontWeight: 600, fontSize: '13px' },
    phone:      { fontSize: '11px', color: '#64748b', marginTop: '2px' },
    actionBtn:  { background: 'rgba(37,99,235,0.15)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.3)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', outline: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' },
    dangerBtn:  { background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', outline: 'none' },
    successBtn: { background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', outline: 'none' },
    tabsHeader: { display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 20px', background: 'rgba(255,255,255,0.01)' },
    tabButton:  (active: boolean) => ({ padding: '14px 20px', fontSize: '13px', fontWeight: 600, background: 'transparent', border: 'none', borderBottom: active ? '2px solid #60a5fa' : '2px solid transparent', color: active ? '#60a5fa' : '#64748b', cursor: 'pointer', transition: 'all 0.15s ease' }),
    errorBox:   { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '16px', color: '#ef4444', marginBottom: '20px' },
    loader:     { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b', fontSize: '15px' },
    empty:      { padding: '60px', textAlign: 'center' as const, color: '#64748b' },
  };

  const isTabLoading = 
    (activeTab === 'orders' && loadingOrders) ||
    (activeTab === 'trials' && loadingTrials) ||
    (activeTab === 'licenses' && loadingLicenses) ||
    (activeTab === 'resets' && loadingResets);

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
        <div style={s.badge}>● Live Dashboard</div>
      </div>

      {error && <div style={s.errorBox}>⚠️ {error}</div>}

      <div style={s.grid4}>
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
          <div style={s.label}>Active Trials</div>
          <div style={{ ...s.bigNum, color: '#fbbf24' }}>{counts.trials}</div>
        </div>
        <div style={s.card}>
          <div style={s.label}>Active Licenses (Zamify)</div>
          <div style={{ ...s.bigNum, color: '#34d399' }}>{counts.licenses}</div>
        </div>
        <div style={s.card}>
          <div style={s.label}>PC Reset Requests</div>
          <div style={{ ...s.bigNum, color: counts.resets > 0 ? '#ef4444' : '#64748b' }}>{counts.resets}</div>
        </div>
      </div>

      <div style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
        
        {/* Navigation Tabs */}
        <div style={s.tabsHeader}>
          <button style={s.tabButton(activeTab === 'orders')} onClick={() => setActiveTab('orders')}>
            📋 Orders & Services ({counts.total})
          </button>
          <button style={s.tabButton(activeTab === 'trials')} onClick={() => setActiveTab('trials')}>
            🧪 Software Trials ({counts.trials})
          </button>
          <button style={s.tabButton(activeTab === 'licenses')} onClick={() => setActiveTab('licenses')}>
            🔑 Active Subscriptions ({counts.licenses})
          </button>
          <button style={s.tabButton(activeTab === 'resets')} onClick={() => setActiveTab('resets')}>
            🔄 PC Resets {counts.resets > 0 && <span style={{ color: '#ef4444', fontWeight: 800 }}>({counts.resets})</span>}
          </button>
        </div>

        {/* Toolbar & Filters */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={s.toolbar}>
            <input
              style={s.input}
              placeholder={
                activeTab === 'orders' ? "🔍 Search by customer name, ref, or phone..." :
                activeTab === 'trials' ? "🔍 Search by name, phone, or Machine BIOS ID..." :
                activeTab === 'licenses' ? "🔍 Search by license key, customer, or Order Ref..." :
                "🔍 Search resets by license key or email..."
              }
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {activeTab === 'orders' && (
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
            )}
            <div style={{ fontSize: '12px', color: '#64748b', marginLeft: 'auto' }}>
              {filteredItems.length} records found
            </div>
          </div>
        </div>

        {/* Rendering Content */}
        {isTabLoading ? (
          <div style={s.loader}>⏳ Data fetch ho raha hai...</div>
        ) : filteredItems.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📭</div>
            <div>Koi record nahi mila</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            
            {/* TABS 1: ORDERS */}
            {activeTab === 'orders' && (
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
                  {filteredItems.map((order: any) => {
                    const hasSoftware = order.items && (order.items.toLowerCase().includes('automation') || order.items.toLowerCase().includes('s_automation'));
                    return (
                      <tr key={order.order_ref} style={{ transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={s.td}><span style={s.mono}>{order.order_ref}</span></td>
                        <td style={s.td}>
                          <div style={s.name}>{order.customer_name}</div>
                          <div style={s.phone}>{order.customer_phone} | {order.customer_email || 'No email'}</div>
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
                        <td style={{ ...s.td, color: '#94a3b8' }}>
                          {order.delivery_type === 'digital_whatsapp' ? '📲 Digital' : '🏪 Shop Visit'}
                        </td>
                        <td style={{ ...s.td, fontWeight: 600 }}>{order.total_amount ? `₹${order.total_amount}` : '—'}</td>
                        <td style={{ ...s.td, color: '#64748b', fontSize: '12px' }}>{formatDate(order.created_at)}</td>
                        <td style={s.td}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button style={s.actionBtn} onClick={() => window.open(`/track/${order.order_ref}`, '_blank')}>View →</button>
                            {hasSoftware && order.status !== 'paid' && order.status !== 'completed' && (
                              <button style={s.successBtn} onClick={() => handleMarkAsPaid(order.order_ref)}> Approve Manual Pay ✔</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* TABS 2: TRIALS */}
            {activeTab === 'trials' && (
              <table style={s.table}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <th style={s.th}>Customer</th>
                    <th style={s.th}>BIOS Machine ID</th>
                    <th style={s.th}>Usage Count</th>
                    <th style={s.th}>Activated At</th>
                    <th style={s.th}>Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((trial: any) => (
                    <tr key={trial.machine_id} style={{ transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={s.td}>
                        <div style={s.name}>{trial.name}</div>
                        <div style={s.phone}>📞 {trial.phone} {trial.email ? `| ✉️ ${trial.email}` : ''}</div>
                      </td>
                      <td style={s.td}><span style={{ ...s.mono, fontSize: '12px' }}>{trial.machine_id}</span></td>
                      <td style={s.td}>
                        <span style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                          {trial.usage_count} Times
                        </span>
                      </td>
                      <td style={{ ...s.td, color: '#94a3b8' }}>{formatDate(trial.activated_at)}</td>
                      <td style={{ ...s.td, color: '#f87171', fontWeight: 600 }}>{formatDate(trial.trial_ends_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* TABS 3: ACTIVE LICENSES */}
            {activeTab === 'licenses' && (
              <table style={s.table}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <th style={s.th}>License Key</th>
                    <th style={s.th}>Customer</th>
                    <th style={s.th}>Plan</th>
                    <th style={s.th}>Hardware Binding</th>
                    <th style={s.th}>Expiry (Renewal)</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((license: any) => (
                    <tr key={license.id} style={{ transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={s.td}><span style={{ ...s.mono, color: '#34d399' }}>{license.license_key}</span></td>
                      <td style={s.td}>
                        <div style={s.name}>{license.customer_name}</div>
                        <div style={s.phone}>Ref: {license.order_ref} | Phone: {license.customer_phone}</div>
                      </td>
                      <td style={s.td}>
                        <span className={`badge ${license.plan === 'yearly' ? 'badge-amber' : 'badge-blue'}`} style={{ textTransform: 'uppercase' }}>
                          {license.plan}
                        </span>
                      </td>
                      <td style={s.td}>
                        {license.machine_id ? (
                          <span style={{ ...s.mono, fontSize: '11px', color: '#f59e0b' }}>🔒 Locked: {license.machine_id.substring(0, 15)}...</span>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '12px' }}>🟢 Ready to bind</span>
                        )}
                      </td>
                      <td style={s.td}>
                        <div style={{ fontWeight: 600 }}>{formatDate(license.expires_at)}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{getDaysLeft(license.expires_at)}</div>
                      </td>
                      <td style={s.td}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: license.is_active ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.12)',
                          color: license.is_active ? '#34d399' : '#ef4444'
                        }}>
                          {license.is_active ? 'ACTIVE' : 'BLOCKED'}
                        </span>
                      </td>
                      <td style={s.td}>
                        <button 
                          style={license.is_active ? s.dangerBtn : s.successBtn} 
                          onClick={() => handleToggleLicenseStatus(license.id, license.is_active)}
                        >
                          {license.is_active ? 'Block Key 🚫' : 'Unblock Key 🟢'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* TABS 4: RESET REQUESTS */}
            {activeTab === 'resets' && (
              <table style={s.table}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <th style={s.th}>License Key</th>
                    <th style={s.th}>Registered Email</th>
                    <th style={s.th}>Reason</th>
                    <th style={s.th}>Date</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((req: any) => (
                    <tr key={req.id} style={{ transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={s.td}><span style={s.mono}>{req.license_key}</span></td>
                      <td style={s.td}>{req.email}</td>
                      <td style={s.td}><div style={{ maxWidth: '250px', wordBreak: 'break-word' }}>{req.reason}</div></td>
                      <td style={{ ...s.td, color: '#64748b' }}>{formatDate(req.created_at)}</td>
                      <td style={s.td}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: 
                            req.status === 'approved' ? 'rgba(52,211,153,0.12)' : 
                            req.status === 'rejected' ? 'rgba(239,68,68,0.12)' : 'rgba(251,191,36,0.12)',
                          color: 
                            req.status === 'approved' ? '#34d399' : 
                            req.status === 'rejected' ? '#ef4444' : '#fbbf24'
                        }}>
                          {req.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={s.td}>
                        {req.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button style={s.successBtn} onClick={() => handleApproveReset(req.id, req.license_key)}>Approve reset ✔</button>
                            <button style={s.dangerBtn} onClick={() => handleRejectReset(req.id)}>Reject</button>
                          </div>
                        ) : (
                          <span style={{ color: '#64748b' }}>Handled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
