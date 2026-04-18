import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useLanguageStore } from '../store/languageStore';
import { createT } from '../utils/i18n';

export const Header: React.FC = () => {
  const { totalItems, toggleCart } = useCartStore();
  const { lang, toggleLang } = useLanguageStore();
  const t = createT(lang);
  const navigate = useNavigate();
  const count = totalItems();

  return (
    <header className="header">
      <div className="container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, var(--blue) 0%, #1d4ed8 100%)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px',
            boxShadow: 'var(--shadow-btn)',
            flexShrink: 0,
          }}>🏛️</div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '14px',
              letterSpacing: '0.04em',
              color: 'var(--text-primary)',
              lineHeight: 1.1,
            }}>
              HARSH <span style={{ color: 'var(--blue-light)' }}>CSC</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.02em', fontWeight: 500 }}>
              eMitra Center
            </div>
          </div>
        </Link>

        {/* Right Side Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

          {/* Track Order button */}
          <button
            onClick={() => navigate('/track')}
            className="btn-ghost"
            style={{ padding: '8px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            title={t('nav.track')}
          >
            <span style={{ fontSize: '14px' }}>📦</span>
            <span style={{ display: 'none' }} className="sm-show">{t('nav.track')}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLang}
            style={{
              background: 'var(--bg-700)',
              border: '1px solid var(--border)',
              borderRadius: '100px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all var(--transition)',
              letterSpacing: '0.02em',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
            title="Switch Language"
          >
            <span>{lang === 'en' ? '🇮🇳' : '🇬🇧'}</span>
            <span>{lang === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>

          {/* Cart Button */}
          <button
            onClick={toggleCart}
            style={{
              position: 'relative',
              width: '40px', height: '40px',
              background: count > 0 ? 'var(--blue)' : 'var(--bg-700)',
              border: '1px solid ' + (count > 0 ? 'var(--blue)' : 'var(--border)'),
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px',
              cursor: 'pointer',
              transition: 'all var(--transition)',
              boxShadow: count > 0 ? 'var(--shadow-btn)' : 'none',
            }}
            aria-label={`${t('nav.cart')} ${count > 0 ? `(${count})` : ''}`}
          >
            🛒
            {count > 0 && (
              <span style={{
                position: 'absolute',
                top: '-6px', right: '-6px',
                background: 'var(--green)',
                color: '#050913',
                borderRadius: '100px',
                minWidth: '18px', height: '18px',
                fontSize: '10px', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px',
                border: '2px solid var(--bg-900)',
                animation: 'scaleIn 0.2s ease',
              }}>
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
