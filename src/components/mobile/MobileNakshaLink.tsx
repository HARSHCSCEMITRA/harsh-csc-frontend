import React, { useState } from 'react';

export default function MobileNakshaLink() {
  const [district, setDistrict] = useState('');
  const [tehsil, setTehsil] = useState('');
  const [villageCode, setVillageCode] = useState('');
  const [khasraInput, setKhasraInput] = useState('');
  const [generatedLinks, setGeneratedLinks] = useState<Array<{ khasra: string; url: string }>>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!khasraInput.trim()) return;

    const khasras = khasraInput
      .split(/[\n,]+/)
      .map(k => k.trim())
      .filter(Boolean);

    const code = villageCode.trim() || '33099'; // default fallback village code if empty

    const links = khasras.map(k => ({
      khasra: k,
      url: `https://bhunaksha.rajasthan.gov.in/gis/viewer.aspx?villcode=${code}&khasra=${encodeURIComponent(k)}`
    }));

    setGeneratedLinks(links);
  };

  const handleCopy = (url: string, index: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleShareWhatsApp = (khasra: string, url: string) => {
    const text = `🗺️ *नक्शा ट्रेस लिंक — खसरा नं. ${khasra}*\n\nयहाँ क्लिक करके नक्शा देखें:\n${url}\n\n— *Harsh CSC eMitra Services*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', background: 'rgba(13, 27, 42, 0.7)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <span style={{ fontSize: '1.8rem' }}>🗺️</span>
        <div>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: 0 }}>BHUNAKSHA PRO — 1-Tap Link Generator</h3>
          <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>खसरा नंबर से डायरेक्ट नक्शा लिंक जेनरेट करें व व्हाट्सएप पर शेयर करें</p>
        </div>
      </div>

      <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>गांव कोड (Village Code)</label>
            <input
              type="text"
              className="input-field"
              placeholder="उदा. 33099"
              value={villageCode}
              onChange={e => setVillageCode(e.target.value)}
              style={{ width: '100%', fontSize: '13px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>खसरा नंबर (Khasra No.)</label>
            <input
              type="text"
              className="input-field"
              placeholder="उदा. 207/2, 208, 209"
              value={khasraInput}
              onChange={e => setKhasraInput(e.target.value)}
              style={{ width: '100%', fontSize: '13px' }}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ padding: '12px', fontWeight: 700, borderRadius: '10px' }}>
          ⚡ 1-Tap Link Generate करें
        </button>
      </form>

      {generatedLinks.length > 0 && (
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#4dd0e1', fontWeight: 700 }}>
            ✅ {generatedLinks.length} खसरा लिंक सफलतापूर्वक जेनरेट हुए:
          </span>

          {generatedLinks.map((item, idx) => (
            <div key={idx} style={{ padding: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>📍 खसरा नंबर: {item.khasra}</span>
                <span style={{ fontSize: '10px', color: '#94a3b8', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px' }}>Bhunaksha GIS</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                <button
                  onClick={() => window.open(item.url, '_blank')}
                  className="btn-ghost"
                  style={{ padding: '6px', fontSize: '11px', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '6px' }}
                >
                  🔗 खोलें
                </button>
                <button
                  onClick={() => handleCopy(item.url, idx)}
                  className="btn-ghost"
                  style={{ padding: '6px', fontSize: '11px', color: copiedIndex === idx ? '#34d399' : '#e2e8f0', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px' }}
                >
                  {copiedIndex === idx ? '✓ कॉपी हुआ' : '📋 कॉपी'}
                </button>
                <button
                  onClick={() => handleShareWhatsApp(item.khasra, item.url)}
                  style={{ padding: '6px', fontSize: '11px', background: '#25D366', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
                >
                  💬 शेयर
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
