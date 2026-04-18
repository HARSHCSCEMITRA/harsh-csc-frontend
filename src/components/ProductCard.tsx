import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../types';
import type { Language } from '../types';
import { useCartStore } from '../store/cartStore';
import { createT } from '../utils/i18n';
import { QuantityStepper } from './QuantityStepper';

interface ProductCardProps {
  product: Product;
  lang: Language;
  animDelay?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, lang, animDelay = 0 }) => {
  const navigate = useNavigate();
  const { addItem, removeItem, updateQuantity, items, openCart } = useCartStore();
  const t = createT(lang);

  const cartItem = items.find(i => i.product.id === product.id);
  const qty = cartItem?.quantity ?? 0;

  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1000);
    openCart();
  };

  const badgeClass: Record<string, string> = {
    'Popular': 'badge-amber',
    'Official': 'badge-blue',
    'Fast': 'badge-green',
    'Free': 'badge-green',
    'New': 'badge-blue',
    'Govt': 'badge-blue',
  };

  return (
    <article
      className="glass-card animate-fadeUp"
      style={{
        animationDelay: `${animDelay}ms`,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      {/* Badge */}
      {product.badge && (
        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 2 }}>
          <span className={`badge ${badgeClass[product.badge] ?? 'badge-blue'}`}>
            {product.badge}
          </span>
        </div>
      )}

      {/* Emoji Placeholder */}
      <div className="emoji-box">
        <span style={{ fontSize: '2.5rem', position: 'relative', zIndex: 1 }}>{product.emoji}</span>
      </div>

      {/* Content */}
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        {/* Category */}
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {product.category}
        </p>

        {/* Name */}
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35 }}>
          {lang === 'hi' ? product.nameHi : product.name}
        </h3>

        {/* Description */}
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, flex: 1 }}>
          {lang === 'hi' ? product.descriptionHi : product.description}
        </p>

        {/* Price & Add */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
          <div>
            <span className="price-tag" style={{ fontSize: '16px', color: product.price === 0 ? 'var(--green)' : 'var(--text-primary)' }}>
              {product.price === 0 ? t('card.free') : `₹${product.price}`}
            </span>
            {product.originalPrice && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: '6px' }}>
                ₹{product.originalPrice}
              </span>
            )}
          </div>

          {qty > 0 ? (
            <div onClick={e => e.stopPropagation()}>
              <QuantityStepper
                value={qty}
                size="sm"
                onDecrement={() => qty === 1 ? removeItem(product.id) : updateQuantity(product.id, qty - 1)}
                onIncrement={() => updateQuantity(product.id, qty + 1)}
              />
            </div>
          ) : (
            <button
              className="btn-primary"
              style={{
                padding: '7px 12px',
                fontSize: '12px',
                borderRadius: '10px',
                background: justAdded ? 'var(--green)' : 'var(--blue)',
                boxShadow: justAdded ? '0 2px 12px rgba(52,211,153,0.4)' : 'var(--shadow-btn)',
                transition: 'all 0.3s ease',
              }}
              onClick={handleAdd}
              aria-label={`Add ${product.name} to cart`}
            >
              {justAdded ? '✓' : '+'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
