import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, Product } from '../types';
import { EXPERT_ADVICE_PRODUCT_ID, getExpertAdviceProduct } from './productStore';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  expertAdviceAdded: boolean; // Track if expert advice was auto-added

  // Actions
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  
  // Expert Advice auto-add
  addExpertAdvice: () => void;
  removeExpertAdvice: () => void;
  hasExpertAdvice: () => boolean;

  // Computed
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      expertAdviceAdded: false,

      addItem: (product) => {
        set(state => {
          const existing = state.items.find(i => i.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map(i =>
                i.product.id === product.id
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          return { items: [...state.items, { product, quantity: 1 }] };
        });
      },

      removeItem: (productId) => {
        set(state => ({
          items: state.items.filter(i => i.product.id !== productId),
        }));
      },

      updateQuantity: (productId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId);
          return;
        }
        set(state => ({
          items: state.items.map(i =>
            i.product.id === productId ? { ...i, quantity: qty } : i
          ),
        }));
      },

      clearCart: () => set({ items: [], expertAdviceAdded: false }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set(state => ({ isOpen: !state.isOpen })),

      // Expert Advice functions
      addExpertAdvice: () => {
        const expertProduct = getExpertAdviceProduct();
        set(state => {
          const alreadyHas = state.items.some(i => i.product.id === EXPERT_ADVICE_PRODUCT_ID);
          if (alreadyHas) return state;
          return {
            items: [...state.items, { product: expertProduct, quantity: 1 }],
            expertAdviceAdded: true
          };
        });
      },

      removeExpertAdvice: () => {
        set(state => ({
          items: state.items.filter(i => i.product.id !== EXPERT_ADVICE_PRODUCT_ID),
          expertAdviceAdded: false
        }));
      },

      hasExpertAdvice: () => {
        return get().items.some(i => i.product.id === EXPERT_ADVICE_PRODUCT_ID);
      },

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () => get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    }),
    {
      name: 'csc-emitra-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, expertAdviceAdded: state.expertAdviceAdded }),
    }
  )
);
