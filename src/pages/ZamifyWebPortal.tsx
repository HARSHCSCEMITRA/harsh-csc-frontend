import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileNakshaLink from '../components/mobile/MobileNakshaLink';
import MobileHissaCalc from '../components/mobile/MobileHissaCalc';
import MobileReceiptGen from '../components/mobile/MobileReceiptGen';
import MobileQrScanner from '../components/mobile/MobileQrScanner';
import { useLanguageStore } from '../store/languageStore';

export default function ZamifyWebPortal() {
  const navigate = useNavigate();
  const { lang } = useLanguageStore();
  const [activeTab, setActiveTab] = useState<'naksha' | 'calc' | 'receipt' | 'qr'>('qr');

  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [userMeta, setUserMeta] = useState<any>(null);

  // Auto check session
  useEffect(() => {
    const saved = localStorage.getItem('zamify_mobile_auth');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.is_active) {
          setIsVerified(true);
          setUserMeta(parsed);
        }
      } catch (e) {
        localStorage.removeItem('zamify_mobile_auth');
      }
    }
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKeyInput.trim() && !phoneInput.trim()) return;

    setVerifying(true);
    setVerifyError('');

    try {
      const res = await fetch('/api/software', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          machine_id: 'MOBILE_WEB_' + (phoneInput || licenseKeyInput).slice(-6),
          license_key: licenseKeyInput.trim()
        })
      });
      const data = await res.json();

      if (res.ok && (data.status === 'active' || data.status === 'trial_active')) {
        setIsVerified(true);
        const meta = {
          is_active: true,
          license_key: licenseKeyInput,
          phone: phoneInput,
          expires_at: data.expires_at || data.trial_ends_at,
          type: data.type
        };
        setUserMeta(meta);
        localStorage.setItem('zamify_mobile_auth', JSON.stringify(meta));
      } else {
        setVerifyError(data.message || 'सत्यापन विफल: अमान्य लाइसेंस की या मोबाइल नंबर।');
      }
    } catch (err) {
      setVerifyError('सर्वर से कनेक्ट करने में विफल। कृपया पुनः प्रयास करें।');
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('zamify_mobile_auth');
    setIsVerified(false);
    setUserMeta(null);
  };

  return (
    <div className="page-wrapper fade-in" style={{ paddingBottom: '80px', background: '#0a0f1e', minHeight: '100vh' }}>
      <div className="container" style={{ paddingTop: '20px', maxWidth: '600px' }}>
        
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>📱</span>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0 }}>Zamify Mobile Portal</h2>
              <span style={{ fontSize: '10px', color: '#60a5fa', background: 'rgba(96,165,250,0.1)', padding: '1px 6px', borderRadius: '4px' }}>v1.1.19 Web Edition</span>
            </div>
          </div>

          {isVerified && (
            <button onClick={handleLogout} className="btn-ghost" style={{ fontSize: '11px', padding: '4px 10px', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
              लॉगआउट 🚪
            </button>
          )}
        </div>

        {/* Auth Check Screen */}
        {!isVerified ? (
          <div className="glass-card animate-fadeUp" style={{ padding: '28px 20px', borderRadius: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '2.5rem' }}>🔐</span>
            <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 800, marginTop: '10px', marginBottom: '6px' }}>
              लाइसेंस उपयोगकर्ता लॉगिन
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '20px', lineHeight: 1.5 }}>
              Zamify मोबाइल वेब पोर्टल का उपयोग करने के लिए अपनी लाइसेंस की (License Key) दर्ज करें।
            </p>

            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="अपनी लाइसेंस की (उदा. CSC-AUTO-XXXX-...)"
                value={licenseKeyInput}
                onChange={e => setLicenseKeyInput(e.target.value.toUpperCase())}
                style={{ width: '100%', textTransform: 'uppercase', textAlign: 'center', fontSize: '13px', letterSpacing: '1px' }}
                required
              />

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', fontWeight: 700 }} disabled={verifying}>
                {verifying ? <div className="spinner" /> : '🔓 लॉगिन व वेरीफाई करें'}
              </button>
            </form>

            {verifyError && (
              <div style={{ marginTop: '14px', padding: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', fontSize: '12px' }}>
                ⚠️ {verifyError}
              </div>
            )}
          </div>
        ) : (
          /* Main Mobile Portal Tools */
          <div>
            {/* User Active Status Card */}
            <div style={{ padding: '12px 16px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 700 }}>🟢 लाइसेंस एक्टिव (Zamify User)</span>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                वैधता: {userMeta?.expires_at ? new Date(userMeta.expires_at).toLocaleDateString('hi-IN') : 'सक्रिय'}
              </span>
            </div>

            {/* Navigation Tabs Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '20px' }}>
              <button
                onClick={() => setActiveTab('qr')}
                style={{
                  padding: '8px 4px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'qr' ? 'var(--blue-dim, rgba(37,99,235,0.4))' : 'rgba(255,255,255,0.04)',
                  color: activeTab === 'qr' ? '#fff' : '#94a3b8',
                  fontWeight: activeTab === 'qr' ? 700 : 500,
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                📷 QR स्कैन
              </button>

              <button
                onClick={() => setActiveTab('naksha')}
                style={{
                  padding: '8px 4px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'naksha' ? 'var(--blue-dim, rgba(37,99,235,0.4))' : 'rgba(255,255,255,0.04)',
                  color: activeTab === 'naksha' ? '#fff' : '#94a3b8',
                  fontWeight: activeTab === 'naksha' ? 700 : 500,
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                🗺️ नक्शा लिंक
              </button>

              <button
                onClick={() => setActiveTab('calc')}
                style={{
                  padding: '8px 4px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'calc' ? 'var(--blue-dim, rgba(37,99,235,0.4))' : 'rgba(255,255,255,0.04)',
                  color: activeTab === 'calc' ? '#fff' : '#94a3b8',
                  fontWeight: activeTab === 'calc' ? 700 : 500,
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                📊 हिस्सा/बीघा
              </button>

              <button
                onClick={() => setActiveTab('receipt')}
                style={{
                  padding: '8px 4px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'receipt' ? 'var(--blue-dim, rgba(37,99,235,0.4))' : 'rgba(255,255,255,0.04)',
                  color: activeTab === 'receipt' ? '#fff' : '#94a3b8',
                  fontWeight: activeTab === 'receipt' ? 700 : 500,
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                🧾 ग्राहक बिल
              </button>
            </div>

            {/* Active Component Render */}
            <div className="animate-fadeUp">
              {activeTab === 'qr' && <MobileQrScanner />}
              {activeTab === 'naksha' && <MobileNakshaLink />}
              {activeTab === 'calc' && <MobileHissaCalc />}
              {activeTab === 'receipt' && <MobileReceiptGen />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

