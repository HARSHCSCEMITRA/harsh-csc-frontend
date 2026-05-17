// ─────────────────────────────────────────────────────────────
//  Home.tsx  –  Main landing page
//  CHANGES:
//    • Hero section mein news ticker add kiya
//    • "Sabhi News Dekho" button → cyber-cafe-panel.html
//    • Services section same rahega neeche
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchCatalog } from '../utils/api';
import { ProductCard }  from '../components/ProductCard';
import { CartDrawer }   from '../components/CartDrawer';

// ── Supabase config ───────────────────────────────────────────
const SB_URL  = import.meta.env.VITE_SUPABASE_URL  || (window as any).SUPABASE_URL  || '';
const SB_ANON = import.meta.env.VITE_SUPABASE_ANON || (window as any).SUPABASE_ANON || '';

// ── Fallback icons ────────────────────────────────────────────
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
    <rect x="14" y="30" width="8" height="16" rx="2" fill="none" stroke="#34d399" strokeWidth="2"/>
    <rect x="28" y="22" width="8" height="24" rx="2" fill="none" stroke="#34d399" strokeWidth="2"/>
    <rect x="42" y="14" width="8" height="32" rx="2" fill="none" stroke="#34d399" strokeWidth="2"/>
    <path d="M12 48h40" stroke="#34d399" strokeWidth="2" strokeLinecap="round"/>
    <path d="M18 28l12-8 12 6 10-12" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
function getFallbackIcon(name: string): React.ReactNode {
  const n = name.toLowerCase();
  if (n.includes('gazette') || n.includes('notification') || n.includes('government')) return <GovDocIcon />;
  if (n.includes('business') || n.includes('project') || n.includes('report') || n.includes('finance')) return <FinanceIcon />;
  return <GovDocIcon />;
}

// ── Types ─────────────────────────────────────────────────────
interface Product {
  id: string; name: string; price: number;
  image_url?: string; description?: string; category?: string;
}
interface NewsItem {
  id: string; title: string; category: string;
  original_url?: string; source_name?: string;
  published_at: string; is_important?: boolean;
  tags?: string[];
}

// ── Category color map ────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  result:    '#10b981',
  admit_card:'#f59e0b',
  exam:      '#3b82f6',
  admission: '#8b5cf6',
  yojana:    '#ec4899',
  news:      '#6b7280',
};

// ── News Ticker Component ─────────────────────────────────────
function NewsTicker({ items }: { items: NewsItem[] }) {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (!items.length) return;
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % items.length);
        setFade(true);
      }, 300);
    }, 4000);
    return () => clearInterval(t);
  }, [items.length]);

  if (!items.length) return null;
  const item = items[idx];
  const color = CAT_COLORS[item.category] || '#6b7280';

  return (
    <div style={{
      background:   'rgba(255,255,255,0.04)',
      border:       '1px solid rgba(255,255,255,0.08)',
      borderRadius: '10px',
      padding:      '10px 14px',
      display:      'flex',
      alignItems:   'center',
      gap:          '10px',
      minHeight:    '44px',
    }}>
      <span style={{
        background:   color + '22',
        color:        color,
        fontSize:     '10px',
        fontWeight:   700,
        padding:      '2px 8px',
        borderRadius: '20px',
        whiteSpace:   'nowrap',
        flexShrink:   0,
        textTransform:'uppercase',
        letterSpacing:'0.05em',
      }}>
        {item.category?.replace('_',' ')}
      </span>
      <span style={{
        color:      'rgba(255,255,255,0.85)',
        fontSize:   '13px',
        lineHeight: 1.4,
        flex:       1,
        opacity:    fade ? 1 : 0,
        transition: 'opacity 0.3s ease',
        overflow:   'hidden',
        display:    '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as any,
      }}>
        {item.is_important && '🔴 '}{item.title}
      </span>
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', flexShrink: 0 }}>
        {idx + 1}/{items.length}
      </span>
    </div>
  );
}

