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
    label:      { fontSize: '11px', fontWeight: 600, color: '#
