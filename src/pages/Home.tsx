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
        setCategories(Object.keys(data.grouped || {}) as Category[]);
      })
      .catch(() => setError(t('common.error')))
      .finally(() => setLoading(false));
  }, [t]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesCat = activeCategory === 'all' || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.description.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, activeCategory, search]);

  return (
    <div className="home-page fade-in">
      {/* ── Branding Header Section ────────────────────────────────────────── */}
      <header style={{
        padding: '40px 0 20px 0',
        background: 'linear-gradient(to bottom, rgba(37,99,235,0.1), transparent)',
        borderBottom: '1px solid var(--border)'
      }}>
        <div className="container" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px',
          flexWrap: 'wrap'
        }}>
          <img 
            src="/logo.png" 
            alt="Harsh CSC Logo" 
            style={{ 
              width: '70px', 
              height: '70px', 
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              objectFit: 'cover'
            }}
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <div>
            <h1 style={{ 
              fontSize: 'clamp(24px, 5vw, 36px)', 
              fontWeight: 900, 
              color: '#fff', 
              margin: 0,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase'
            }}>
              Harsh CSC e-Mitra
            </h1>
            <p style={{ 
              fontSize: '16px', 
              color: '#64748b', 
              margin: '4px 0 0 0',
              fontWeight: 500
            }}>
              Digital Documentation Services and Consultancy
            </p>
          </div>
        </div>
      </header>

      {/* ── Hero & Search ────────────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="container">
          <div className="search-container glass-morphism stagger">
            <input
              type="text"
              className="search-input"
              placeholder={t('catalog.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>
        </div>
      </section>

      {/* ── Catalog Section ─────────────────────────────────────────────────── */}
      <section className="catalog-section">
        <div className="container">
          {/* Categories */}
          <div className="category-scroll-container">
            <div className="category-list">
              <button
                className={`category-item ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => setActive('all')}
              >
                🌈 {t('catalog.all')}
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`category-item ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActive(cat)}
                >
                  {CATEGORY_EMOJIS[cat] || '📁'} {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Status Messages */}
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>{t('common.loading')}</p>
            </div>
          )}

          {error && <div className="error-state">{error}</div>}

          {!loading && !error && filtered.length === 0 && (
            <div className="empty-state card">
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <p style={{ fontWeight: 600, fontSize: '18px', color: '#fff' }}>
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

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      {!loading && (
        <footer style={{
          borderTop: '1px solid var(--border)',
          padding: '40px 0',
          marginTop: '60px',
          background: 'rgba(15,23,41,0.5)',
          textAlign: 'center',
        }}>
          <div className="container">
            <div style={{ marginBottom: '20px' }}>
              <img 
                src="/logo.png" 
                alt="Logo" 
                style={{ width: '40px', height: '40px', opacity: 0.8, marginBottom: '10px' }} 
              />
              <p style={{ 
                fontSize: '14px', 
                fontWeight: 700, 
                color: '#fff', 
                margin: 0,
                letterSpacing: '1px'
              }}>
                🏛️ HARSH CSC EMITRA
              </p>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
                Piplantri, Rajsamand, Rajasthan
              </p>
            </div>
            
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
              {lang === 'hi'
                ? 'सभी सेवाएं सरकारी दिशानिर्देशों के अनुसार प्रदान की जाती हैं। हर्ष सीएससी ई-मित्र राजसमंद का एक विश्वसनीय डिजिटल सेवा केंद्र है।'
                : 'All services are provided as per government guidelines. Harsh CSC e-Mitra is a trusted digital service center in Rajsamand.'}
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
