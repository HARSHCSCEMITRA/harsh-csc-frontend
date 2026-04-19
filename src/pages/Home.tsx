// ─────────────────────────────────────────────────────────────
//  Home.tsx  –  Main landing page
//  KEY FIXES:
//    • No duplicate brand title/banner (Header handles branding)
//    • Retry re-fetches data (no full page reload)
//    • Spinner never gets stuck — finally() always runs
//    • Fallback SVG icons for each product type
//    • Search/filter hidden when products ≤ 4
//    • Professional footer baked in
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import { fetchCatalog } from '../utils/api';
import { ProductCard }  from '../components/ProductCard';
import { CartDrawer }   from '../components/CartDrawer';

// ── Inline fallback icons (used when product has no image_url) ─
const GovDocIcon = () => (
  <svg viewBox="0 0 64 64" width="56" height="56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="12" fill="rgba(37,99,235,0.12)" />
    <path d="M20 14h24a2 2 0 0 1 2 2v32a2 2 0 0 1-2 2H20a2 2 0 0 1-2-2V16a2 2 0 0 1 2-2z"
          fill="none" stroke="#60a5fa" strokeWidth="2"/>
    <path d="M24 22h16M24 28h16M24 34h10" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="44" cy="44" r="8" fill="#1e3a5f" stroke="#60a5fa" strokeWidth="1.5"/>
    <path d="M41 44l2 2 4-4" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FinanceIcon = () => (
  <svg viewBox="0 0 64 64" width="56" height="56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="12" fill="rgba(16,185,129,0.10)" />
    <rect x="14" y="30" width="8"  height="16" rx="2" fill="none" stroke="#34d399" strokeWidth="2"/>
    <rect x="28" y="22" width="8"  height="24" rx="2" fill="none" stroke="#34d399" strokeWidth="2"/>
    <rect x="42" y="14" width="8"  height="32" rx="2" fill="none" stroke="#34d399" strokeWidth="2"/>
    <path d="M12 48h40" stroke="#34d399" strokeWidth="2" strokeLinecap="round"/>
    <path d="M18 28l12-8 12 6 10-12" stroke="#34d399" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Map product name keywords → fallback icon component
function getFallbackIcon(name: string): React.ReactNode {
  const n = name.toLowerCase();
  if (n.includes('gazette') || n.includes('notification') || n.includes('government'))
    return <GovDocIcon />;
  if (n.includes('business') || n.includes('project') || n.includes('report') || n.includes('finance'))
    return <FinanceIcon />;
  return <GovDocIcon />; // generic default
}

// ── Types (inline so file is self-contained) ──────────────────
interface Product {
  id:          string;
  name:        string;
  price:       number;
  image_url?:  string;
  description?: string;
  category?:   string;
}

// ── Component ─────────────────────────────────────────────────
export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  // FIX: useCallback so we can call load() from the Retry button
  const load = useCallback(() => {
    setLoading(true);
    setError('');
    fetchCatalog()
      .then(data => {
        // FIX: safely extract .products array; never crashes on shape mismatch
        const list = Array.isArray((data as any)?.products)
          ? (data as any).products
          : Array.isArray(data)
          ? data
          : [];
        setProducts(list);
      })
      .catch((err: Error) => {
        console.error('[fetchCatalog]', err);
        setError(err.message || 'Server se connect nahi ho paya.');
      })
      .finally(() => setLoading(false)); // FIX: spinner ALWAYS stops
  }, []);

  useEffect(() => { load(); }, [load]);

  // Hide search/filter row when few products – clean look
  const showFilters = products.length > 4;

  return (
    <div className="home-page fade-in" style={{
      minHeight:      '100vh',
      display:        'flex',
      flexDirection:  'column',
      background:     'var(--bg, #0a0f1e)',
    }}>

      {/* CartDrawer is rendered here; visibility controlled by cartStore */}
      <CartDrawer />

      {/* ── Main content ──────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '40px 0' }}>
        <div className="container">

          {/* Section heading */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{
              color:         'var(--blue-light, #60a5fa)',
              fontSize:      'clamp(20px, 4vw, 28px)',
              fontWeight:    700,
              margin:        0,
              letterSpacing: '0.5px',
            }}>
              Our Services
            </h2>
            <p style={{
              color:     'rgba(255,255,255,0.45)',
              fontSize:  '14px',
              marginTop: '8px',
            }}>
              Government & Business document services — fast, reliable, digital delivery
            </p>
          </div>

          {/* Optional search / filter row */}
          {showFilters && (
            <div style={{
              display:        'flex',
              gap:            '10px',
              marginBottom:   '28px',
              justifyContent: 'center',
              flexWrap:       'wrap',
            }}>
              <input
                type="search"
                placeholder="Search services..."
                style={{
                  background:   'rgba(255,255,255,0.06)',
                  border:       '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  padding:      '8px 14px',
                  color:        '#fff',
                  fontSize:     '14px',
                  width:        '220px',
                  outline:      'none',
                }}
              />
            </div>
          )}

          {/* ── Loading ────────────────────────────────────────── */}
          {loading && (
            <div className="loading-state" style={{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              gap:            '16px',
              padding:        '60px 0',
            }}>
              <div className="spinner" style={{
                width:       '44px',
                height:      '44px',
                border:      '4px solid rgba(96,165,250,0.15)',
                borderTop:   '4px solid #60a5fa',
                borderRadius:'50%',
                animation:   'spin 0.9s linear infinite',
              }} />
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>
                Services load ho rahi hain…
              </p>
            </div>
          )}

          {/* ── Error with Retry ───────────────────────────────── */}
          {!loading && error && (
            <div style={{
              background:   'rgba(239,68,68,0.08)',
              border:       '1px solid rgba(239,68,68,0.25)',
              borderRadius: '12px',
              padding:      '28px 24px',
              textAlign:    'center',
              maxWidth:     '480px',
              margin:       '40px auto',
            }}>
              <p style={{ color: '#fca5a5', fontSize: '15px', margin: '0 0 16px' }}>
                ⚠️ {error}
              </p>
              <button
                onClick={load}
                style={{
                  background:   'var(--blue, #2563eb)',
                  color:        '#fff',
                  border:       'none',
                  padding:      '10px 24px',
                  borderRadius: '8px',
                  fontSize:     '14px',
                  fontWeight:   700,
                  cursor:       'pointer',
                  transition:   'opacity 0.2s',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
              >
                🔄 Retry
              </button>
            </div>
          )}

          {/* ── Product grid ───────────────────────────────────── */}
          {!loading && !error && (
            <>
              {products.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '60px 0' }}>
                  Abhi koi service available nahi hai.
                </p>
              ) : (
                <div style={{
                  display:             'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap:                 '24px',
                  maxWidth:            '960px',
                  margin:              '0 auto',
                }}>
                  {products.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      // Pass fallback icon if image_url is missing/empty
                      fallbackIcon={
                        !product.image_url ? getFallbackIcon(product.name) : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer style={{
        background:    'rgba(255,255,255,0.03)',
        borderTop:     '1px solid rgba(255,255,255,0.07)',
        padding:       '18px 0',
        textAlign:     'center',
        marginTop:     'auto',
      }}>
        <p style={{
          color:      'rgba(255,255,255,0.35)',
          fontSize:   '13px',
          margin:     0,
          letterSpacing: '0.2px',
        }}>
          © 2026 <span style={{ color: '#60a5fa', fontWeight: 600 }}>HARSH CSC EMITRA</span>
          {' '}|{' '}Piplantri, Rajsamand, Rajasthan
        </p>
      </footer>

      {/* CSS keyframe for spinner (only needed if not in global CSS) */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
