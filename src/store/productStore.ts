// filepath: src/store/productStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, ProductFormField } from '../types';

interface ProductState {
  products: Product[];
  formFields: ProductFormField[];
  isLoading: boolean;
  error: string | null;
  
  // Product actions
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductActive: (id: string) => void;
  
  // Form field actions
  setFormFields: (fields: ProductFormField[]) => void;
  addFormField: (field: ProductFormField) => void;
  updateFormField: (id: string, field: Partial<ProductFormField>) => void;
  deleteFormField: (id: string) => void;
  getFormFieldsByProduct: (productId: string) => ProductFormField[];
  
  // Utility
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getProductById: (id: string) => Product | undefined;
}

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: [],
      formFields: [],
      isLoading: false,
      error: null,

      setProducts: (products) => set({ products }),

      addProduct: (product) =>
        set((state) => ({
          products: [...state.products, product],
        })),

      updateProduct: (id, updatedProduct) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updatedProduct } : p
          ),
        })),

      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),

      toggleProductActive: (id) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, isActive: !p.isActive } : p
          ),
        })),

      setFormFields: (fields) => set({ formFields: fields }),

      addFormField: (field) =>
        set((state) => ({
          formFields: [...state.formFields, field],
        })),

      updateFormField: (id, updatedField) =>
        set((state) => ({
          formFields: state.formFields.map((f) =>
            f.id === id ? { ...f, ...updatedField } : f
          ),
        })),

      deleteFormField: (id) =>
        set((state) => ({
          formFields: state.formFields.filter((f) => f.id !== id),
        })),

      getFormFieldsByProduct: (productId) =>
        get().formFields
          .filter((f) => f.productId === productId)
          .sort((a, b) => a.order - b.order),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      getProductById: (id) => get().products.find((p) => p.id === id),
    }),
    {
      name: 'csc-admin-products',
      partialize: (state) => ({
        products: state.products,
        formFields: state.formFields,
      }),
    }
  )
);

// Helper to generate unique ID
export const generateProductId = (): string => {
  return 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

export const generateFormFieldId = (): string => {
  return 'field_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Expert Advice Product ID constant
export const EXPERT_ADVICE_PRODUCT_ID = 'expert_advice_primary';

// Get or create Expert Advice product
export const getExpertAdviceProduct = (): Product => ({
  id: EXPERT_ADVICE_PRODUCT_ID,
  name: 'Expert Primary Advice',
  nameHi: 'विशेषज्ञ प्राथमिक सलाह',
  price: 0,
  category: 'Premium Services',
  emoji: '👨‍💼',
  description: 'Get expert consultation on your service requirements. Our CSC experts will guide you through the process and help you choose the right service.',
  descriptionHi: 'अपनी सेवा आवश्यकताओं पर विशेषज्ञ परामर्श प्राप्त करें। हमारे CSC विशेषज्ञ आपको प्रक्रिया के माध्यम से मार्गदर्शन करेंगे।',
  documents: [],
  documentsHi: [],
  badge: 'Free Consultation',
  isActive: true,
});

// Google Sheets Export Functions
export const exportToGoogleSheetsFormat = (orders: any[], products: Product[]) => {
  // Create CSV content for orders
  const orderHeaders = ['Order Ref', 'Customer Name', 'Phone', 'Email', 'Status', 'Total', 'Date', 'Items'];
  const orderRows = orders.map(o => [
    o.order_ref,
    o.customer_name,
    o.customer_phone,
    o.customer_email || '',
    o.status,
    o.total_amount || 0,
    o.created_at,
    o.items?.map((i: any) => `${i.name} x${i.qty}`).join('; ') || ''
  ]);

  // Create CSV content for products
  const productHeaders = ['ID', 'Name', 'Name (Hindi)', 'Price', 'Original Price', 'Category', 'Description', 'Active'];
  const productRows = products.map(p => [
    p.id,
    p.name,
    p.nameHi,
    p.price,
    p.originalPrice || '',
    p.category,
    p.description,
    p.isActive !== false ? 'Yes' : 'No'
  ]);

  return {
    orders: { headers: orderHeaders, rows: orderRows },
    products: { headers: productHeaders, rows: productRows }
  };
};

export const downloadAsCSV = (data: { headers: string[], rows: string[][] }, filename: string) => {
  const csvContent = [
    data.headers.join(','),
    ...data.rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};