// ── News Card (small, for grid) ───────────────────────────────
function NewsCard({ item }: { item: NewsItem }) {
  const color = CAT_COLORS[item.category] || '#6b7280';
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (h < 1) return 'Abhi';
    if (h < 24) return `${h}h pehle`;
    if (d < 7) return `${d} din pehle`;
    return new Date(dateStr).toLocaleDateString('hi-IN');
  };

  return (
    <a
      href={item.original_url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display:        'block',
        background:     'rgba(255,255,255,0.03)',
        border:         '1px solid rgba(255,255,255,0.07)',
        borderRadius:   '10px',
        padding:        '12px 14px',
        textDecoration: 'none',
        transition:     'all 0.15s',
        cursor:         'pointer',
        borderLeft:     `3px solid ${color}`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        <span style={{
          background: color + '22', color, fontSize: '9px', fontWeight: 700,
          padding: '1px 7px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          {item.category?.replace('_', ' ')}
        </span>
        {item.is_important && (
          <span style={{ fontSize: '9px', color: '#ef4444', fontWeight: 700 }}>🔴 IMPORTANT</span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
          {timeAgo(item.published_at)}
        </span>
      </div>
      <p style={{
        color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 500,
        margin: '0 0 4px', lineHeight: 1.4,
        overflow: 'hidden', display: '-webkit-box',
        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
      }}>
        {item.title}
      </p>
      {item.source_name && (
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>
          📡 {item.source_name}
        </p>
      )}
    </a>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function Home() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [loadingP, setLoadingP]   = useState(true);
  const [errorP,   setErrorP]     = useState('');
  const [news,     setNews]       = useState<NewsItem[]>([]);
  const [loadingN, setLoadingN]   = useState(true);

  // Load products
  const load = useCallback(() => {
    setLoadingP(true); setErrorP('');
    fetchCatalog()
      .then(data => {
        const list = Array.isArray((data as any)?.products)
          ? (data as any).products
          : Array.isArray(data) ? data : [];
        setProducts(list);
      })
      .catch((err: Error) => setErrorP(err.message || 'Server se connect nahi ho paya.'))
      .finally(() => setLoadingP(false));
  }, []);

  // Load latest news from Supabase
  const loadNews = useCallback(async () => {
    setLoadingN(true);
    try {
      if (!SB_URL || !SB_ANON) { setLoadingN(false); return; }
      const res = await fetch(
        `${SB_URL}/rest/v1/gov_updates?select=id,title,category,original_url,source_name,published_at,is_important,tags&order=published_at.desc&limit=20`,
        { headers: { 'apikey': SB_ANON, 'Authorization': `Bearer ${SB_ANON}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setNews(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('News load failed:', e);
    } finally {
      setLoadingN(false);
    }
  }, []);

  useEffect(() => { load(); loadNews(); }, [load, loadNews]);

  const showFilters = products.length > 4;
  const tickerNews  = news.filter(n => n.is_important).slice(0, 10);
  const gridNews    = news.slice(0, 6);

  return (
    <div className="home-page fade-in" style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: 'var(--bg, #0a0f1e)',
    }}>
      <CartDrawer />

      <main style={{ flex: 1, padding: '28px 0' }}>
        <div className="container">

          {/* ══════════════════════════════════════════════════
              HERO SECTION — 2 column layout
              LEFT:  heading + news ticker + grid
              RIGHT: services card (products)
              ══════════════════════════════════════════════════ */}
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)',
            gap:                 '28px',
            marginBottom:        '40px',
            alignItems:          'start',
          }}
          className="hero-grid"
          >
            {/* ── LEFT: News Section ──────────────────────── */}
            <div>
              {/* Heading */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{
                    background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                    fontSize: '11px', fontWeight: 700, padding: '3px 10px',
                    borderRadius: '20px', animation: 'pulse 2s infinite',
                  }}>
                    🔴 LIVE
                  </span>
                  <h2 style={{
                    color: '#ffffff', fontSize: 'clamp(18px,3.5vw,24px)',
                    fontWeight: 800, margin: 0, letterSpacing: '0.3px',
                  }}>
                    Latest News & Updates
                  </h2>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>
                  Exam, Result, Admit Card, Sarkari Yojana — sabse pehle
                </p>
              </div>

              {/* Ticker — important news */}
              {tickerNews.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <NewsTicker items={tickerNews} />
                </div>
              )}

              {/* News Grid — 2 columns */}
              {loadingN ? (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <div style={{
                    width: '32px', height: '32px', margin: '0 auto 10px',
                    border: '3px solid rgba(96,165,250,0.15)',
                    borderTop: '3px solid #60a5fa',
                    borderRadius: '50%', animation: 'spin 0.9s linear infinite',
                  }} />
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', margin: 0 }}>
                    Updates load ho rahi hain...
                  </p>
                </div>
              ) : news.length === 0 ? (
                <div style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px', padding: '24px', textAlign: 'center',
                }}>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', margin: 0 }}>
                    Abhi koi update nahi hai — jald aayega!
                  </p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))',
                  gap: '10px',
                  marginBottom: '14px',
                }}>
                  {gridNews.map(item => <NewsCard key={item.id} item={item} />)}
                </div>
              )}

              {/* "Sabhi News Dekho" Button */}
              <a
                href="/cyber-cafe-panel.html"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:        'inline-flex',
                  alignItems:     'center',
                  gap:            '8px',
                  background:     'linear-gradient(135deg, #1d4ed8, #2563eb)',
                  color:          '#ffffff',
                  fontSize:       '14px',
                  fontWeight:     700,
                  padding:        '11px 22px',
                  borderRadius:   '10px',
                  textDecoration: 'none',
                  transition:     'all 0.2s',
                  boxShadow:      '0 4px 16px rgba(37,99,235,0.3)',
                  border:         '1px solid rgba(255,255,255,0.12)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(37,99,235,0.45)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(37,99,235,0.3)';
                }}
              >
                📰 Sabhi {news.length > 0 ? `${news.length}+` : ''} News & Updates Dekho
                <span style={{ fontSize: '16px' }}>→</span>
              </a>
            </div>

            {/* ── RIGHT: Services Card ────────────────────── */}
            <div style={{
              background:   'rgba(255,255,255,0.03)',
              border:       '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding:      '20px',
              position:     'sticky',
              top:          '80px',
            }}>
              <p style={{
                color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 14px',
              }}>
                AVAILABLE ASSISTANCE — CLICK TO ADD
              </p>

              {loadingP ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{
                    width: '28px', height: '28px', margin: '0 auto',
                    border: '3px solid rgba(96,165,250,0.15)',
                    borderTop: '3px solid #60a5fa',
                    borderRadius: '50%', animation: 'spin 0.9s linear infinite',
                  }} />
                </div>
              ) : errorP ? (
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <p style={{ color: '#fca5a5', fontSize: '13px', margin: '0 0 10px' }}>⚠️ {errorP}</p>
                  <button onClick={load} style={{
                    background: '#2563eb', color: '#fff', border: 'none',
                    padding: '7px 16px', borderRadius: '7px', fontSize: '13px',
                    fontWeight: 700, cursor: 'pointer',
                  }}>🔄 Retry</button>
                </div>
              ) : products.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
                  Koi service available nahi hai.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {products.slice(0, 4).map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      fallbackIcon={!product.image_url ? getFallbackIcon(product.name) : undefined}
                    />
                  ))}
                  {products.length > 4 && (
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'center', margin: '4px 0 0' }}>
                      +{products.length - 4} aur services neeche hain ↓
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              SERVICES SECTION — Full grid neeche
              ══════════════════════════════════════════════════ */}
          <div style={{ marginBottom: '12px' }}>
            <h2 style={{
              color: '#60a5fa', fontSize: 'clamp(18px,3.5vw,24px)',
              fontWeight: 700, margin: '0 0 6px', letterSpacing: '0.4px',
            }}>
              Our Services
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>
              Government & Business document services — fast, reliable, digital delivery
            </p>
          </div>

          {showFilters && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <input type="search" placeholder="Search services..."
                style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px', padding: '8px 14px', color: '#fff',
                  fontSize: '14px', width: '220px', outline: 'none',
                }}
              />
            </div>
          )}

          {!loadingP && !errorP && products.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '20px', maxWidth: '960px',
            }}>
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  fallbackIcon={!product.image_url ? getFallbackIcon(product.name) : undefined}
                />
              ))}
            </div>
          )}

        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer style={{
        background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.07)',
        padding: '18px 0', textAlign: 'center', marginTop: 'auto',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', margin: 0 }}>
          © 2026 <span style={{ color: '#60a5fa', fontWeight: 600 }}>HARSH CSC EMITRA</span>
          {' '}|{' '}Piplantri, Rajsamand, Rajasthan
        </p>
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        .fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; } }
        @media (max-width: 700px) {
          .hero-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
