import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import type { OrderTrackingResponse } from '../types';
import { trackOrder } from '../utils/api';
import { useLanguageStore } from '../store/languageStore';
import { createT } from '../utils/i18n';
import { StatusTimeline } from '../components/StatusTimeline';

function fireConfetti() {
  const opts = { spread: 90, startVelocity: 35, decay: 0.92, scalar: 1.1 };
  confetti({ particleCount: 80, angle: 60, origin: { x: 0, y: 0.6 }, colors: ['#2563EB', '#34D399', '#FBBF24', '#F0F4FF'], ...opts });
  confetti({ particleCount: 80, angle: 120, origin: { x: 1, y: 0.6 }, colors: ['#2563EB', '#34D399', '#FBBF24', '#F0F4FF'], ...opts });
  setTimeout(() => {
    confetti({ particleCount: 40, angle: 90, origin: { x: 0.5, y: 0.4 }, gravity: 0.9, scalar: 0.8 });
  }, 200);
}

export default function OrderTracking() {
  const { ref: paramRef } = useParams<{ ref: string }>();
  const navigate = useNavigate();
  const { lang } = useLanguageStore();
  const t = createT(lang);

  const [inputRef, setInputRef]           = useState(paramRef || sessionStorage.getItem('csc_order_ref') || '');
  const [order, setOrder]                 = useState<OrderTrackingResponse | null>(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [confettiFired, setConfettiFired] = useState(false);

  const doTrack = useCallback(async (ref: string) => {
    if (!ref.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await trackOrder(ref.trim());
      setOrder(data);
    } catch {
      setError(t('track.notFound'));
      setOrder(null);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const ref = paramRef || sessionStorage.getItem('csc_order_ref');
    if (ref) { setInputRef(ref); doTrack(ref); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramRef]);

  useEffect(() => {
    if (order?.status === 'completed' && !confettiFired) {
      setConfettiFired(true);
      setTimeout(fireConfetti, 500);
    }
  }, [order?.status, confettiFired]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return iso; }
  };

  // ✅ Delivery type ko readable text mein convert karna
  const getDeliveryLabel = (deliveryType: string) => {
    if (deliveryType === 'digital_whatsapp') {
      return lang === 'hi' ? 'डिजिटल (WhatsApp/Email)' : 'Digital (WhatsApp/Email)';
    }
    if (deliveryType === 'shop_visit') {
      return lang === 'hi' ? 'दुकान पर आएं' : 'Shop Visit';
    }
    return deliveryType;
  };

  // ✅ WhatsApp number — backend se aata hai, fallback .env se, last resort hardcoded
  const waNumber = order?.support_whatsapp
    || import.meta.env.VITE_STORE_WHATSAPP
    || '917023029903';

  // ✅ Service name — items array se pehla item ka naam
  const serviceName = order?.items && order.items.length > 0
    ? order.items.map(i => i.name).join(', ')
    : '—';

  // ✅ Total amount — backend 'total_amount' field
  const totalAmount = order?.total_amount ?? 0;

  return (
    <div className="page-wrapper" style={{ paddingBottom: '80px' }}>
      <div className="container" style={{ paddingTop: '32px', maxWidth: '640px' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <button onClick={() => navigate('/')} className="btn-ghost" style={{ padding: '7px 14px', fontSize: '12px', marginBottom: '16px' }}>
            ← {t('common.back')}
          </button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800 }}>
            📦 {t('track.title')}
          </h1>
        </div>

        {/* Search Bar */}
        <div className="glass-card animate-fadeUp" style={{ padding: '20px', marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
            {t('track.ref')}
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              className="input-field"
              type="text"
              placeholder={t('track.refPlaceholder')}
              value={inputRef}
              onChange={e => setInputRef(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && doTrack(inputRef)}
              style={{ flex: 1 }}
            />
            <button
              className="btn-primary"
              style={{ padding: '12px 20px', fontWeight: 700, flexShrink: 0 }}
              onClick={() => doTrack(inputRef)}
              disabled={loading || !inputRef.trim()}
            >
              {loading ? <div className="spinner" /> : t('track.search')}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="animate-fadeUp" style={{
            background: 'var(--red-dim)',
            border: '1px solid rgba(248,113,113,0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex', gap: '12px', alignItems: 'center',
            color: 'var(--red)', fontSize: '14px',
          }}>
            <span style={{ fontSize: '20px' }}>🔍</span>
            <span>{error}</span>
          </div>
        )}

        {/* Order Details */}
        {order && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Completed Banner */}
            {order.status === 'completed' && (
              <div className="animate-scaleIn" style={{
                background: 'linear-gradient(135deg, rgba(52,211,153,0.12) 0%, rgba(52,211,153,0.05) 100%)',
                border: '1px solid rgba(52,211,153,0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🎉</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: 'var(--green)', marginBottom: '6px' }}>
                  {lang === 'hi' ? 'आपकी सेवा पूर्ण हो गई!' : 'Service Completed!'}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {lang === 'hi' ? 'दस्तावेज़ WhatsApp/Email पर भेज दिए गए हैं।' : 'Documents have been delivered to your WhatsApp/Email.'}
                </p>
              </div>
            )}

            {/* Summary Card */}
            <div className="glass-card animate-fadeUp" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {lang === 'hi' ? 'ऑर्डर विवरण' : 'Order Details'}
                </h2>
                <span style={{
                  fontFamily: 'monospace', fontSize: '12px', fontWeight: 700,
                  color: 'var(--blue-light)',
                  background: 'var(--blue-dim)',
                  padding: '4px 10px', borderRadius: '6px',
                }}>
                  {order.order_ref}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  // ✅ customer_name — backend se sahi aa raha hai
                  { label: t('track.customer'), value: order.customer_name || '—', icon: '👤' },
                  // ✅ items array se service naam
                  { label: t('track.service'), value: serviceName, icon: '📋' },
                  { label: t('track.placed'), value: formatDate(order.created_at), icon: '📅' },
                  // ✅ delivery_type ko readable text mein convert kiya
                  { label: t('track.delivery'), value: getDeliveryLabel(order.delivery_type), icon: order.delivery_type === 'digital_whatsapp' ? '📲' : '🏪' },
                  // ✅ total_amount — backend ka actual field
                  { label: t('track.total'), value: totalAmount > 0 ? `₹${totalAmount.toLocaleString('en-IN')}` : t('card.free'), icon: '💰' },
                  { label: lang === 'hi' ? 'अंतिम अपडेट' : 'Last Updated', value: formatDate(order.updated_at), icon: '🕐' },
                ].map(item => (
                  <div key={item.label} style={{
                    padding: '12px',
                    background: 'rgba(5,9,19,0.4)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                  }}>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                      {item.icon} {item.label}
                    </p>
                    <p style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.3 }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Timeline */}
            <div className="glass-card animate-fadeUp" style={{ animationDelay: '80ms', padding: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, marginBottom: '24px', color: 'var(--text-secondary)' }}>
                📊 {lang === 'hi' ? 'ऑर्डर की स्थिति' : 'Order Status'}
              </h2>
              <StatusTimeline currentStatus={order.status} lang={lang} />
            </div>

            {/* Payment CTA */}
            {order.status === 'accepted' && order.payment_link_url && (
              <div className="animate-scaleIn glass-card" style={{
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(37,99,235,0.03) 100%)',
                border: '1px solid rgba(37,99,235,0.2)',
              }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '44px', height: '44px', flexShrink: 0,
                    background: 'var(--blue-dim)',
                    border: '1px solid rgba(37,99,235,0.25)',
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px',
                  }}>💳</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>
                      {lang === 'hi' ? 'भुगतान की आवश्यकता है' : 'Payment Required'}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
                      {lang === 'hi'
                        ? 'आपके दस्तावेज़ तैयार हैं। प्रक्रिया जारी रखने के लिए भुगतान करें।'
                        : 'Your documents are ready. Please complete the payment to proceed.'}
                    </p>
                    <a
                      href={order.payment_link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        textDecoration: 'none', padding: '12px 24px', fontSize: '14px',
                        animation: 'pulse-blue 2s ease infinite',
                      }}
                    >
                      💳 {t('track.payNow')} — ₹{totalAmount.toLocaleString('en-IN')}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Completion Info */}
            {order.status === 'completed' && (order.completion_info || order.completion_infoHi) && (
              <div className="glass-card animate-fadeUp" style={{
                padding: '20px',
                background: 'var(--green-dim)',
                border: '1px solid rgba(52,211,153,0.2)',
              }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: 'var(--green)', marginBottom: '10px' }}>
                  ✅ {t('track.completionInfo')}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {lang === 'hi' ? (order.completion_infoHi || order.completion_info) : order.completion_info}
                </p>
              </div>
            )}

            {/* WhatsApp Support Strip */}
            <div style={{
              padding: '16px',
              background: 'rgba(5,9,19,0.4)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '14px' }}>❓</span>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 1 }}>
                {lang === 'hi'
                  ? 'कोई प्रश्न? हमसे WhatsApp पर संपर्क करें।'
                  : 'Have questions? Contact us on WhatsApp for support.'}
              </p>
              {/* ✅ WhatsApp number backend se ya .env se — hardcoded nahi */}
              <a
                href={`https://wa.me/${waNumber}?text=Hi%2C+my+order+ref+is+${order.order_ref}.+I+need+help.`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: '#25D366', color: '#fff',
                  padding: '8px 14px', borderRadius: 'var(--radius-sm)',
                  fontSize: '12px', fontWeight: 700, textDecoration: 'none',
                }}
              >
                <span>💬</span> WhatsApp
              </a>
            </div>

          </div>
        )}

        {/* Empty State */}
        {!order && !loading && !error && (
          <div className="glass-card animate-fadeUp" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>📦</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
              {lang === 'hi' ? 'अपना ऑर्डर ट्रैक करें' : 'Track Your Order'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '320px', margin: '0 auto' }}>
              {lang === 'hi'
                ? 'ऊपर अपना ऑर्डर संदर्भ नंबर दर्ज करें और अपनी सेवा की स्थिति देखें।'
                : 'Enter your order reference number above to check the real-time status of your service.'}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
