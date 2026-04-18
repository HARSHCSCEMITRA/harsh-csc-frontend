import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Product } from '../types';
import { fetchProduct } from '../utils/api';
import { useCartStore } from '../store/cartStore';
import { useLanguageStore } from '../store/languageStore';
import { createT } from '../utils/i18n';
import { QuantityStepper } from '../components/QuantityStepper';
import { ProductCard } from '../components/ProductCard';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang } = useLanguageStore();
  const t = createT(lang);

  const { addItem, removeItem, updateQuantity, items, openCart } = useCartStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    window.scrollTo(0, 0);
    fetchProduct(id)
      .then(data => { setProduct(data.product); setRelated(data.related); })
      .catch(() => setError(t('common.error')))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</p>
      </div>
    </div>
  );

  if (error || !product) return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '2rem', marginBottom: '12px' }}>⚠️</p>
        <p style={{ color: 'var(--red)' }}>{error || 'Product not found'}</p>
        <button className="btn-ghost" style={{ marginTop: '20px' }} onClick={() => navigate('/')}>
          {t('detail.backToHome')}
        </button>
      </div>
    </div>
  );

  const cartItem = items.find(i => i.product.id === product.id);
  const qty = cartItem?.quantity ?? 0;
  const docs = lang === 'hi' ? product.documentsHi : product.documents;
  const name = lang === 'hi' ? product.nameHi : product.name;
  const description = lang === 'hi' ? product.descriptionHi : product.description;
  const turnaround = lang === 'hi' ? product.turnaroundHi : product.turnaround;

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    openCart();
  };

  return (
    <div className="page-wrapper" style={{ paddingBottom: '80px' }}>
      <div className="container" style={{ paddingTop: '32px' }}>

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost"
          style={{ marginBottom: '24px', padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          ← {t('detail.backToHome')}
        </button>

        {/* ── Main Content ─────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }} className="detail-grid">
          {/* Emoji Hero */}
          <div className="glass-card animate-scaleIn" style={{
            padding: '40px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            textAlign: 'center', gap: '16px',
          }}>
            <div style={{
              width: '100px', height: '100px',
              background: 'linear-gradient(135deg, var(--bg-700), var(--bg-600))',
              borderRadius: '24px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '3.5rem',
              boxShadow: '0 8px 32px rgba(5,9,19,0.5), 0 0 0 1px var(--border)',
            }}>
              {product.emoji}
            </div>

            {product.badge && (
              <span className={`badge ${product.badge === 'Free' || product.badge === 'Fast' ? 'badge-green' : 'badge-blue'}`}>
                {product.badge}
              </span>
            )}

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(18px, 4vw, 26px)',
              fontWeight: 800,
              lineHeight: 1.2,
              maxWidth: '500px',
            }}>
              {name}
            </h1>

            <span style={{
              display: 'inline-block',
              padding: '4px 14px',
              background: 'var(--bg-700)',
              border: '1px solid var(--border)',
              borderRadius: '100px',
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}>
              {product.category}
            </span>

            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, maxWidth: '440px' }}>
              {description}
            </p>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2rem', fontWeight: 800,
                color: product.price === 0 ? 'var(--green)' : 'var(--text-primary)',
              }}>
                {product.price === 0 ? t('card.free') : `₹${product.price}`}
              </span>
              {product.originalPrice && (
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                  ₹{product.originalPrice}
                </span>
              )}
            </div>

            {/* Turnaround */}
            {turnaround && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px',
                background: 'var(--blue-dim)',
                borderRadius: '100px',
                border: '1px solid rgba(37,99,235,0.2)',
              }}>
                <span style={{ fontSize: '14px' }}>⏱️</span>
                <span style={{ fontSize: '13px', color: 'var(--blue-light)', fontWeight: 500 }}>
                  {t('detail.turnaround')}: {turnaround}
                </span>
              </div>
            )}

            {/* Add to Cart / Stepper */}
            <div style={{ marginTop: '4px' }}>
              {qty > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <QuantityStepper
                    value={qty}
                    onDecrement={() => qty === 1 ? removeItem(product.id) : updateQuantity(product.id, qty - 1)}
                    onIncrement={() => updateQuantity(product.id, qty + 1)}
                  />
                  <button
                    className="btn-primary"
                    style={{ padding: '12px 32px', fontWeight: 700 }}
                    onClick={() => { openCart(); }}
                  >
                    {t('cart.checkout')} ({qty}) →
                  </button>
                </div>
              ) : (
                <button
                  className="btn-primary"
                  style={{
                    padding: '14px 40px',
                    fontSize: '15px',
                    fontWeight: 700,
                    background: added ? 'var(--green)' : 'var(--blue)',
                    boxShadow: added ? '0 4px 20px rgba(52,211,153,0.4)' : 'var(--shadow-btn)',
                    transition: 'all 0.3s ease',
                    minWidth: '200px',
                  }}
                  onClick={handleAdd}
                >
                  {added ? '✓ Added to Cart' : `${t('card.addToCart')} →`}
                </button>
              )}
            </div>
          </div>

          {/* ── Documents Required ────────────────────────────────────────── */}
          <div className="glass-card animate-fadeUp" style={{ animationDelay: '100ms', padding: '24px' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '16px', fontWeight: 700,
              marginBottom: '16px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{
                width: '32px', height: '32px',
                background: 'var(--blue-dim)',
                border: '1px solid rgba(37,99,235,0.2)',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px',
              }}>📂</span>
              {t('detail.documents')}
            </h2>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {docs.map((doc, i) => (
                <li
                  key={i}
                  className="animate-fadeUp"
                  style={{
                    animationDelay: `${i * 60}ms`,
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    padding: '12px 14px',
                    background: 'rgba(5,9,19,0.4)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    fontSize: '13px',
                    lineHeight: 1.45,
                  }}
                >
                  <span style={{
                    width: '20px', height: '20px',
                    background: 'var(--blue-dim)',
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    color: 'var(--blue-light)',
                    marginTop: '1px',
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{doc}</span>
                </li>
              ))}
            </ul>

            {/* Tip */}
            <div style={{
              marginTop: '16px',
              padding: '12px 14px',
              background: 'var(--amber-dim)',
              border: '1px solid rgba(251,191,36,0.15)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex', gap: '10px', alignItems: 'flex-start',
            }}>
              <span>💡</span>
              <p style={{ fontSize: '12px', color: 'var(--amber)', lineHeight: 1.5 }}>
                {lang === 'hi'
                  ? 'ऑर्डर देने के बाद, अपने दस्तावेज़ Google Drive या WhatsApp पर भेजें।'
                  : 'After placing your order, upload documents via Google Drive link or send on WhatsApp.'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Related Products ──────────────────────────────────────────────── */}
        {related.length > 0 && (
          <section style={{ marginTop: '48px' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px', fontWeight: 700,
              marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ fontSize: '20px' }}>🔗</span>
              {t('detail.related')}
            </h2>
            <div className="product-grid stagger">
              {related.map((rel, idx) => (
                <ProductCard key={rel.id} product={rel} lang={lang} animDelay={idx * 60} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Responsive grid fix */}
      <style>{`
        @media (min-width: 768px) {
          .detail-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
