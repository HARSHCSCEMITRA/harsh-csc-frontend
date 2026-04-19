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
                  {CATEGORY_EMOJIS[cat] || '📁'} {cat
