import React, { useState } from 'react';

export default function MobileHissaCalc() {
  const [totalRakba, setTotalRakba] = useState('');
  const [hissaNumerator, setHissaNumerator] = useState('1');
  const [hissaDenominator, setHissaDenominator] = useState('1');
  const [unit, setUnit] = useState<'hectare' | 'bigha'>('hectare');

  const rakbaVal = parseFloat(totalRakba) || 0;
  const numVal = parseFloat(hissaNumerator) || 1;
  const denVal = parseFloat(hissaDenominator) || 1;

  const frac = denVal > 0 ? numVal / denVal : 1;
  const hissaRakba = rakbaVal * frac;

  // Conversions (Standard Rajasthan units: 1 Hectare = 3.95 Bigha / 6.25 Bigha standard)
  const bighaStandard = (hissaRakba * 3.95).toFixed(3);
  const biswaStandard = (hissaRakba * 3.95 * 20).toFixed(2);

  return (
    <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', background: 'rgba(13, 27, 42, 0.7)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <span style={{ fontSize: '1.8rem' }}>📊</span>
        <div>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: 0 }}>PRO REPORT — हिस्सा व बीघा कैलकुलेटर</h3>
          <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>जमीन का हिस्सा, बीघा-बिस्वा कंवर्टर और तुरंत कैलकुलेशन</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>कुल रकबा (Total Land Area in Hectare)</label>
          <input
            type="number"
            step="0.0001"
            className="input-field"
            placeholder="उदा. 0.4532"
            value={totalRakba}
            onChange={e => setTotalRakba(e.target.value)}
            style={{ width: '100%', fontSize: '14px', fontWeight: 700 }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>हिस्सा (अंश / Numerator)</label>
            <input
              type="number"
              className="input-field"
              value={hissaNumerator}
              onChange={e => setHissaNumerator(e.target.value)}
              style={{ width: '100%', fontSize: '13px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>कुल हिस्सा (हर / Denominator)</label>
            <input
              type="number"
              className="input-field"
              value={hissaDenominator}
              onChange={e => setHissaDenominator(e.target.value)}
              style={{ width: '100%', fontSize: '13px' }}
            />
          </div>
        </div>

        {/* Output Results Card */}
        {rakbaVal > 0 && (
          <div style={{ marginTop: '10px', padding: '16px', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase' }}>कैलकुलेशन परिणाम (Verified Share):</span>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>हिस्सा प्रतिशत:</span>
              <span style={{ fontSize: '14px', color: '#fff', fontWeight: 800 }}>{(frac * 100).toFixed(2)}%</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>हिस्सा रकबा (हेक्टेयर):</span>
              <span style={{ fontSize: '16px', color: '#34d399', fontWeight: 800 }}>{hissaRakba.toFixed(4)} हे.</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>अनुमानित बीघा (Bigha):</span>
              <span style={{ fontSize: '15px', color: '#fbbf24', fontWeight: 800 }}>{bighaStandard} बीघा ({biswaStandard} बिस्वा)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
