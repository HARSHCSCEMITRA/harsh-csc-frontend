// filepath: src/admin/FormBuilder.tsx
import React, { useState, useEffect } from 'react';
import { useProductStore, generateFormFieldId } from '../store/productStore';
import { MOCK_PRODUCTS } from '../utils/mockData';
import type { Product, ProductFormField, FormFieldType } from '../types';

const FIELD_TYPES: { value: FormFieldType; label: string; icon: string }[] = [
  { value: 'text', label: 'Text', icon: '📝' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'phone', label: 'Phone', icon: '📱' },
  { value: 'select', label: 'Dropdown', icon: '📋' },
  { value: 'checkbox', label: 'Checkbox', icon: '☑️' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'textarea', label: 'Long Text', icon: '📄' },
];

const FormBuilder: React.FC = () => {
  const { products, formFields, setProducts, addFormField, updateFormField, deleteFormField, getFormFieldsByProduct } = useProductStore();
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [editingField, setEditingField] = useState<ProductFormField | null>(null);

  // Load initial products from mockData if store is empty
  useEffect(() => {
    if (products.length === 0) {
      setProducts(MOCK_PRODUCTS as Product[]);
    }
  }, [products.length, setProducts]);

  const selectedProductFields = selectedProduct ? getFormFieldsByProduct(selectedProduct) : [];

  const handleAddField = (fieldData: Partial<ProductFormField>) => {
    const newField: ProductFormField = {
      id: generateFormFieldId(),
      productId: selectedProduct,
      fieldName: fieldData.fieldName || '',
      fieldNameHi: fieldData.fieldNameHi || '',
      label: fieldData.label || '',
      labelHi: fieldData.labelHi || '',
      type: fieldData.type || 'text',
      required: fieldData.required || false,
      placeholder: fieldData.placeholder,
      placeholderHi: fieldData.placeholderHi,
      options: fieldData.options,
      optionsHi: fieldData.optionsHi,
      helpText: fieldData.helpText,
      helpTextHi: fieldData.helpTextHi,
      order: selectedProductFields.length + 1,
    };
    addFormField(newField);
    setShowFieldForm(false);
  };

  const handleUpdateField = (fieldData: Partial<ProductFormField>) => {
    if (editingField) {
      updateFormField(editingField.id, fieldData);
      setEditingField(null);
      setShowFieldForm(false);
    }
  };

  const handleDeleteField = (id: string) => {
    if (confirm('Are you sure you want to delete this field?')) {
      deleteFormField(id);
    }
  };

  const s = {
    card: { background: '#0f1729', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' },
    row: { display: 'flex', gap: '16px', marginBottom: '20px' },
    col: { flex: 1 },
    label: { display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
    select: { width: '100%', background: '#050913', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 14px', color: '#e2e8f0', fontSize: '14px', outline: 'none' },
    btn: { padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.2s' },
    btnPrimary: { background: '#2563eb', color: '#fff' },
    btnSuccess: { background: '#10b981', color: '#fff' },
    btnDanger: { background: '#ef4444', color: '#fff' },
    btnSecondary: { background: 'rgba(255,255,255,0.1)', color: '#e2e8f0' },
    fieldCard: { background: '#050913', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '16px', marginBottom: '12px' },
    fieldHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    fieldName: { fontWeight: 600, fontSize: '14px', color: '#e2e8f0' },
    fieldType: { padding: '4px 8px', borderRadius: '4px', fontSize: '11px', background: 'rgba(139,92,246,0.15)', color: '#a78bfa' },
    fieldLabel: { fontSize: '12px', color: '#64748b', marginBottom: '4px' },
    fieldLabelHi: { fontSize: '11px', color: '#475569', fontStyle: 'italic' as const },
    required: { color: '#ef4444', fontSize: '11px', marginLeft: '8px' },
    actions: { display: 'flex', gap: '8px', marginTop: '12px' },
    actionBtn: { padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none' },
    editBtn: { background: 'rgba(37,99,235,0.15)', color: '#60a5fa' },
    deleteBtn: { background: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    empty: { padding: '40px', textAlign: 'center' as const, color: '#64748b' },
    infoBox: { background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: '8px', padding: '16px', marginBottom: '20px' },
    infoTitle: { fontSize: '14px', fontWeight: 600, color: '#60a5fa', marginBottom: '8px' },
    infoText: { fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 },
    overlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
    modal: { background: '#0f1729', borderRadius: '16px', padding: '28px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' },
    modalTitle: { fontSize: '20px', fontWeight: 700, color: '#e2e8f0' },
    closeBtn: { background: 'none', border: 'none', color: '#64748b', fontSize: '28px', cursor: 'pointer', lineHeight: 1 },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' },
    formGroup: { marginBottom: '16px' },
    input: { width: '100%', background: '#050913', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 14px', color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const },
    inputFull: { width: '100%', background: '#050913', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 14px', color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const },
    textarea: { width: '100%', background: '#050913', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 14px', color: '#e2e8f0', fontSize: '14px', outline: 'none', minHeight: '60px', resize: 'vertical' as const, boxSizing: 'border-box' as const },
    checkbox: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' },
    checkboxInput: { width: '18px', height: '18px' },
    checkboxLabel: { fontSize: '13px', color: '#e2e8f0' },
    typeGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' },
    typeBtn: { padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#050913', cursor: 'pointer', textAlign: 'center' as const },
    typeBtnActive: { border: '2px solid #2563eb', background: 'rgba(37,99,235,0.2)' },
    typeIcon: { fontSize: '20px', marginBottom: '4px' },
    typeLabel: { fontSize: '11px', color: '#94a3b8' },
    sectionTitle: { fontSize: '14px', fontWeight: 700, color: '#60a5fa', marginTop: '20px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
    helpText: { fontSize: '11px', color: '#64748b', marginTop: '4px' },
    actions: { display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' },
  };

  // Field form modal
  if (showFieldForm) {
    return (
      <FieldFormModal
        field={editingField}
        onSave={editingField ? handleUpdateField : handleAddField}
        onCancel={() => {
          setShowFieldForm(false);
          setEditingField(null);
        }}
      />
    );
  }

  return (
    <div>
      {/* Info Box */}
      <div style={s.infoBox}>
        <div style={s.infoTitle}>📝 Form Builder</div>
        <div style={s.infoText}>
          Create custom form fields for each service to collect specific information from customers during checkout.
          Fields like Aadhaar number, date of birth, income range, etc. can be added per service.
        </div>
      </div>

      {/* Product Selection */}
      <div style={s.card}>
        <div style={s.row}>
          <div style={{ ...s.col, flex: 2 }}>
            <label style={s.label}>Select Service / Product</label>
            <select
              style={s.select}
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
            >
              <option value="">-- Choose a service to add fields --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.emoji} {p.name} ({p.nameHi})
                </option>
              ))}
            </select>
          </div>
          <div style={{ ...s.col, display: 'flex', alignItems: 'flex-end' }}>
            {selectedProduct && (
              <button
                style={{ ...s.btn, ...s.btnPrimary, width: '100%' }}
                onClick={() => setShowFieldForm(true)}
              >
                + Add Field
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Fields List */}
      {selectedProduct ? (
        <div style={{ ...s.card, marginTop: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            📋 Form Fields for: {products.find(p => p.id === selectedProduct)?.name}
          </div>

          {selectedProductFields.length === 0 ? (
            <div style={s.empty}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📝</div>
              <div>No custom fields added yet</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                Click "Add Field" to create form fields for this service
              </div>
            </div>
          ) : (
            <div>
              {selectedProductFields.map(field => (
                <div key={field.id} style={s.fieldCard}>
                  <div style={s.fieldHeader}>
                    <div>
                      <span style={s.fieldName}>{field.label}</span>
                      {field.required && <span style={s.required}>*</span>}
                    </div>
                    <span style={s.fieldType}>{field.type}</span>
                  </div>
                  <div style={s.fieldLabel}>Field Key: <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{field.fieldName}</code></div>
                  <div style={s.fieldLabelHi}>Hindi: {field.labelHi}</div>
                  {field.placeholder && (
                    <div style={{ ...s.fieldLabel, marginTop: '8px' }}>Placeholder: {field.placeholder}</div>
                  )}
                  {field.options && field.options.length > 0 && (
                    <div style={{ ...s.fieldLabel, marginTop: '8px' }}>Options: {field.options.join(', ')}</div>
                  )}
                  <div style={s.actions}>
                    <button
                      style={{ ...s.actionBtn, ...s.editBtn }}
                      onClick={() => {
                        setEditingField(field);
                        setShowFieldForm(true);
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      style={{ ...s.actionBtn, ...s.deleteBtn }}
                      onClick={() => handleDeleteField(field.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ ...s.card, marginTop: '20px', textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>👆</div>
          <div style={{ color: '#64748b' }}>Select a service above to manage its form fields</div>
        </div>
      )}
    </div>
  );
};

// Field Form Modal Component
interface FieldFormModalProps {
  field: ProductFormField | null;
  onSave: (field: Partial<ProductFormField>) => void;
  onCancel: () => void;
}

const FieldFormModal: React.FC<FieldFormModalProps> = ({ field, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    fieldName: field?.fieldName || '',
    fieldNameHi: field?.fieldNameHi || '',
    label: field?.label || '',
    labelHi: field?.labelHi || '',
    type: field?.type || 'text' as FormFieldType,
    required: field?.required || false,
    placeholder: field?.placeholder || '',
    placeholderHi: field?.placeholderHi || '',
    options: field?.options?.join(', ') || '',
    optionsHi: field?.optionsHi?.join(', ') || '',
    helpText: field?.helpText || '',
    helpTextHi: field?.helpTextHi || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: Partial<ProductFormField> = {
      fieldName: formData.fieldName.toLowerCase().replace(/\s+/g, '_'),
      fieldNameHi: formData.fieldNameHi,
      label: formData.label,
      labelHi: formData.labelHi,
      type: formData.type,
      required: formData.required,
      placeholder: formData.placeholder || undefined,
      placeholderHi: formData.placeholderHi || undefined,
      options: formData.options ? formData.options.split(',').map(o => o.trim()).filter(Boolean) : undefined,
      optionsHi: formData.optionsHi ? formData.optionsHi.split(',').map(o => o.trim()).filter(Boolean) : undefined,
      helpText: formData.helpText || undefined,
      helpTextHi: formData.helpTextHi || undefined,
    };
    onSave(submitData);
  };

  const s = {
    overlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
    modal: { background: '#0f1729', borderRadius: '16px', padding: '28px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' },
    title: { fontSize: '20px', fontWeight: 700, color: '#e2e8f0' },
    closeBtn: { background: 'none', border: 'none', color: '#64748b', fontSize: '28px', cursor: 'pointer', lineHeight: 1 },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' },
    formGroup: { marginBottom: '16px' },
    label: { display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
    input: { width: '100%', background: '#050913', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 14px', color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const },
    inputFull: { width: '100%', background: '#050913', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 14px', color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const },
    select: { width: '100%', background: '#050913', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 14px', color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const },
    checkbox: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' },
    checkboxInput: { width: '18px', height: '18px' },
    checkboxLabel: { fontSize: '13px', color: '#e2e8f0' },
    typeGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' },
    typeBtn: { padding: '12px 8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#050913', cursor: 'pointer', textAlign: 'center' as const },
    typeBtnActive: { border: '2px solid #2563eb', background: 'rgba(37,99,235,0.2)' },
    typeIcon: { fontSize: '18px', marginBottom: '4px' },
    typeLabel: { fontSize: '10px', color: '#94a3b8' },
    helpText: { fontSize: '11px', color: '#64748b', marginTop: '4px' },
    actions: { display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' },
    btn: { padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.2s' },
    btnPrimary: { background: '#2563eb', color: '#fff' },
    btnSecondary: { background: 'rgba(255,255,255,0.1)', color: '#e2e8f0' },
  };

  return (
    <div style={s.overlay} onClick={onCancel}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.header}>
          <div style={s.title}>{field ? '✏️ Edit Field' : '+ Add New Field'}</div>
          <button style={s.closeBtn} onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Field Type */}
          <div style={s.formGroup}>
            <label style={s.label}>Field Type *</label>
            <div style={s.typeGrid}>
              {FIELD_TYPES.map(ft => (
                <button
                  key={ft.value}
                  type="button"
                  style={{ ...s.typeBtn, ...(formData.type === ft.value ? s.typeBtnActive : {}) }}
                  onClick={() => setFormData(prev => ({ ...prev, type: ft.value }))}
                >
                  <div style={s.typeIcon}>{ft.icon}</div>
                  <div style={s.typeLabel}>{ft.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={s.formGrid}>
            <div style={s.formGroup}>
              <label style={s.label}>Label (English) *</label>
              <input
                style={s.input}
                name="label"
                value={formData.label}
                onChange={handleChange}
                placeholder="e.g., Aadhaar Number"
                required
              />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Label (Hindi) *</label>
              <input
                style={s.input}
                name="labelHi"
                value={formData.labelHi}
                onChange={handleChange}
                placeholder="e.g., आधार नंबर"
                required
              />
            </div>
          </div>

          <div style={s.formGrid}>
            <div style={s.formGroup}>
              <label style={s.label}>Field Key (Auto-generated)</label>
              <input
                style={{ ...s.input, background: 'rgba(0,0,0,0.3)', color: '#64748b' }}
                name="fieldName"
                value={formData.fieldName.toLowerCase().replace(/\s+/g, '_') || 'field_key'}
                disabled
              />
              <div style={s.helpText}>This is the database field name</div>
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Field Key (Hindi)</label>
              <input
                style={s.input}
                name="fieldNameHi"
                value={formData.fieldNameHi}
                onChange={handleChange}
                placeholder="e.g., आधार_नंबर"
              />
            </div>
          </div>

          <div style={s.formGrid}>
            <div style={s.formGroup}>
              <label style={s.label}>Placeholder (English)</label>
              <input
                style={s.input}
                name="placeholder"
                value={formData.placeholder}
                onChange={handleChange}
                placeholder="e.g., Enter 12-digit Aadhaar"
              />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Placeholder (Hindi)</label>
              <input
                style={s.input}
                name="placeholderHi"
                value={formData.placeholderHi}
                onChange={handleChange}
                placeholder="e.g., 12 अंकों का आधार दर्ज करें"
              />
            </div>
          </div>

          {/* Options for select type */}
          {formData.type === 'select' && (
            <div style={s.formGrid}>
              <div style={s.formGroup}>
                <label style={s.label}>Options (English)</label>
                <input
                  style={s.input}
                  name="options"
                  value={formData.options}
                  onChange={handleChange}
                  placeholder="Option 1, Option 2, Option 3"
                />
                <div style={s.helpText}>Comma separated list</div>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Options (Hindi)</label>
                <input
                  style={s.input}
                  name="optionsHi"
                  value={formData.optionsHi}
                  onChange={handleChange}
                  placeholder="विकल्प 1, विकल्प 2, विकल्प 3"
                />
              </div>
            </div>
          )}

          <div style={s.formGroup}>
            <label style={s.label}>Help Text (English)</label>
            <input
              style={s.inputFull}
              name="helpText"
              value={formData.helpText}
              onChange={handleChange}
              placeholder="Additional instructions for this field..."
            />
          </div>

          <div style={s.formGroup}>
            <label style={s.label}>Help Text (Hindi)</label>
            <input
              style={s.inputFull}
              name="helpTextHi"
              value={formData.helpTextHi}
              onChange={handleChange}
              placeholder="इस फ़ील्ड के लिए अतिरिक्त निर्देश..."
            />
          </div>

          <div style={s.checkbox}>
            <input
              type="checkbox"
              style={s.checkboxInput}
              name="required"
              checked={formData.required}
              onChange={handleChange}
            />
            <label style={s.checkboxLabel}>This field is required</label>
          </div>

          <div style={s.actions}>
            <button type="button" style={{ ...s.btn, ...s.btnSecondary }} onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" style={{ ...s.btn, ...s.btnPrimary }}>
              {field ? 'Update Field' : 'Add Field'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormBuilder;