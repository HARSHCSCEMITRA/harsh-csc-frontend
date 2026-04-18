import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useLanguageStore } from '../store/languageStore';
import { createT } from '../utils/i18n';
import { QuantityStepper } from './QuantityStepper';

export const CartDrawer: React.FC = () => {
  const { items, isOpen, closeCart, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCartStore();
  const { lang } = useLanguageStore();
  const t = createT(lang);
  const navigate = useNavigate();

  const count = totalItems();
  const total = totalPrice();

  if (!isOpen) return null;

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <>
      {/* Overlay */}
      <div className="drawer-overlay" onClick={closeCart} />

      {/* Drawer */}
      <div
        className="animate-slideRight"
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: '100%',
          maxWidth: '420px',
          background: 'var(--bg-800)',
          borderLeft: '1px solid var(--border)',
          z: 200,
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-20px 0 60px rgba(5,9,19,0.8)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700 }}>
              {t('cart.title')}
            </h2>
            {count > 0 && (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {count} {count === 1 ? t('cart.item') : t('cart.items')}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'color var(--transition)',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                {t('cart.clear')}
              </button>
            )}
            <button
              onClick={closeCart}
              style={{
                width: '32px', height: '32px',
                background: 'var(--bg-700)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-secondary)',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all var(--transition)',
              }}
              aria-label={t('common.close')}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛒</div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                {t('cart.empty')}
              </p>
              <p style={{ fontSize: '13px' }}>{t('cart.emptySub')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {items.map((item, idx) => (
                <div
                  key={item.product.id}
                  className="animate-fadeUp"
                  style={{
                    animationDelay: `${idx * 40}ms`,
                    display: 'flex',
                    gap: '12px',
                    padding: '14px',
                    background: 'rgba(5,9,19,0.4)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  {/* Emoji */}
                  <div style={{
                    width: '48px', height: '48px', flexShrink: 0,
                    background: 'var(--bg-700)',
                    borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '22px',
                  }}>
                    {item.product.emoji}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.3, marginBottom: '4px' }}>
                      {lang === 'hi' ? item.product.nameHi : item.product.name}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {item.product.category}
                    </p>
                  </div>

                  {/* Right */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px' }}>
                      {item.product.price === 0 ? t('card.free') : `₹${item.product.price * item.quantity}`}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <QuantityStepper
                        value={item.quantity}
                        size="sm"
                        onDecrement={() =>
                          item.quantity === 1
                            ? removeItem(item.product.id)
                            : updateQuantity(item.product.id, item.quantity - 1)
                        }
                        onIncrement={() => updateQuantity(item.product.id, item.quantity + 1)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{
            padding: '16px 20px 24px',
            borderTop: '1px solid var(--border)',
            background: 'rgba(5,9,19,0.5)',
          }}>
            {/* Delivery note */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--green-dim)',
              border: '1px solid rgba(52,211,153,0.15)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              marginBottom: '16px',
            }}>
              <span>🚀</span>
              <p style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 500 }}>
                Digital Delivery — FREE via WhatsApp / Email
              </p>
            </div>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{t('cart.total')}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px' }}>
                {total === 0 ? (
                  <span style={{ color: 'var(--green)' }}>{t('card.free')}</span>
                ) : (
                  `₹${total}`
                )}
              </span>
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 700, borderRadius: 'var(--radius-md)' }}
              onClick={handleCheckout}
            >
              {t('cart.checkout')} →
            </button>
          </div>
        )}
      </div>
    </>
  );
};
