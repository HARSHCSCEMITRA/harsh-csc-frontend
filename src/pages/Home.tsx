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
    let isMounted = true;
    setLoading(true);
    
    fetchCatalog()
      .then(data => {
        if (!isMounted) return;
        // बैकएंड डेटा स्ट्रक्चर को संभालना
        const allProducts = data.products || [];
        setProducts(allProducts);
        
        const cats = Object.keys(data.grouped || {}) as Category[];
        setCategories(cats);
        setError('');
      })
      .catch((err) => {
        console.error("Catalog Fetch Error:", err);
        if (isMounted) setError(t('common.error'));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [t]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesCat = activeCategory === 'all' || p.category === activeCategory;
      const matchesSearch = 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, activeCategory, search]);

  return (
    <div className="home-page fade-in">
      {/* ── Branding Section (Clean & No Overlap) ── */}
      <section style={{ padding: '20px 0', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: '14px', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>
            {lang === 'hi' ? 'हमारी डिजिटल सेवाएं' : 'Our Digital Services'}
          </h2>
        </div>
      </section>

      {/* ── Search Section ── */}
      <section className="hero-section" style={{ paddingTop: '0' }}>
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

      {/* ── Catalog Section ── */}
      <section className="catalog-section">
        <div className="container">
          {/* Categories Navigation */}
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
            <div className="loading-state" style={{ padding: '60px 0' }}>
              <div className="spinner"></div>
              <p style={{ marginTop: '20px', color: '#64748b' }}>{t('common.loading')}</p>
            </div>
          )}

          {error && (
            <div className="error-state card" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: '#ef4444' }}>⚠️ {error}</p>
              <button 
                onClick={() => window.location.reload()}
                style={{ marginTop: '15px', padding: '8px 20px', background: '#2563eb', color: '#fff', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Product Grid */}
          {!loading && !error && (
            filtered.length === 0 ? (
              <div className="empty-state card">
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <p style={{ fontWeight: 600, color: '#fff' }}>{t('catalog.noResults')}</p>
              </div>
            ) : (
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
            )
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '40px 0',
        marginTop: '60px',
        background: 'rgba(15,23,41,0.5)',
        textAlign: 'center',
      }}>
        <div className="container">
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0 }}>
            🏛️ HARSH CSC EMITRA
          </p>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
            Piplantri, Rajsamand, Rajasthan
          </p>
        </div>
      </footer>
    </div>
  );
}
