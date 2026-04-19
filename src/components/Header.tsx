import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguageStore } from '../store/languageStore';
import { createT } from '../utils/i18n';

export const Header = () => {
  const { lang, setLang } = useLanguageStore();
  const t = createT(lang);

  return (
    <nav style={{
      background: '#0f172a',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      padding: '10px 0',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '15px'
      }}>
        
        {/* ── Left Side: Logo + Brand Name + Tagline ── */}
        <Link to="/" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          textDecoration: 'none',
          minWidth: 0 // Prevents overflow
        }}>
          <img 
            src="/logo.png" 
            alt="Harsh CSC" 
            style={{ 
              width: '45px', 
              height: '45px', 
              borderRadius: '8px', 
              objectFit: 'cover',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span style={{ 
              color: '#fff', 
              fontSize: '18px', 
              fontWeight: 800, 
              letterSpacing: '0.5px',
              lineHeight: '1.2',
              whiteSpace: 'nowrap'
            }}>
              HARSH CSC EMITRA
            </span>
            <span style={{ 
              color: '#60a5fa', 
              fontSize: '10px', 
              fontWeight: 500,
              letterSpacing: '0.2px',
              opacity: 0.9,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              Digital Documentation Services and Consultancy
            </span>
          </div>
        </Link>

        {/* ── Right Side: Navigation & Language ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexShrink: 0 }}>
          <Link to="/track" style={{ 
            color: '#cbd5e1', 
            fontSize: '13px', 
            textDecoration: 'none', 
            fontWeight: 600,
            padding: '5px 10px'
          }}>
            {lang === 'hi' ? 'ट्रैक ऑर्डर' : 'Track Order'}
          </Link>
          
          <button 
            onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
            style={{
              background: 'rgba(37,99,235,0.15)',
              color: '#60a5fa',
              border: '1px solid rgba(37,99,235,0.3)',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 700,
              transition: 'all 0.2s'
            }}
          >
            {lang === 'hi' ? 'English' : 'हिंदी'}
          </button>
        </div>

      </div>
    </nav>
  );
};
