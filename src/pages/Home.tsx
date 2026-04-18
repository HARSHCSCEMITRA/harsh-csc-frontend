import React, { useState, useEffect, useMemo } from 'react';
import type { Product, Category } from '../types';
import { fetchCatalog } from '../utils/api';
import { useLanguageStore } from '../store/languageStore';
import { createT } from '../utils/i18n';
import { ProductCard } from '../components/ProductCard';

const CATEGORY_EMOJIS: Record<string, string> = {
  'Premium Services':   '⭐',
  'Govt Certificates':  '🏛️',
  'Banking & Finance':  '🏦',
  'Education & Exams':  '📚',
  'Insurance':          '🛡️',
};

export default function Home() {
  const { lang } = useLanguageStore();
  const t = createT(lang);

  const [products, setProducts]       = useState<Product[]>([]);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [activeCategory, setActive]   = useState<Category | 'all'>('all');
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  useEffect(() => {
    setLoading(true);
    fetchCatalog()
      .then(data => {
        setProducts(data.products);
        // फिक्स: बैकएंड 'grouped' भेज रहा है, 'categories' नहीं। इसलिए हम 'grouped' से नाम निकाल रहे हैं।
        setCategories(Object.keys(data.grouped || {}) as Category[]);
      })
      .catch(() => setError(t('common.error')))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter(p => {
      const matchCategory = activeCategory === 'all' || p.category === activeCategory;
      const matchSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        (p.nameHi && p.nameHi.includes(q)) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [products, activeCategory, search]);

  return (
    <div className="page-wrapper" style={{ paddingBottom: '80px' }}>
      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(180deg, rgba(37,99,235,0.07) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '28px 0 24px',
      }}>
        <div className="container">
          {/* Pill */}
          <div style={{ marginBottom: '12px' }}>
            <span className="badge badge-blue" style={{ fontSize: '11px' }}>
              🇮🇳 &nbsp;Common Service Centre — Rajasthan
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(22px, 5vw, 36px)',
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: '8px',
          }}>
            {t('store.name')}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', maxWidth: '480px' }}>
            {t('store.tagline')}
          </p>

          {/* Stats strip */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {[
              { icon: '⚡', label: lang === 'hi' ? 'तेज़ प्रक्रिया' : 'Fast Processing' },
              { icon: '🔒', label: lang === 'hi' ? 'सुरक्षित सेवाएं' : 'Govt Certified' },
              { icon: '📲', label: lang === 'hi' ? 'WhatsApp डिलीवरी' : 'WhatsApp Delivery' },
              { icon: '🕐', label: lang === 'hi' ? 'सोम-शनि 9–7' : 'Mon–Sat 9–7 PM' },
            ].map(stat => (
              <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>{stat.icon}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Search + Filter ──────────────────────────────────────────────────── */}
      <section style={{ padding: '20px 0 0', position: 'sticky', top: '64px', zIndex: 30, background: 'var(--bg-900)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ paddingBottom: '16px' }}>
          {/* Search bar */}
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <span style={{
              position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
              fontSize: '16px', pointerEvents: 'none',
            }}>🔍</span>
            <input
              className="input-field"
              type="search"
              placeholder={t('catalog.search')}
              value={search}
              onChange={e => { setSearch(e.target.value); setActive('all'); }}
              style={{ paddingLeft: '44px' }}
              aria-label={t('catalog.search')}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', fontSize: '14px',
                }}
              >✕</button>
            )}
          </div>

          {/* Category pills */}
          <div className="category-pills">
            <button
              className={`pill ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => { setActive('all'); setSearch(''); }}
            >
              {t('catalog.all')}
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                className={`pill ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => { setActive(cat); setSearch(''); }}
              >
                {CATEGORY_EMOJIS[cat] ?? '📋'} {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product Grid ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '24px 0' }}>
        <div className="container">

          {/* Section heading */}
          {!loading && !error && (
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {activeCategory === 'all'
                  ? (lang === 'hi' ? 'सभी सेवाएं' : t('catalog.title'))
                  : activeCategory}
                <span style={{ marginLeft: '8px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 400 }}>
                  ({filtered.length})
                </span>
              </h2>
              {search && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {lang === 'hi' ? `"${search}" के लिए परिणाम` : `Results for "${search}"`}
                </span>
              )}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="product-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  height: '280px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-700)',
                  animation: 'pulse-blue 2s ease infinite',
                  animationDelay: `${i * 100}ms`,
                }} />
              ))}
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              color: 'var(--red)',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⚠️</div>
              <p>{error}</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔎</div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '16px', marginBottom: '8px' }}>
                {t('catalog.noResults')}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{t('catalog.noResultsSub')}</p>
            </div>
          )}

          {/* Grid */}
          {!loading && !error && filtered.length > 0 && (
            <div className="product-grid stagger">
              {filtered.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  lang={lang}
                  animDelay={Math.min(idx * 50, 400)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Footer strip ─────────────────────────────────────────────────────── */}
      {!loading && (
        <footer style={{
          borderTop: '1px solid var(--border)',
          padding: '24px 0',
          marginTop: '20px',
          textAlign: 'center',
        }}>
          <div className="container">
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              🏛️ &nbsp;HARSH CSC EMITRA &nbsp;·&nbsp; eMitra Digital Service Center &nbsp;·&nbsp; Rajasthan
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {lang === 'hi'
                ? 'सभी सेवाएं सरकारी दिशानिर्देशों के अनुसार प्रदान की जाती हैं।'
                : 'All services are provided as per government guidelines.'}
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
