import React, { useState, useEffect } from 'react';
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

  // Subscription plans fetched from database
  const [plans, setPlans] = useState<any[]>([]);
  const verifiedOrderRef = sessionStorage.getItem('csc_order_ref') || '';
  const isLoggedIn = !!verifiedOrderRef;

  useEffect(() => {
    fetch('/api/software?action=get-plans')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.plans) {
          setPlans(data.plans);
          // Sync prices in MOCK_PRODUCTS for consistent cart/checkout behavior
          data.plans.forEach((dbPlan: any) => {
            const mockId = dbPlan.id === 'single_monthly' ? 's_automation_single_monthly'
                         : dbPlan.id === 'single_yearly' ? 's_automation_single_yearly'
                         : dbPlan.id === 'multi_monthly' ? 's_automation_multi_monthly'
                         : dbPlan.id === 'multi_yearly' ? 's_automation_multi_yearly'
                         : dbPlan.id;
            const p = MOCK_PRODUCTS.find(item => item.id === mockId);
            if (p) {
              p.price = dbPlan.price;
              if (dbPlan.description) {
                p.description = dbPlan.description;
              }
            }
          });
        }
      })
      .catch(err => console.error('Failed to load plans:', err));
  }, []);

  // License Key Retrieval State
  const [retrieving, setRetrieving] = useState(false);
  const [retrievedKey, setRetrievedKey] = useState<any>(null);
  const [retrieveError, setRetrieveError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // License Reset State
  const [resetKey, setResetKey] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetReason, setResetReason] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetKey.trim() || !resetEmail.trim() || !resetReason.trim()) return;

    setResetting(true);
    setResetError('');
    setResetSuccess('');

    try {
      const res = await fetch('/api/software', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request-reset',
          license_key: resetKey.trim().toUpperCase(),
          email: resetEmail.trim(),
          reason: resetReason.trim()
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setResetSuccess(lang === 'hi' 
          ? 'रीसेट रिक्वेस्ट सफलतापूर्वक भेज दी गई है। एडमिन द्वारा रिव्यु के बाद इसे अप्रूव कर दिया जाएगा।'
          : 'Reset request submitted successfully. It will be active once approved by the admin.');
        setResetKey('');
        setResetEmail('');
        setResetReason('');
      } else {
        setResetError(data.error || 'Failed to submit reset request. Please check details.');
      }
    } catch (err) {
      setResetError('Failed to connect to server. Please try again later.');
    } finally {
      setResetting(false);
    }
  };

  const handlePurchase = (planId: string) => {
    const product = MOCK_PRODUCTS.find(p => p.id === planId);
    if (product) {
      addItem(product);
      openCart();
    }
  };

  const handleRetrieveKey = async () => {
    if (!verifiedOrderRef) return;

    setRetrieving(true);
    setRetrieveError('');
    setRetrievedKey(null);
    setCopySuccess(false);

    try {
      // Direct call to Vercel Serverless Function
      const res = await fetch(`/api/software?action=retrieve-key&order_ref=${encodeURIComponent(verifiedOrderRef.trim().toUpperCase())}`);
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
                href="/software/Harsh_CSC_Automation_Setup.zip"
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
            {plans.length > 0 ? (
              plans.map((plan: any) => {
                const mockId = plan.id === 'single_monthly' ? 's_automation_single_monthly'
                             : plan.id === 'single_yearly' ? 's_automation_single_yearly'
                             : plan.id === 'multi_monthly' ? 's_automation_multi_monthly'
                             : plan.id === 'multi_yearly' ? 's_automation_multi_yearly'
                             : plan.id;
                const product = MOCK_PRODUCTS.find(p => p.id === mockId);
                if (!product) return null;
                const isYearly = plan.billing === 'yearly';

                return (
                  <div key={plan.id} className="glass-card animate-fadeUp" style={{ padding: '30px', border: isYearly ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.08)', position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {isYearly && (
                      <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                        <span className="badge badge-amber" style={{ animation: 'pulse 2s infinite' }}>⭐ Best Value</span>
                      </div>
                    )}
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{lang === 'hi' ? product.nameHi : product.name}</h3>
                      <p style={{ fontSize: '12px', color: isYearly ? '#a78bfa' : '#64748b', marginTop: '4px' }}>
                        {lang === 'hi'
                          ? `${plan.billing === 'yearly' ? '12 महीने' : '30 दिन'} की वैधता (${plan.allowed_devices} डिवाइस)`
                          : `${plan.billing === 'yearly' ? '12 Months' : '30 Days'} validity (${plan.allowed_devices} Devices)`}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{ fontSize: '32px', fontWeight: 800, color: '#fff' }}>₹{plan.price}</span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>/ {lang === 'hi' ? (plan.billing === 'yearly' ? 'वर्ष' : 'महीना') : (plan.billing === 'yearly' ? 'year' : 'month')}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, flex: 1 }}>
                      {lang === 'hi' ? product.descriptionHi : plan.description}
                    </p>
                    <button
                      onClick={() => handlePurchase(product.id)}
                      className="btn-primary"
                      style={{ width: '100%', padding: '12px', fontWeight: 700 }}
                    >
                      🛒 {lang === 'hi' ? 'प्लान खरीदें' : 'Buy Plan'}
                    </button>
                  </div>
                );
              })
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading subscription plans...</div>
            )}
          </div>
        </section>

        {/* ── LICENSE KEY RETRIEVAL PORTAL (Restricted to logged-in users) ── */}
        <section className="glass-card animate-fadeUp animate-delay-300" style={{ padding: '36px 30px', maxWidth: '640px', margin: '0 auto', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '2.2rem' }}>🔑</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: '#fff', marginTop: '10px', marginBottom: '6px' }}>
              {lang === 'hi' ? 'लाइसेंस की प्राप्ति पोर्टल' : 'License Key Recovery Portal'}
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              {lang === 'hi'
                ? 'सुरक्षित रीकॉल के लिए आपको ऑर्डर सत्यापित (OTP Verified) होना आवश्यक है।'
                : 'For secure retrieval, you must be logged in with a verified order reference.'}
            </p>
          </div>

          {isLoggedIn ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ padding: '12px', background: 'rgba(5,9,19,0.4)', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '20px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {lang === 'hi' ? 'सत्यापित ऑर्डर संदर्भ' : 'Verified Order Ref'}:{' '}
                  <strong style={{ fontFamily: 'monospace', color: 'var(--blue-light)' }}>{verifiedOrderRef}</strong>
                </span>
              </div>
              <button
                onClick={handleRetrieveKey}
                className="btn-primary"
                style={{ padding: '14px 28px', fontWeight: 700, width: '100%' }}
                disabled={retrieving}
              >
                {retrieving ? <div className="spinner" /> : (lang === 'hi' ? '📩 मेरे ईमेल पर लाइसेंस की भेजें' : '📩 Send License Key to my Email')}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <p style={{ fontSize: '13px', color: '#f87171', marginBottom: '16px' }}>
                ⚠️ {lang === 'hi'
                  ? 'लाइसेंस की प्राप्त करने के लिए कृपया पहले अपने ऑर्डर को ट्रैक/सत्यापित करें।'
                  : 'Please track and verify your order first to retrieve your license key.'}
              </p>
              <button
                onClick={() => navigate('/track')}
                className="btn-ghost"
                style={{ padding: '10px 20px', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                🔍 {lang === 'hi' ? 'ऑर्डर ट्रैक करें' : 'Track Order'}
              </button>
            </div>
          )}

          {/* Error Message */}
          {retrieveError && (
            <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>⚠️</span>
              <span>{retrieveError}</span>
            </div>
          )}

          {/* Key Output Render */}
          {retrievedKey && (
            <div className="animate-scaleIn" style={{ padding: '20px', background: 'rgba(5,9,19,0.6)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '12px', marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.5rem' }}>📩</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#34d399' }}>
                  {lang === 'hi' ? 'लाइसेंस की ईमेल पर भेज दी गई है!' : 'License Key Sent to Email!'}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '12px' }}>
                {lang === 'hi' 
                  ? `सुरक्षा कारणों से लाइसेंस की (Key) सीधे स्क्रीन पर नहीं दिखाई जाएगी। इसे आपके रजिस्टर्ड ईमेल आईडी (${retrievedKey.email_masked}) पर भेज दिया गया है।`
                  : `For security reasons, the license key is not displayed on the screen. It has been successfully sent to your registered email address (${retrievedKey.email_masked}).`}
              </p>
              <div style={{ background: 'rgba(251,191,36,0.05)', borderLeft: '3px solid #fbbf24', padding: '10px 12px', borderRadius: '4px', fontSize: '11px', color: '#fbbf24', lineHeight: 1.4 }}>
                ℹ️ {lang === 'hi'
                  ? 'निर्देश: अपना ईमेल इनबॉक्स (या स्पैम फोल्डर) चेक करें। वहां से की (Key) को कॉपी करके सॉफ्टवेयर के "Activate Key" सेक्शन में पेस्ट करें।'
                  : 'Instructions: Check your email inbox (or spam folder). Copy the key from the email and paste it into the software\'s "Activate Key" section.'}
              </div>
            </div>
          )}
        </section>

        {/* ── LICENSE PC RESET PORTAL ── */}
        <section className="glass-card animate-fadeUp animate-delay-300" style={{ padding: '36px 30px', maxWidth: '640px', margin: '24px auto 0', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '2.2rem' }}>🔄</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: '#fff', marginTop: '10px', marginBottom: '6px' }}>
              {lang === 'hi' ? 'पीसी रीसेट / ट्रांसफर रिक्वेस्ट' : 'PC Reset / License Transfer'}
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              {lang === 'hi'
                ? 'यदि आपने कंप्यूटर बदला है, तो लाइसेंस की को नए कंप्यूटर में चलाने के लिए यहाँ रीसेट रिक्वेस्ट भेजें।'
                : 'If you have changed your computer, request a hardware lock reset to run your key on the new PC.'}
            </p>
          </div>

          <form onSubmit={handleRequestReset} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              className="input-field"
              placeholder={lang === 'hi' ? 'अपनी लाइसेंस की दर्ज करें (उदा. CSC-AUTO-XXXX-...)' : 'Enter License Key (e.g. CSC-AUTO-XXXX-...)'}
              value={resetKey}
              onChange={e => setResetKey(e.target.value.toUpperCase())}
              style={{ width: '100%', textTransform: 'uppercase' }}
              disabled={resetting}
              required
            />
            <input
              type="email"
              className="input-field"
              placeholder={lang === 'hi' ? 'पंजीकृत ईमेल आईडी दर्ज करें' : 'Enter Registered Email Address'}
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              style={{ width: '100%' }}
              disabled={resetting}
              required
            />
            <textarea
              className="input-field"
              placeholder={lang === 'hi' ? 'रीसेट करने का कारण (उदा. नया लैपटॉप खरीदा है)' : 'Reason for Transfer (e.g. Bought a new laptop)'}
              value={resetReason}
              onChange={e => setResetReason(e.target.value)}
              style={{ width: '100%', minHeight: '80px', resize: 'vertical', padding: '10px 14px' }}
              disabled={resetting}
              required
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '12px 24px', fontWeight: 700, width: '100%' }}
              disabled={resetting || !resetKey.trim() || !resetEmail.trim() || !resetReason.trim()}
            >
              {resetting ? <div className="spinner" /> : (lang === 'hi' ? 'रीसेट रिक्वेस्ट सबमिट करें' : 'Submit Reset Request')}
            </button>
          </form>

          {/* Reset Message */}
          {resetError && (
            <div style={{ marginTop: '12px', padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>⚠️</span>
              <span>{resetError}</span>
            </div>
          )}
          {resetSuccess && (
            <div style={{ marginTop: '12px', padding: '12px 16px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '8px', color: '#34d399', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>✅</span>
              <span>{resetSuccess}</span>
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
