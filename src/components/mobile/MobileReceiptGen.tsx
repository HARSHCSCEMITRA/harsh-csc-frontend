import React, { useState } from 'react';

export default function MobileReceiptGen() {
  const [clientName, setClientName] = useState('');
  const [serviceName, setServiceName] = useState('नकल व नक्शा प्रिंटिंग');
  const [amount, setAmount] = useState('50');
  const [receiptGenerated, setReceiptGenerated] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;
    setReceiptGenerated(true);
  };

  const handleShareReceipt = () => {
    const text = `🧾 *ग्राहक रसीद / Invoice*\n\n*Harsh CSC eMitra Services*\n—\n👤 *ग्राहक*: ${clientName}\n📋 *सेवा*: ${serviceName}\n💰 *शुल्क भुगतान*: ₹${amount}\n✅ *स्थिति*: सफल (Paid)\n📅 *दिनांक*: ${new Date().toLocaleDateString('hi-IN')}\n\nधन्यवाद! 🙏`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', background: 'rgba(13, 27, 42, 0.7)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <span style={{ fontSize: '1.8rem' }}>🧾</span>
        <div>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: 0 }}>ग्राहक रसीद जेनरेटर (Client Receipt)</h3>
          <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>ई-मित्र दुकानदारों के लिए 1-क्लिक व्हाट्सएप बिल/रसीद रसीद</p>
        </div>
      </div>

      <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>ग्राहक का नाम (Client Name)</label>
          <input
            type="text"
            className="input-field"
            placeholder="उदा. मदनलाल शर्मा"
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            style={{ width: '100%', fontSize: '13px' }}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>सेवा (Service)</label>
            <select
              className="input-field"
              value={serviceName}
              onChange={e => setServiceName(e.target.value)}
              style={{ width: '100%', fontSize: '12px' }}
            >
              <option value="जमाबंदी नकल प्रिंटिंग">जमाबंदी नकल</option>
              <option value="नक्शा ट्रेस प्रिंटिंग">नक्शा ट्रेस</option>
              <option value="नकल व नक्शा प्रिंटिंग">नकल व नक्शा</option>
              <option value="बंटवारा पत्रक परामर्श">बंटवारा पत्रक</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>शुल्क राशि (₹ Amount)</label>
            <input
              type="number"
              className="input-field"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{ width: '100%', fontSize: '13px' }}
            />
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ padding: '12px', fontWeight: 700, borderRadius: '10px' }}>
          🧾 रसीद तैयार करें
        </button>
      </form>

      {receiptGenerated && (
        <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '12px' }}>
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 800 }}>✅ रसीद सफलतापूर्वक तैयार हुई!</span>
          </div>

          <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.6, marginBottom: '14px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px' }}>
            <div><strong>दुकान:</strong> Harsh CSC eMitra</div>
            <div><strong>ग्राहक:</strong> {clientName}</div>
            <div><strong>सेवा:</strong> {serviceName}</div>
            <div><strong>शुल्क:</strong> ₹{amount} (Paid)</div>
          </div>

          <button
            onClick={handleShareReceipt}
            style={{ width: '100%', padding: '10px', background: '#25D366', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            💬 व्हाट्सएप पर रसीद भेजें
          </button>
        </div>
      )}
    </div>
  );
}
