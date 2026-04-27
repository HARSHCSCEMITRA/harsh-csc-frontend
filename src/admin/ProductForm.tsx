// filepath: src/admin/ProductForm.tsx
import React, { useState } from 'react';
import type { Product, Category } from '../types';

interface ProductFormProps {
  product?: Product | null;
  onSave: (product: Partial<Product>) => void;
  onCancel: () => void;
}

const CATEGORIES: Category[] = [
  'Premium Services',
  'Govt Certificates',
  'Banking & Finance',
  'Education & Exams',
  'Insurance',
];

const EMOJI_OPTIONS = ['📄', '📋', '🏦', '🆔', '📑', '💳', '🎓', '🏥', '🚗', '🏠', '📱', '💰', '📊', '🛡️', '🎯'];

const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    nameHi: product?.nameHi || '',
    price: product?.price || 0,
    originalPrice: product?.originalPrice || 0,
    category: product?.category || 'Premium Services' as Category,
    emoji: product?.emoji || '📄',
    imageUrl: product?.imageUrl || '',
    description: product?.description || '',
    descriptionHi: product?.descriptionHi || '',
    documents: product?.documents?.join(', ') || '',
    documentsHi: product?.documentsHi?.join(', ') || '',
    badge: product?.badge || '',
    turnaround: product?.turnaround || '',
    turnaroundHi: product?.turnaroundHi || '',
    expertAdviceIncluded: product?.expertAdviceIncluded || false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              name === 'price' || name === 'originalPrice' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: Partial<Product> = {
      name: formData.name,
      nameHi: formData.nameHi,
      price: Number(formData.price),
      originalPrice: formData.originalPrice > 0 ? Number(formData.originalPrice) : undefined,
      category: formData.category as Category,
      emoji: formData.emoji,
      imageUrl: formData.imageUrl || undefined,
      description: formData.description,
      descriptionHi: formData.descriptionHi,
      documents: formData.documents.split(',').map(d => d.trim()).filter(Boolean),
      documentsHi: formData.documentsHi.split(',').map(d => d.trim()).filter(Boolean),
      badge: formData.badge || undefined,
      turnaround: formData.turnaround || undefined,
      turnaroundHi: formData.turnaroundHi || undefined,
      expertAdviceIncluded: formData.expertAdviceIncluded,
    };
    onSave(submitData);
  };

  const s = {
    overlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
    modal: { background: '#0f1729', borderRadius: '16px', padding: '28px', maxWidth: '700px', width: '100%', maxHeight: '90vh', overflow: 'auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' },
    title: { fontSize: '20px', fontWeight: 700, color: '#e2e8f0' },
    closeBtn: { background: 'none', border: 'none', color: '#64748b', fontSize: '28px', cursor: 'pointer', lineHeight: 1 },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' },
    formGroup: { marginBottom: '16px' },
    label: { display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
    input: { width: '100%', background: '#050913', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 14px', color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const },
    inputFull: { width: '100%', background: '#050913', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 14px', color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const },
    textarea: { width: '100%', background: '#050913', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 14px', color: '#e2e8f0', fontSize: '14px', outline: 'none', minHeight: '80px', resize: 'vertical' as const, boxSizing: 'border-box' as const },
    select: { width: '100%', background: '#050913', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 14px', color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const },
    emojiGrid: { display: 'flex', flexWrap: 'wrap' as const, gap: '8px' },
    emojiBtn: { width: '40px', height: '40px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#050913', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    emojiBtnActive: { border: '2px solid #2563eb', background: 'rgba(37,99,235,0.2)' },
    sectionTitle: { fontSize: '14px', fontWeight: 700, color: '#60a5fa', marginTop: '20px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
    actions: { display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' },
    btn: { padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.2s' },
    btnPrimary: { background: '#2563eb', color: '#fff' },
    btnSecondary: { background: 'rgba(255,255,255,0.1)', color: '#e2e8f0' },
    helpText: { fontSize: '11px', color: '#64748b', marginTop: '4px' },
  };

  return (
    <div style={s.overlay} onClick={onCancel}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.header}>
          <div style={s.title}>{product ? '✏️ Edit Product' : '+ Add New Product'}</div>
          <button style={s.closeBtn} onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div style={s.sectionTitle}>Basic Information</div>
          
          <div style={s.formGrid}>
            <div style={s.formGroup}>
              <label style={s.label}>Product Name (English) *</label>
              <input
                style={s.input}
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., PAN Card Application"
                required
              />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Product Name (Hindi) *</label>
              <input
                style={s.input}
                name="nameHi"
                value={formData.nameHi}
                onChange={handleChange}
                placeholder="e.g., पैन कार्ड आवेदन"
                required
              />
            </div>
          </div>

          <div style={s.formGrid}>
            <div style={s.formGroup}>
              <label style={s.label}>Category *</label>
              <select
                style={s.select}
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Emoji Icon *</label>
              <div style={s.emojiGrid}>
                {EMOJI_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    style={{ ...s.emojiBtn, ...(formData.emoji === emoji ? s.emojiBtnActive : {}) }}
                    onClick={() => setFormData(prev => ({ ...prev, emoji }))}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div style={s.sectionTitle}>Pricing</div>

          <div style={s.formGrid}>
            <div style={s.formGroup}>
              <label style={s.label}>Selling Price (₹) *</label>
              <input
                style={s.input}
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0"
                min="0"
                required
              />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Original Price (₹) <span style={{ color: '#64748b' }}>(for showing discount)</span></label>
              <input
                style={s.input}
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleChange}
                placeholder="0"
                min="0"
              />
              <div style={s.helpText}>Leave empty if no discount</div>
            </div>
          </div>

          {/* Image */}
          <div style={s.sectionTitle}>Product Image</div>

          <div style={s.formGroup}>
            <label style={s.label}>Image URL (Cloud Storage)</label>
            <input
              style={s.inputFull}
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://res.cloudinary.com/your-account/image/upload/..."
            />
            <div style={s.helpText}>Paste your Cloudinary, AWS S3, or other cloud storage URL here</div>
          </div>

          {/* Descriptions */}
          <div style={s.sectionTitle}>Descriptions</div>

          <div style={s.formGrid}>
            <div style={s.formGroup}>
              <label style={s.label}>Description (English)</label>
              <textarea
                style={s.textarea}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the service..."
              />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Description (Hindi)</label>
              <textarea
                style={s.textarea}
                name="descriptionHi"
                value={formData.descriptionHi}
                onChange={handleChange}
                placeholder="सेवा का वर्णन करें..."
              />
            </div>
          </div>

          {/* Documents */}
          <div style={s.sectionTitle}>Required Documents</div>

          <div style={s.formGrid}>
            <div style={s.formGroup}>
              <label style={s.label}>Documents Required (English)</label>
              <input
                style={s.input}
                name="documents"
                value={formData.documents}
                onChange={handleChange}
                placeholder="Aadhaar Card, Photo, ..."
              />
              <div style={s.helpText}>Comma separated list</div>
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Documents Required (Hindi)</label>
              <input
                style={s.input}
                name="documentsHi"
                value={formData.documentsHi}
                onChange={handleChange}
                placeholder="आधार कार्ड, फोटो, ..."
              />
              <div style={s.helpText}>Comma separated list</div>
            </div>
          </div>

          {/* Additional Info */}
          <div style={s.sectionTitle}>Additional Information</div>

          <div style={s.formGrid}>
            <div style={s.formGroup}>
              <label style={s.label}>Badge Text</label>
              <input
                style={s.input}
                name="badge"
                value={formData.badge}
                onChange={handleChange}
                placeholder="e.g., Popular, New"
              />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Turnaround Time</label>
              <input
                style={s.input}
                name="turnaround"
                value={formData.turnaround}
                onChange={handleChange}
                placeholder="e.g., 2-3 days"
              />
            </div>
          </div>

          <div style={s.formGroup}>
            <label style={s.label}>Turnaround Time (Hindi)</label>
            <input
              style={s.inputFull}
              name="turnaroundHi"
              value={formData.turnaroundHi}
              onChange={handleChange}
              placeholder="e.g., 2-3 दिन"
            />
          </div>

          {/* Expert Advice Option */}
          <div style={{ ...s.sectionTitle, marginTop: '24px' }}>
            👨‍💼 Expert Primary Advice
          </div>
          
          <div style={{ 
            background: 'rgba(37,99,235,0.1)', 
            border: '1px solid rgba(37,99,235,0.3)', 
            borderRadius: '8px', 
            padding: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <input
              type="checkbox"
              id="expertAdviceIncluded"
              name="expertAdviceIncluded"
              checked={formData.expertAdviceIncluded}
              onChange={handleChange}
              style={{ width: '20px', height: '20px', marginTop: '2px', cursor: 'pointer' }}
            />
            <div>
              <label 
                htmlFor="expertAdviceIncluded" 
                style={{ 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  color: '#e2e8f0', 
                  cursor: 'pointer',
                  display: 'block',
                  marginBottom: '4px'
                }}
              >
                Auto-add Expert Primary Advice
              </label>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                When customer adds this product to cart, Expert Primary Advice (Free) will be automatically added to their cart.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div style={s.actions}>
            <button type="button" style={{ ...s.btn, ...s.btnSecondary }} onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" style={{ ...s.btn, ...s.btnPrimary }}>
              {product ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;