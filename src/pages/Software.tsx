import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useLanguageStore } from '../store/languageStore';
import { createT } from '../utils/i18n';
import { MOCK_PRODUCTS } from '../utils/mockData';

export default function Software() {
  const navigate = useNavigate();
  const { addItem, openCart } = useCartStore();
  const { lang } = useLanguageStore();
  const t = createT(lang);

  // Retrieve products
  const monthlyProduct = MOCK_PRODUCTS.find(p => p.id === 's_automation_monthly');
  const yearlyProduct = MOCK_PRODUCTS.find(p => p.id === 's_automation_yearly');

  // License Key Retrieval State
  const [orderRef, setOrderRef] = useState('');
  const [retrieving, setRetrieving] = useState(false);
  const [retrievedKey, setRetrievedKey] = useState<any>(null);
  const [retrieveError, setRetrieveError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const handlePurchase = (planId: string) => {
    const product = MOCK_PRODUCTS.find(p => p.id === planId);
    if (product) {
      addItem(product);
      openCart();
    }
  };

  const handleRetrieveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderRef.trim()) return;

    setRetrieving(true);
    setRetrieveError('');
    setRetrievedKey(null);
    setCopySuccess(false);

    try {
      // Direct call to Vercel Serverless Function
      const res = await fetch(`/api/software?action=retrieve-key&order_ref=${encodeURIComponent(orderRef.trim().toUpperCase())}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setRetrievedKey(data);
      } else {
        setRetrieveError(data.error || 'Something went wrong. Please check your order reference and try again.');
      }
    } catch (err) {
      setRetrieveError('Failed to connect to server. Please try again later.');
    } finally {
      setRetrieving(false);
    }
  };

  const handleCopyKey = () => {
    if (retrievedKey?.license_key) {
      navigator.clipboard.writeText(retrievedKey.license_key);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="page-wrapper fade-in" style={{ paddingBottom: '100px', background: 'var(--bg, #0a0f1e)' }}>
      <div className="container" style={{ paddingTop: '32px' }}>
        
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '24px' }}>
          <button onClick={() => navigate('/')} className="btn-ghost" style={{ padding: '7px 14px', fontSize: '12px' }}>
            ← {lang === 'hi' ? 'सेवाओं पर वापस' : 'Back to Services'}
          </button>
        </div>

        {/* ── HERO SECTION ── */}
        <section className="glass-card animate-fadeUp" style={{ padding: '40px 30px', textAlign: 'center', marginBottom: '40px', position: 'relative', overflow: 'hidden' }}>
          {/* Decorative Background Glows */}
          <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(37,99,235,0.15)', filter: 'blur(80px)', zIndex: 0 }} />
          <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(96,165,250,0.12)', filter: 'blur(80px)', zIndex: 0 }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '3rem', animation: 'spin-slow 20s linear infinite' }}>
              💻
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#fff', marginBottom: '12px', letterSpacing: '-0.5px' }}>
              {lang === 'hi' ? 'लैंड रिकॉर्ड्स ऑटोमेशन सॉफ्टवेयर' : 'Land Records Automation Suite'}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 'clamp(14px, 2vw, 16px)', maxWidth: '640px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              {lang === 'hi'
                ? 'जमाबंदी नकल, नक्शा ट्रेस, और बंटवारा शीट स्वचालित रूप से निकालने के लिए शक्तिशाली और आसान पायथन सॉफ्टवेयर। अब आपके ई-मित्र का काम होगा 10 गुना तेज़!'
                : 'Powerful Python-based automation tool to fetch Jamabandi Nakal, Naksha Trace, and Bantwara Sheets instantly. Speed up your CSC and e-Mitra tasks by 10x!'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <a
                href="https://qhqvmzrdncxddzlfrgrn.supabase.co/storage/v1/object/public/software/Harsh_CSC_Automation_Setup.zip"
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', fontSize: '15px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(37,99,235,0.4)' }}
              >
                📥 {lang === 'hi' ? 'फ्री ट्रायल डाउनलोड करें (7 दिन)' : 'Download Free Trial (7 Days)'}
              </a>
              <a
                href="#pricing"
                className="btn-ghost"
                style={{ padding: '14px 28px', fontSize: '15px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.15)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
              >
                💳 {lang === 'hi' ? 'सब्सक्रिप्शन प्लान्स' : 'View Subscription Plans'}
              </a>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '14px' }}>
              ⚠️ {lang === 'hi' ? 'केवल विंडोज 10 और 11 (64-बिट) के लिए उपलब्ध' : 'Available for Windows 10 & 11 (64-bit) Only'}
            </p>
          </div>
        </section>

        {/* ── KEY FEATURES ── */}
        <section style={{ marginBottom: '50px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, textAlign: 'center', color: '#60a5fa', marginBottom: '32px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            ⚡ {lang === 'hi' ? 'मुख्य विशेषताएं और टूल्स' : 'Key Features & Included Tools'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {[
              {
                title: lang === 'hi' ? 'जमाबंदी नकल ऑटोमेशन' : 'Jamabandi Nakal Automation',
                desc: lang === 'hi' ? 'खाता संख्या, खसरा संख्या या नाम द्वारा भू-अभिलेखों (नकल) को स्वचालित रूप से खोज कर पीडीएफ फॉर्मेट में सिंगल-क्लिक से डाउनलोड करें।' : 'Automatically search and download land record Nakals by Khata number, Khasra, or owner name into high-quality PDF format in a single click.',
                emoji: '📄',
                color: 'rgba(56,189,248,0.08)',
                borderColor: 'rgba(56,189,248,0.2)'
              },
              {
                title: lang === 'hi' ? 'नक्शा ट्रेस एक्सट्रैक्शन' : 'Naksha Trace Automation',
                desc: lang === 'hi' ? 'बिना किसी परेशानी के गांव का नक्शा और चुनिंदा भूखंडों का ट्रेस स्वचालित रूप से एक्सट्रैक्ट और इमेज में कनवर्ट करें।' : 'Extract map traces and plot boundaries of selected areas directly from official sites without manual drawings or waiting.',
                emoji: '🗺️',
                color: 'rgba(52,211,153,0.08)',
                borderColor: 'rgba(52,211,153,0.2)'
              },
              {
                title: lang === 'hi' ? 'बंटवारा शीट क्रिएटर' : 'Bantwara Sheet Generator',
                desc: lang === 'hi' ? 'हिस्सेदारी गणना और बंटवारा पत्रक आसानी से जेनरेट करें। पूरी प्रक्रिया 100% सही और सरकार-मान्य गणना के साथ होगी।' : 'Auto-calculate land sharing formulas and draft Bantwara division sheets dynamically with error-free, mathematically verified templates.',
                emoji: '📊',
                color: 'rgba(167,139,250,0.08)',
                borderColor: 'rgba(167,139,250,0.2)'
              }
            ].map((feature, i) => (
              <div key={i} className="glass-card" style={{ padding: '24px', border: `1px solid ${feature.borderColor}`, background: feature.color, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '2.5rem' }}>{feature.emoji}</span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{feature.title}</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW TO USE ── */}
        <section className="glass-card" style={{ padding: '30px', marginBottom: '50px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '20px' }}>
            ⚙️ {lang === 'hi' ? 'इंस्टॉलेशन और सेटअप गाइड' : 'Installation & License Guide'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            {[
              {
                step: '1',
                title: lang === 'hi' ? 'सॉफ्टवेयर डाउनलोड करें' : 'Download Software',
                desc: lang === 'hi' ? 'ऊपर दिए गए "डाउनलोड ट्रायल" बटन पर क्लिक करके ZIP फ़ाइल को डाउनलोड करें और उसे अपने पीसी में एक्सट्रैक्ट (Unzip) करें।' : 'Click the download button above to retrieve the software setup ZIP file and extract it on your desktop.'
              },
              {
                step: '2',
                title: lang === 'hi' ? '7-दिन का ट्रायल शुरू करें' : 'Start 7-Day Trial',
                desc: lang === 'hi' ? 'सॉफ्टवेयर खोलें, अपनी बुनियादी जानकारी (नाम, फोन) दर्ज करें और 7 दिन के लिए फ्री ट्रायल तुरंत चालू करें।' : 'Open the app, enter your name and mobile number, and activate your free 7-day trial instantly without paying.'
              },
              {
                step: '3',
                title: lang === 'hi' ? 'लाइसेंस की खरीदें' : 'Get License Key',
                desc: lang === 'hi' ? 'ट्रायल पूरा होने पर, नीचे दिए गए सब्सक्रिप्शन प्लान को खरीदें और ऑर्डर रेफेरेंस द्वारा अपनी सीक्रेट लाइसेंस की जेनरेट करें।' : 'Once the trial ends, purchase a plan here, retrieve your licensing key using your order ID, and enter it in the app.'
              }
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--blue-dim)', border: '1px solid rgba(96,165,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: '#60a5fa', flexShrink: 0 }}>
                  {step.step}
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>{step.title}</h4>
                  <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PRICING PLAN CARDS ── */}
        <section id="pricing" style={{ marginBottom: '50px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, textAlign: 'center', color: '#60a5fa', marginBottom: '32px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            💳 {lang === 'hi' ? 'लाइसेंस सब्सक्रिप्शन प्लान्स' : 'Subscription pricing plans'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 320px))', gap: '24px', justifyContent: 'center' }}>
            
            {/* Monthly Card */}
            {monthlyProduct && (
              <div className="glass-card animate-fadeUp animate-delay-100" style={{ padding: '30px', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <span className="badge badge-blue" style={{ alignSelf: 'flex-start' }}>{monthlyProduct.badge}</span>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{lang === 'hi' ? monthlyProduct.nameHi : monthlyProduct.name}</h3>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{lang === 'hi' ? '30 दिन की वैधता' : '30 Days validity'}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 800, color: '#fff' }}>₹{monthlyProduct.price}</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>/ {lang === 'hi' ? 'महीना' : 'month'}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, flex: 1 }}>
                  {lang === 'hi' ? monthlyProduct.descriptionHi : monthlyProduct.description}
                </p>
                <button
                  onClick={() => handlePurchase(monthlyProduct.id)}
                  className="btn-primary"
                  style={{ width: '100%', padding: '12px', fontWeight: 700, background: 'rgba(37,99,235,0.2)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.4)', boxShadow: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--blue)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.2)'; e.currentTarget.style.color = '#60a5fa'; }}
                >
                  🛒 {lang === 'hi' ? 'प्लान खरीदें' : 'Buy Monthly Plan'}
                </button>
              </div>
            )}

            {/* Yearly Card (Best Value) */}
            {yearlyProduct && (
              <div className="glass-card animate-fadeUp animate-delay-200" style={{ padding: '30px', border: '1px solid rgba(139,92,246,0.3)', background: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(5,9,19,0.5) 100%)', position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                  <span className="badge badge-amber" style={{ animation: 'pulse 2s infinite' }}>⭐ {yearlyProduct.badge}</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{lang === 'hi' ? yearlyProduct.nameHi : yearlyProduct.name}</h3>
                  <p style={{ fontSize: '12px', color: '#a78bfa', marginTop: '4px' }}>✨ {lang === 'hi' ? '12 महीने की वैधता (सर्वोत्तम बचत)' : '12 Months validity (Best value)'}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 800, color: '#fff' }}>₹{yearlyProduct.price}</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>/ {lang === 'hi' ? 'वर्ष' : 'year'}</span>
                  {yearlyProduct.originalPrice && (
                    <span style={{ fontSize: '14px', color: '#64748b', textDecoration: 'line-through', marginLeft: '6px' }}>₹{yearlyProduct.originalPrice}</span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, flex: 1 }}>
                  {lang === 'hi' ? yearlyProduct.descriptionHi : yearlyProduct.description}
                </p>
                <button
                  onClick={() => handlePurchase(yearlyProduct.id)}
                  className="btn-primary"
                  style={{ width: '100%', padding: '12px', fontWeight: 700, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}
                >
                  👑 {lang === 'hi' ? 'प्रीमियम प्लान खरीदें' : 'Buy Yearly Plan'}
                </button>
              </div>
            )}

          </div>
        </section>

        {/* ── LICENSE KEY RETRIEVAL PORTAL ── */}
        <section className="glass-card animate-fadeUp animate-delay-300" style={{ padding: '36px 30px', maxWidth: '640px', margin: '0 auto', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '2.2rem' }}>🔑</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: '#fff', marginTop: '10px', marginBottom: '6px' }}>
              {lang === 'hi' ? 'लाइसेंस की प्राप्ति पोर्टल' : 'License Key Recovery Portal'}
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              {lang === 'hi'
                ? 'भुगतान सफल होने के बाद, यहाँ अपना ऑर्डर रेफेरेंस नंबर (Order Ref) डालकर तुरंत लाइसेंस की प्राप्त करें।'
                : 'After successful payment, enter your order reference ID below to generate and retrieve your key.'}
            </p>
          </div>

          <form onSubmit={handleRetrieveKey} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input
              type="text"
              className="input-field"
              placeholder={lang === 'hi' ? 'ऑर्डर संदर्भ दर्ज करें (उदा. CSC-123456)' : 'Enter Order Ref (e.g. CSC-123456)'}
              value={orderRef}
              onChange={e => setOrderRef(e.target.value.toUpperCase())}
              style={{ flex: 1, textTransform: 'uppercase' }}
              disabled={retrieving}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '12px 24px', fontWeight: 700, flexShrink: 0 }}
              disabled={retrieving || !orderRef.trim()}
            >
              {retrieving ? <div className="spinner" /> : (lang === 'hi' ? 'प्राप्त करें' : 'Get Key')}
            </button>
          </form>

          {/* Error Message */}
          {retrieveError && (
            <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>⚠️</span>
              <span>{retrieveError}</span>
            </div>
          )}

          {/* Key Output Render */}
          {retrievedKey && (
            <div className="animate-scaleIn" style={{ padding: '20px', background: 'rgba(5,9,19,0.6)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#60a5fa', letterSpacing: '0.05em' }}>
                  🔑 {lang === 'hi' ? 'आपका लाइसेंस की' : 'Your License Key'}
                </span>
                <span className="badge badge-green" style={{ textTransform: 'uppercase' }}>
                  {retrievedKey.plan} Plan
                </span>
              </div>

              {/* Copy Key Box */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                <input
                  type="text"
                  readOnly
                  value={retrievedKey.license_key}
                  style={{ flex: 1, background: '#0a0f1e', border: '1px solid rgba(255,255,255,0.1)', color: '#34d399', fontFamily: 'monospace', fontSize: '15px', fontWeight: 700, padding: '10px 14px', borderRadius: '8px', outline: 'none', textAlign: 'center', letterSpacing: '1px' }}
                />
                <button
                  onClick={handleCopyKey}
                  className="btn-primary"
                  style={{ padding: '10px 18px', background: copySuccess ? '#059669' : '#2563eb', flexShrink: 0, fontSize: '12px', fontWeight: 700 }}
                >
                  {copySuccess ? (lang === 'hi' ? 'कॉपी हो गया!' : 'Copied!') : (lang === 'hi' ? 'कॉपी करें' : 'Copy')}
                </button>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                <span>📅 {lang === 'hi' ? 'वैधता समाप्ति:' : 'Expiry:'} <strong>{formatDate(retrievedKey.expires_at)}</strong></span>
                <span>💻 {lang === 'hi' ? 'पीसी बाइंड स्थिति:' : 'Binned PC:'} <strong>{retrievedKey.machine_id ? 'LOCKED' : 'READY TO BIND'}</strong></span>
              </div>

              <div style={{ background: 'rgba(251,191,36,0.05)', borderLeft: '3px solid #fbbf24', padding: '10px 12px', borderRadius: '4px', fontSize: '11px', color: '#fbbf24', marginTop: '12px', lineHeight: 1.4 }}>
                ℹ️ {lang === 'hi'
                  ? 'निर्देश: सॉफ्टवेयर खोलें, "Activate Key" पर क्लिक करें और ऊपर दी गई की (Key) को पेस्ट करें। एक बार एक्टिवेट होने के बाद यह की उसी कंप्यूटर पर लॉक हो जाएगी।'
                  : 'Instructions: Open the software, click "Activate Key" and paste this key. Once activated, the license key binds only to that specific computer hardware.'}
              </div>
            </div>
          )}
        </section>

      </div>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-delay-100 { animation-delay: 80ms; }
        .animate-delay-200 { animation-delay: 160ms; }
        .animate-delay-300 { animation-delay: 240ms; }
      `}</style>
    </div>
  );
}
