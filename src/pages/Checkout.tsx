import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useLanguageStore } from '../store/languageStore';
import { createT } from '../utils/i18n';
import { placeOrder } from '../utils/api';
import type { DeliveryType, CustomerInfo } from '../types';

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

function validateForm(info: CustomerInfo): FormErrors {
  const errors: FormErrors = {};
  if (!info.name.trim()) errors.name = 'Full name is required';
  if (!info.phone.trim()) errors.phone = 'Mobile number is required';
  else if (!/^[6-9]\d{9}$/.test(info.phone.replace(/\s/g, ''))) errors.phone = 'Enter a valid 10-digit Indian mobile number';
  if (info.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email)) errors.email = 'Enter a valid email address';
  return errors;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCartStore();
  const { lang } = useLanguageStore();
  const t = createT(lang);

  const [delivery, setDelivery] = useState<DeliveryType>('digital');
  const [info, setInfo] = useState<CustomerInfo>({ name: '', email: '', phone: '', notes: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const total = totalPrice();

  // Redirect if cart is empty
  if (items.length === 0) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛒</div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
            {t('cart.empty')}
          </p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{t('cart.emptySub')}</p>
          <button className="btn-primary" onClick={() => navigate('/')}>{t('detail.backToHome')}</button>
        </div>
      </div>
    );
  }

  const handleChange = (field: keyof CustomerInfo) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInfo(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field as keyof FormErrors]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm(info);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    setApiError('');
    try {
      const res = await placeOrder({
        items: items.map(i => ({
          product_id: i.product.id,
          quantity: i.quantity,
          price: i.product.price,
          name: i.product.name,
        })),
        customer: info,
        delivery_type: delivery,
        total,
      });

      if (res.success) {
        // Store ref + customer info for OTP page
        sessionStorage.setItem('csc_order_ref', res.order_ref);
        sessionStorage.setItem('csc_customer_phone', info.phone);
        clearCart();
        navigate('/verify-otp');
      } else {
        setApiError(t('common.error'));
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ paddingBottom: '80px' }}>
      <div className="container" style={{ paddingTop: '32px', maxWidth: '720px' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <button onClick={() => navigate(-1)} className="btn-ghost" style={{ padding: '7px 14px', fontSize: '12px', marginBottom: '16px' }}>
            ← {t('common.back')}
          </button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800 }}>
            {t('checkout.title')}
          </h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── Order Summary ───────────────────────────────────────────────── */}
          <div className="glass-card animate-fadeUp" style={{ padding: '20px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-secondary)' }}>
              📋 {t('checkout.orderSummary')}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map(item => (
                <div key={item.product.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    <span style={{
                      width: '36px', height: '36px', flexShrink: 0,
                      background: 'var(--bg-700)', borderRadius: '8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px',
                    }}>{item.product.emoji}</span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lang === 'hi' ? item.product.nameHi : item.product.name}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                    {item.product.price === 0 ? t('card.free') : `₹${item.product.price * item.quantity}`}
                  </span>
                </div>
              ))}
            </div>

            <div className="divider" style={{ margin: '16px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{t('checkout.delivery')}</span>
              <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: '13px' }}>{t('checkout.free')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px' }}>{t('cart.total')}</span>
              <span style={{
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px',
                color: total === 0 ? 'var(--green)' : 'var(--text-primary)',
              }}>
                {total === 0 ? t('card.free') : `₹${total}`}
              </span>
            </div>
          </div>

          {/* ── Delivery Method ─────────────────────────────────────────────── */}
          <div className="glass-card animate-fadeUp" style={{ animationDelay: '80ms', padding: '20px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-secondary)' }}>
              🚚 {t('checkout.delivery')}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Digital */}
              <div
                className={`delivery-option ${delivery === 'digital' ? 'selected' : ''}`}
                onClick={() => setDelivery('digital')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '22px' }}>📲</span>
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%',
                    border: `2px solid ${delivery === 'digital' ? 'var(--blue)' : 'var(--border)'}`,
                    background: delivery === 'digital' ? 'var(--blue)' : 'transparent',
                    flexShrink: 0, marginLeft: 'auto',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {delivery === 'digital' && <span style={{ fontSize: '10px', color: '#fff' }}>✓</span>}
                  </div>
                </div>
                <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{t('checkout.digital')}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{t('checkout.digital.desc')}</p>
                <p style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 600, marginTop: '6px' }}>{t('checkout.free')}</p>
              </div>

              {/* Pickup */}
              <div
                className={`delivery-option ${delivery === 'pickup' ? 'selected' : ''}`}
                onClick={() => setDelivery('pickup')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '22px' }}>🏪</span>
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%',
                    border: `2px solid ${delivery === 'pickup' ? 'var(--blue)' : 'var(--border)'}`,
                    background: delivery === 'pickup' ? 'var(--blue)' : 'transparent',
                    flexShrink: 0, marginLeft: 'auto',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {delivery === 'pickup' && <span style={{ fontSize: '10px', color: '#fff' }}>✓</span>}
                  </div>
                </div>
                <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{t('checkout.pickup')}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{t('checkout.pickup.desc')}</p>
                <p style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 600, marginTop: '6px' }}>{t('checkout.free')}</p>
              </div>
            </div>
          </div>

          {/* ── Customer Info ───────────────────────────────────────────────── */}
          <div className="glass-card animate-fadeUp" style={{ animationDelay: '160ms', padding: '20px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-secondary)' }}>
              👤 {t('checkout.customerInfo')}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  {t('checkout.name')} <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <input
                  className="input-field"
                  type="text"
                  placeholder={lang === 'hi' ? 'अपना पूरा नाम दर्ज करें' : 'Enter your full name'}
                  value={info.name}
                  onChange={handleChange('name')}
                  style={{ borderColor: errors.name ? 'var(--red)' : undefined }}
                />
                {errors.name && <p style={{ fontSize: '11px', color: 'var(--red)', marginTop: '4px' }}>⚠ {errors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  {t('checkout.phone')} <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600,
                  }}>+91</span>
                  <input
                    className="input-field"
                    type="tel"
                    maxLength={10}
                    placeholder={lang === 'hi' ? '10 अंकों का मोबाइल नंबर' : '10-digit mobile number'}
                    value={info.phone}
                    onChange={handleChange('phone')}
                    style={{ paddingLeft: '44px', borderColor: errors.phone ? 'var(--red)' : undefined }}
                  />
                </div>
                {errors.phone && <p style={{ fontSize: '11px', color: 'var(--red)', marginTop: '4px' }}>⚠ {errors.phone}</p>}
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  {t('checkout.email')} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  className="input-field"
                  type="email"
                  placeholder={lang === 'hi' ? 'ईमेल पता (वैकल्पिक)' : 'your@email.com (optional)'}
                  value={info.email}
                  onChange={handleChange('email')}
                  style={{ borderColor: errors.email ? 'var(--red)' : undefined }}
                />
                {errors.email && <p style={{ fontSize: '11px', color: 'var(--red)', marginTop: '4px' }}>⚠ {errors.email}</p>}
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  {t('checkout.notes')} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  className="input-field"
                  placeholder={t('checkout.notes.placeholder')}
                  value={info.notes}
                  onChange={handleChange('notes')}
                  rows={3}
                  style={{ resize: 'vertical', minHeight: '80px' }}
                />
              </div>
            </div>
          </div>

          {/* API Error */}
          {apiError && (
            <div style={{
              background: 'var(--red-dim)',
              border: '1px solid rgba(248,113,113,0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex', gap: '10px', alignItems: 'center',
              color: 'var(--red)', fontSize: '13px',
            }}>
              <span>⚠️</span>
              <span>{apiError}</span>
            </div>
          )}

          {/* Submit */}
          <button
            className="btn-primary"
            style={{ padding: '16px', fontSize: '16px', fontWeight: 700, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <><div className="spinner" /> {t('checkout.processing')}</>
            ) : (
              <>{t('checkout.placeOrder')} 📱</>
            )}
          </button>

          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
            🔒 {lang === 'hi' ? 'आपकी जानकारी सुरक्षित है। OTP सत्यापन आवश्यक है।' : 'Your information is secure. OTP verification required.'}
          </p>
        </div>
      </div>
    </div>
  );
}
