// filepath: src/admin/ProductList.tsx
import React, { useState, useEffect } from 'react';
import { useProductStore, generateProductId } from '../store/productStore';
import { MOCK_PRODUCTS } from '../utils/mockData';
import type { Product, Category } from '../types';
import ProductForm from './ProductForm';

const CATEGORIES: Category[] = [
  'Premium Services',
  'Govt Certificates',
  'Banking & Finance',
  'Education & Exams',
  'Insurance',
];

const ProductList: React.FC = () => {
  const { products, setProducts, addProduct, updateProduct, deleteProduct, toggleProductActive } = useProductStore();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Load initial products from mockData if store is empty
  useEffect(() => {
    if (products.length === 0) {
      setProducts(MOCK_PRODUCTS as Product[]);
    }
  }, [products.length, setProducts]);

  const filteredProducts = products.filter(p => {
    const matchSearch = !search || 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.nameHi.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const handleAddProduct = (productData: Partial<Product>) => {
    const newProduct: Product = {
      id: generateProductId(),
      name: productData.name || '',
      nameHi: productData.nameHi || '',
      price: productData.price || 0,
      originalPrice: productData.originalPrice,
      category: productData.category || 'Premium Services',
      emoji: productData.emoji || '📄',
      imageUrl: productData.imageUrl,
      description: productData.description || '',
      descriptionHi: productData.descriptionHi || '',
      documents: productData.documents || [],
      documentsHi: productData.documentsHi || [],
      badge: productData.badge,
      turnaround: productData.turnaround,
      turnaroundHi: productData.turnaroundHi,
      isActive: true,
    };
    addProduct(newProduct);
    setShowForm(false);
  };

  const handleUpdateProduct = (productData: Partial<Product>) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
      setEditingProduct(null);
      setShowForm(false);
    }
  };

  const handleDeleteProduct = (id: string) => {
    deleteProduct(id);
    setShowDeleteConfirm(null);
  };

  const handleToggleActive = (id: string) => {
    toggleProductActive(id);
  };

  const s = {
    card: { background: '#0f1729', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' },
    toolbar: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' as const },
    input: { background: '#0f1729', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: '#e2e8f0', fontSize: '13px', outline: 'none', flex: 1, minWidth: '200px' },
    select: { background: '#0f1729', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: '#e2e8f0', fontSize: '13px', outline: 'none', minWidth: '150px' },
    btn: { padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.2s' },
    btnPrimary: { background: '#2563eb', color: '#fff' },
    btnSuccess: { background: '#10b981', color: '#fff' },
    btnDanger: { background: '#ef4444', color: '#fff' },
    btnSecondary: { background: 'rgba(255,255,255,0.1)', color: '#e2e8f0' },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.06em', textAlign: 'left' as const, borderBottom: '1px solid rgba(255,255,255,0.06)' },
    td: { padding: '14px 16px', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.04)' },
    productCell: { display: 'flex', alignItems: 'center', gap: '12px' },
    emoji: { fontSize: '24px' },
    productName: { fontWeight: 600, fontSize: '14px' },
    productNameHi: { fontSize: '12px', color: '#64748b', marginTop: '2px' },
    price: { fontWeight: 700, fontSize: '14px', color: '#10b981' },
    originalPrice: { fontSize: '12px', color: '#64748b', textDecoration: 'line-through', marginLeft: '8px' },
    badge: { padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 },
    badgeActive: { background: 'rgba(16,185,129,0.15)', color: '#10b981' },
    badgeInactive: { background: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    actions: { display: 'flex', gap: '8px' },
    actionBtn: { padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none' },
    editBtn: { background: 'rgba(37,99,235,0.15)', color: '#60a5fa' },
    deleteBtn: { background: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    toggleBtn: { padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none' },
    empty: { padding: '60px', textAlign: 'center' as const, color: '#64748b' },
    modal: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: '#0f1729', borderRadius: '12px', padding: '24px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    modalTitle: { fontSize: '18px', fontWeight: 700, color: '#e2e8f0' },
    closeBtn: { background: 'none', border: 'none', color: '#64748b', fontSize: '24px', cursor: 'pointer' },
  };

  // Show form modal
  if (showForm) {
    return (
      <ProductForm
        product={editingProduct}
        onSave={editingProduct ? handleUpdateProduct : handleAddProduct}
        onCancel={() => {
          setShowForm(false);
          setEditingProduct(null);
        }}
      />
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={s.toolbar}>
        <input
          style={s.input}
          placeholder="🔍 Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          style={s.select}
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button
          style={{ ...s.btn, ...s.btnPrimary }}
          onClick={() => setShowForm(true)}
        >
          + Add Product
        </button>
      </div>

      {/* Products Table */}
      <div style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
        <table style={s.table}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
              <th style={s.th}>Product</th>
              <th style={s.th}>Category</th>
              <th style={s.th}>Price</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={5} style={s.empty}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📦</div>
                  <div>No products found</div>
                </td>
              </tr>
            ) : (
              filteredProducts.map(product => (
                <tr key={product.id}>
                  <td style={s.td}>
                    <div style={s.productCell}>
                      <span style={s.emoji}>{product.emoji}</span>
                      <div>
                        <div style={s.productName}>{product.name}</div>
                        <div style={s.productNameHi}>{product.nameHi}</div>
                      </div>
                    </div>
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                      {product.category}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={s.price}>₹{product.price}</span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span style={s.originalPrice}>₹{product.originalPrice}</span>
                    )}
                  </td>
                  <td style={s.td}>
                    <button
                      style={{ ...s.toggleBtn, ...(product.isActive !== false ? s.badgeActive : s.badgeInactive) }}
                      onClick={() => handleToggleActive(product.id)}
                    >
                      {product.isActive !== false ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={s.td}>
                    <div style={s.actions}>
                      <button
                        style={{ ...s.actionBtn, ...s.editBtn }}
                        onClick={() => {
                          setEditingProduct(product);
                          setShowForm(true);
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        style={{ ...s.actionBtn, ...s.deleteBtn }}
                        onClick={() => setShowDeleteConfirm(product.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={s.modal} onClick={() => setShowDeleteConfirm(null)}>
          <div style={s.modalContent} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>Confirm Delete</div>
              <button style={s.closeBtn} onClick={() => setShowDeleteConfirm(null)}>×</button>
            </div>
            <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                style={{ ...s.btn, ...s.btnSecondary }}
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                style={{ ...s.btn, ...s.btnDanger }}
                onClick={() => handleDeleteProduct(showDeleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;