import React, { useState } from 'react';

interface ScannedNakalData {
  id: string;
  khata: string;
  owners: string[];
  khasras: Array<{ khasra: string; area: string; category: string }>;
  totalArea: number;
}

export default function MobileQrScanner() {
  const [scannedNakals, setScannedNakals] = useState<ScannedNakalData[]>([]);
  const [manualKhataInput, setManualKhataInput] = useState('');
  const [manualOwnerInput, setManualOwnerInput] = useState('');
  const [manualKhasraInput, setManualKhasraInput] = useState('');
  const [manualAreaInput, setManualAreaInput] = useState('');
  const [manualCategoryInput, setManualCategoryInput] = useState('बारानी / कृषि');

  const handleAddManualNakal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualKhataInput.trim() || !manualOwnerInput.trim()) return;

    const owners = manualOwnerInput.split(/[\n,]+/).map(o => o.trim()).filter(Boolean);
    const khasras = manualKhasraInput.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
    const areaVal = parseFloat(manualAreaInput) || 0;

    const newNakal: ScannedNakalData = {
      id: 'NK_' + Date.now(),
      khata: manualKhataInput.trim(),
      owners,
      khasras: khasras.map(k => ({ khasra: k, area: (areaVal / (khasras.length || 1)).toFixed(4), category: manualCategoryInput })),
      totalArea: areaVal
    };

    setScannedNakals(prev => [...prev, newNakal]);
    setManualKhataInput('');
    setManualOwnerInput('');
    setManualKhasraInput('');
    setManualAreaInput('');
  };

  const handleRemoveNakal = (id: string) => {
    setScannedNakals(prev => prev.filter(item => item.id !== id));
  };

  const handleClearAll = () => {
    setScannedNakals([]);
  };

  // Compute Aggregated Unique Khatedars and Land Holdings
  const aggregatedOwners: { [ownerName: string]: { khatas: Set<string>; khasras: Set<string>; totalArea: number; categories: Set<string> } } = {};

  scannedNakals.forEach(nakal => {
    nakal.owners.forEach(owner => {
      if (!aggregatedOwners[owner]) {
        aggregatedOwners[owner] = {
          khatas: new Set(),
          khasras: new Set(),
          totalArea: 0,
          categories: new Set()
        };
      }
      aggregatedOwners[owner].khatas.add(nakal.khata);
      nakal.khasras.forEach(k => {
        aggregatedOwners[owner].khasras.add(k.khasra);
        aggregatedOwners[owner].categories.add(k.category);
      });
      // Divide total area equally among co-owners if multiple
      const ownerShareArea = nakal.totalArea / (nakal.owners.length || 1);
      aggregatedOwners[owner].totalArea += ownerShareArea;
    });
  });

  const uniqueOwnerNames = Object.keys(aggregatedOwners);
  const totalCombinedArea = scannedNakals.reduce((acc, curr) => acc + curr.totalArea, 0);

  const handleShareSummaryWhatsApp = () => {
    let reportText = `📜 *समेकित जमाबंदी व कृषि श्रेणी रिपोर्ट*\n\n`;
    reportText += `📑 *कुल स्कैन नकलें*: ${scannedNakals.length}\n`;
    reportText += `👥 *कुल अद्वितीय खातेदार*: ${uniqueOwnerNames.length}\n`;
    reportText += `📐 *कुल समेकित रकबा*: ${totalCombinedArea.toFixed(4)} हे. (${(totalCombinedArea * 3.95).toFixed(2)} बीघा)\n\n`;
    reportText += `--- *खातेदार विवरण* ---\n`;

    uniqueOwnerNames.forEach((owner, i) => {
      const data = aggregatedOwners[owner];
      reportText += `\n${i + 1}. 👤 *${owner}*\n`;
      reportText += `   • खाते: ${Array.from(data.khatas).join(', ')}\n`;
      reportText += `   • खसरे: ${Array.from(data.khasras).join(', ')}\n`;
      reportText += `   • कुल रकबा: ${data.totalArea.toFixed(4)} हे. (${(data.totalArea * 3.95).toFixed(2)} बीघा)\n`;
      reportText += `   • श्रेणी: ${Array.from(data.categories).join(', ')}\n`;
    });

    reportText += `\n— *Harsh CSC eMitra Services*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(reportText)}`, '_blank');
  };

  return (
    <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', background: 'rgba(13, 27, 42, 0.7)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <span style={{ fontSize: '1.8rem' }}>📷</span>
        <div>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: 0 }}>QR व ई-साइन नकल बैच स्कैनर</h3>
          <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>मल्टीपल जमाबंदियों को एक साथ जोड़कर अद्वितीय खातेदार व कुल रकबा निकालें</p>
        </div>
      </div>

      {/* Manual / QR Entry Form */}
      <form onSubmit={handleAddManualNakal} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ fontSize: '12px', color: '#60a5fa', fontWeight: 700 }}>➕ जमाबंदी नकल डेटा जोड़ें (Scan / Input):</span>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ fontSize: '10px', color: '#cbd5e1' }}>खाता संख्या (Khata No.)</label>
            <input
              type="text"
              className="input-field"
              placeholder="उदा. 45"
              value={manualKhataInput}
              onChange={e => setManualKhataInput(e.target.value)}
              style={{ width: '100%', fontSize: '12px' }}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '10px', color: '#cbd5e1' }}>कुल रकबा (Hectares)</label>
            <input
              type="number"
              step="0.0001"
              className="input-field"
              placeholder="उदा. 1.2540"
              value={manualAreaInput}
              onChange={e => setManualAreaInput(e.target.value)}
              style={{ width: '100%', fontSize: '12px' }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '10px', color: '#cbd5e1' }}>खातेदार का नाम (Khatedar Name)</label>
          <input
            type="text"
            className="input-field"
            placeholder="उदा. अभयसिंह पुत्र गुलाबसिंह"
            value={manualOwnerInput}
            onChange={e => setManualOwnerInput(e.target.value)}
            style={{ width: '100%', fontSize: '12px' }}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ fontSize: '10px', color: '#cbd5e1' }}>खसरा संख्या (Khasras)</label>
            <input
              type="text"
              className="input-field"
              placeholder="उदा. 207/2, 208"
              value={manualKhasraInput}
              onChange={e => setManualKhasraInput(e.target.value)}
              style={{ width: '100%', fontSize: '12px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '10px', color: '#cbd5e1' }}>भूमि श्रेणी (Krishi Shreni)</label>
            <select
              className="input-field"
              value={manualCategoryInput}
              onChange={e => setManualCategoryInput(e.target.value)}
              style={{ width: '100%', fontSize: '11px' }}
            >
              <option value="बारानी प्रथम (कृषि)">बारानी प्रथम</option>
              <option value="चाही (सिंचित)">चाही (सिंचित)</option>
              <option value="गैर मुमकिन (आबादी)">गैर मुमकिन</option>
            </select>
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ padding: '10px', fontSize: '13px', fontWeight: 700, borderRadius: '8px', marginTop: '4px' }}>
          ➕ इस नकल को बैच लिस्ट में जोड़ें
        </button>
      </form>

      {/* Scanned Nakals List & Summary */}
      {scannedNakals.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#34d399', fontWeight: 700 }}>
              📑 कुल स्कैन्ड नकलें: {scannedNakals.length}
            </span>
            <button onClick={handleClearAll} className="btn-ghost" style={{ fontSize: '10px', color: '#f87171', padding: '2px 8px' }}>
              🗑️ सूची साफ करें
            </button>
          </div>

          {/* Aggregated Khatedar Summary Table */}
          <div style={{ padding: '16px', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: '#60a5fa', fontWeight: 800, textTransform: 'uppercase' }}>
              📊 समेकित कृषि श्रेणी व खातेदार रिपोर्ट:
            </span>

            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              कुल समेकित रकबा: <strong style={{ color: '#34d399' }}>{totalCombinedArea.toFixed(4)} हे.</strong> (अनुमानित {(totalCombinedArea * 3.95).toFixed(2)} बीघा)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              {uniqueOwnerNames.map((owner, idx) => {
                const data = aggregatedOwners[owner];
                return (
                  <div key={idx} style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#fff', fontWeight: 700 }}>👤 {owner}</span>
                      <span style={{ color: '#fbbf24', fontWeight: 800 }}>{data.totalArea.toFixed(4)} हे.</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#cbd5e1' }}>
                      खाते: <strong>{Array.from(data.khatas).join(', ')}</strong> | खसरे: <strong>{Array.from(data.khasras).join(', ')}</strong>
                    </div>
                    <div style={{ fontSize: '10px', color: '#a78bfa' }}>
                      श्रेणी: {Array.from(data.categories).join(', ')}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleShareSummaryWhatsApp}
              style={{ marginTop: '8px', padding: '10px', background: '#25D366', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              💬 पूरी रिपोर्ट व्हाट्सएप पर शेयर करें
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
