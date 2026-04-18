import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '../store/languageStore';
import { createT } from '../utils/i18n';
import { verifyOTP, resendOTP } from '../utils/api';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function OTPVerification() {
  const navigate = useNavigate();
  const { lang } = useLanguageStore();
  const t = createT(lang);

  const orderRef  = sessionStorage.getItem('csc_order_ref') || '';
  const phone     = sessionStorage.getItem('csc_customer_phone') || '';

  const [digits, setDigits]         = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState(false);
  const [cooldown, setCooldown]     = useState(RESEND_COOLDOWN);
  const [resending, setResending]   = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no order ref
  useEffect(() => {
    if (!orderRef) navigate('/');
  }, [orderRef, navigate]);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const otp = digits.join('');

  const focusInput = (idx: number) => {
    const el = inputRefs.current[idx];
    if (el) { el.focus(); el.select(); }
  };

  const handleChange = useCallback((idx: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1);
    setError('');
    setDigits(prev => {
      const next = [...prev];
      next[idx] = char;
      return next;
    });
    if (char && idx < OTP_LENGTH - 1) {
      setTimeout(() => focusInput(idx + 1), 10);
    }
  }, []);

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        setDigits(prev => { const n = [...prev]; n[idx] = ''; return n; });
      } else if (idx > 0) {
        focusInput(idx - 1);
        setDigits(prev => { const n = [...prev]; n[idx - 1] = ''; return n; });
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      focusInput(idx - 1);
    } else if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1) {
      focusInput(idx + 1);
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted.length > 0) {
      const newDigits = [...Array(OTP_LENGTH).fill('')];
      pasted.split('').forEach((c, i) => { newDigits[i] = c; });
      setDigits(newDigits);
      focusInput(Math.min(pasted.length, OTP_LENGTH - 1));
      e.preventDefault();
    }
  };

  const handleVerify = async () => {
    if (otp.length < OTP_LENGTH) {
      setError(lang === 'hi' ? 'कृपया 6-अंकीय OTP दर्ज करें' : 'Please enter the complete 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyOTP({ order_ref: orderRef, otp });
      setSuccess(true);
      setTimeout(() => {
        navigate(`/track/${orderRef}`);
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
      setDigits(Array(OTP_LENGTH).fill(''));
      setTimeout(() => focusInput(0), 50);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      await resendOTP({ order_ref: orderRef });
      setCooldown(RESEND_COOLDOWN);
      setDigits(Array(OTP_LENGTH).fill(''));
      setTimeout(() => focusInput(0), 50);
    } catch {
      setError(t('common.error'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '32px 16px' }}>
      <div className="glass-card animate-scaleIn" style={{ width: '100%', maxWidth: '420px', padding: '36px 28px', textAlign: 'center' }}>

        {/* Icon */}
        <div style={{
          width: '72px', height: '72px',
          background: success ? 'var(--green-dim)' : 'var(--blue-dim)',
          border: `2px solid ${success ? 'rgba(52,211,153,0.3)' : 'rgba(37,99,235,0.3)'}`,
          borderRadius: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem',
          margin: '0 auto 20px',
          transition: 'all 0.5s ease',
        }}>
          {success ? '✅' : '📱'}
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>
          {t('otp.title')}
        </h1>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', lineHeight: 1.5 }}>
          {t('otp.subtitle')}
        </p>
        {phone && (
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: 'var(--blue-light)', marginBottom: '28px' }}>
            +91 {phone}
          </p>
        )}

        {/* OTP Input Grid */}
        <div
          style={{
            display: 'flex', gap: '8px', justifyContent: 'center',
            marginBottom: '24px',
          }}
          onPaste={handlePaste}
        >
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={el => { inputRefs.current[idx] = el; }}
              className={`otp-input ${digit ? 'filled' : ''}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(idx, e.target.value)}
              onKeyDown={e => handleKeyDown(idx, e)}
              onClick={() => focusInput(idx)}
              disabled={loading || success}
              aria-label={`OTP digit ${idx + 1}`}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="animate-fadeUp" style={{
            background: 'var(--red-dim)',
            border: '1px solid rgba(248,113,113,0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            marginBottom: '16px',
            color: 'var(--red)', fontSize: '13px',
            display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="animate-scaleIn" style={{
            background: 'var(--green-dim)',
            border: '1px solid rgba(52,211,153,0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            marginBottom: '16px',
            color: 'var(--green)', fontSize: '13px', fontWeight: 600,
          }}>
            {t('otp.success')}
          </div>
        )}

        {/* Verify Button */}
        <button
          className="btn-primary"
          style={{
            width: '100%', padding: '14px', fontSize: '15px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            background: success ? 'var(--green)' : undefined,
            marginBottom: '16px',
          }}
          onClick={handleVerify}
          disabled={loading || success || otp.length < OTP_LENGTH}
        >
          {loading ? (
            <><div className="spinner" /> {t('otp.verifying')}</>
          ) : success ? (
            '✓ Verified!'
          ) : (
            t('otp.verify')
          )}
        </button>

        {/* Resend */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            style={{
              background: 'none',
              border: 'none',
              color: cooldown > 0 ? 'var(--text-muted)' : 'var(--blue-light)',
              cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'color var(--transition)',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            {resending ? (
              <><div className="spinner" style={{ width: '14px', height: '14px' }} /> Sending...</>
            ) : cooldown > 0 ? (
              <>{t('otp.resendIn')} {cooldown}{t('otp.sec')}</>
            ) : (
              <>🔄 {t('otp.resend')}</>
            )}
          </button>

          <button
            onClick={() => navigate('/checkout')}
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-muted)', fontSize: '12px',
              cursor: 'pointer', transition: 'color var(--transition)',
            }}
          >
            {t('otp.wrongNumber')} {t('otp.backToCheckout')}
          </button>
        </div>

        {/* Order ref */}
        {orderRef && (
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {lang === 'hi' ? 'ऑर्डर संदर्भ' : 'Order Ref'}:{' '}
              <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontWeight: 600 }}>{orderRef}</span>
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {lang === 'hi' ? 'इसे सुरक्षित रखें। ट्रैकिंग के लिए आवश्यक है।' : 'Save this for order tracking.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
