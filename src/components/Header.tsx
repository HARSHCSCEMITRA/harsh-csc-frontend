// ─────────────────────────────────────────────────────────────
//  Header.tsx  –  Sticky navbar with branding + cart icon
//  KEY FIXES:
//    • Column layout for Name + Tagline (professional look)
//    • ShoppingCart icon with live badge from cart store
//    • Cart state controlled via store (no prop-drilling)
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguageStore } from '../store/languageStore';
import { useCartStore }     from '../store/cartStore';   // adjust path if needed
import { createT }          from '../utils/i18n';

// ── Inline SVG icons (zero extra dependencies) ────────────────
const CartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9"  cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

export const Header: React.FC = () => {
  const { lang, setLang }          = useLanguageStore();
  const { items, openCart }        = useCartStore();       // openCart toggles CartDrawer
  const totalQty = items.reduce((sum: number, i: any) => sum + (i.quantity ?? 1), 0);
  const t = createT(lang);

  return (
    <nav style={{
      background:    'var(--surface, #0f172a)',
      borderBottom:  '1px solid rgba(255,255,255,0.08)',
      padding:       '10px 0',
      position:      'sticky',
      top:           0,
      zIndex:        1000,
      boxShadow:     '0 4px 24px rgba(0,0,0,0.45)',
      backdropFilter:'blur(10px)',
    }}>
      <div className="container" style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        gap:            '12px',
      }}>

        {/* ── LEFT: Logo + Brand column ───────────────────────── */}
        <Link to="/" style={{
          display:        'flex',
          alignItems:     'center',
          gap:            '12px',
          textDecoration: 'none',
          minWidth:       0,
          flexShrink:     1,
        }}>
          {/* Logo – hidden gracefully if /logo.png is missing */}
          <img
            src="/logo.png"
            alt="Harsh CSC e-Mitra Logo"
            style={{
              width:        '46px',
              height:       '46px',
              borderRadius: '10px',
              objectFit:    'cover',
              border:       '1px solid rgba(96,165,250,0.25)',
              flexShrink:   0,
            }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />

          {/* Brand column */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span style={{
              color:         '#ffffff',
              fontSize:      'clamp(14px, 3.5vw, 18px)',
              fontWeight:    800,
              letterSpacing: '0.6px',
              lineHeight:    1.2,
              whiteSpace:    'nowrap',
            }}>
              HARSH CSC EMITRA
            </span>
            <span style={{
              color:         '#60a5fa',
              fontSize:      'clamp(9px, 2vw, 11px)',
              fontWeight:    500,
              letterSpacing: '0.15px',
              opacity:       0.88,
              whiteSpace:    'nowrap',
              overflow:      'hidden',
              textOverflow:  'ellipsis',
            }}>
              Digital Documentation Services and Consultancy
            </span>
          </div>
        </Link>

        {/* ── RIGHT: Nav links + Language + Cart ──────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>

          {/* Software link */}
          <Link to="/software" style={{
            color:          '#cbd5e1',
            fontSize:       '13px',
            textDecoration: 'none',
            fontWeight:     600,
            padding:        '5px 8px',
            borderRadius:   '6px',
            transition:     'color 0.2s',
          }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#60a5fa')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
          >
            {t('nav.software')}
          </Link>

          {/* Mobile Portal link */}
          <Link to="/portal" style={{
            color:          '#60a5fa',
            fontSize:       '13px',
            textDecoration: 'none',
            fontWeight:     700,
            padding:        '5px 8px',
            borderRadius:   '6px',
            background:     'rgba(96,165,250,0.1)',
            border:         '1px solid rgba(96,165,250,0.3)',
            transition:     'all 0.2s',
          }}>
            📱 Mobile Portal
          </Link>

          {/* Track Order link */}
          <Link to="/track" style={{
            color:          '#cbd5e1',
            fontSize:       '13px',
            textDecoration: 'none',
            fontWeight:     600,
            padding:        '5px 8px',
            borderRadius:   '6px',
            transition:     'color 0.2s',
          }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#60a5fa')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
          >
            {t('nav.track')}
          </Link>

          {/* Admin Portal link */}
          <a href="/admin.html" style={{
            color:          '#cbd5e1',
            fontSize:       '13px',
            textDecoration: 'none',
            fontWeight:     600,
            padding:        '5px 8px',
            borderRadius:   '6px',
            transition:     'color 0.2s',
          }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#60a5fa')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
          >
            {t('nav.admin')}
          </a>

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
            style={{
              background:   'rgba(37,99,235,0.12)',
              color:        '#60a5fa',
              border:       '1px solid rgba(37,99,235,0.3)',
              padding:      '5px 11px',
              borderRadius: '6px',
              cursor:       'pointer',
              fontSize:     '12px',
              fontWeight:   700,
              transition:   'all 0.2s',
            }}
          >
            {lang === 'hi' ? 'EN' : 'हिं'}
          </button>

          {/* ── Cart button with badge ─────────────────────────── */}
          <button
            onClick={openCart}
            aria-label="Open cart"
            style={{
              position:     'relative',
              background:   'rgba(37,99,235,0.15)',
              color:        '#60a5fa',
              border:       '1px solid rgba(37,99,235,0.3)',
              width:        '40px',
              height:       '40px',
              borderRadius: '8px',
              cursor:       'pointer',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              transition:   'background 0.2s',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(37,99,235,0.28)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(37,99,235,0.15)')}
          >
            <CartIcon />
            {totalQty > 0 && (
              <span style={{
                position:      'absolute',
                top:           '-6px',
                right:         '-6px',
                background:    'var(--blue, #2563eb)',
                color:         '#fff',
                borderRadius:  '50%',
                width:         '18px',
                height:        '18px',
                fontSize:      '10px',
                fontWeight:    800,
                display:       'flex',
                alignItems:    'center',
                justifyContent:'center',
                lineHeight:    1,
                border:        '2px solid #0f172a',
              }}>
                {totalQty > 9 ? '9+' : totalQty}
              </span>
            )}
          </button>

        </div>
      </div>
    </nav>
  );
};
