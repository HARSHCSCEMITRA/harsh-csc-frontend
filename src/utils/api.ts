import type {
  CatalogResponse,
  ProductDetailResponse,
  OrderPayload,
  OrderResponse,
  OTPVerifyPayload,
  OTPResendPayload,
  OrderTrackingResponse,
} from '../types';
import { MOCK_PRODUCTS, MOCK_ORDER_TRACKING } from './mockData';

const BASE_URL = import.meta.env.VITE_API_URL || '';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// ─── Generic fetch wrapper ────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

export async function fetchCatalog(): Promise<CatalogResponse> {
  if (USE_MOCK) {
    await delay(400);
    const categories = [...new Set(MOCK_PRODUCTS.map(p => p.category))];
    return { products: MOCK_PRODUCTS, categories };
  }
  return apiFetch<CatalogResponse>('/api/catalog');
}

export async function fetchProduct(id: string): Promise<ProductDetailResponse> {
  if (USE_MOCK) {
    await delay(300);
    const product = MOCK_PRODUCTS.find(p => p.id === id);
    if (!product) throw new Error('Product not found');
    const related = MOCK_PRODUCTS.filter(
      p => p.category === product.category && p.id !== id
    ).slice(0, 4);
    return { product, related };
  }
  return apiFetch<ProductDetailResponse>(`/api/catalog/${id}`);
}

// ─── Order ───────────────────────────────────────────────────────────────────

export async function placeOrder(payload: any): Promise<OrderResponse> {
  if (USE_MOCK) {
    await delay(800);
    const ref = `CSC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900000) + 100000)}`;
    return { success: true, order_ref: ref, message: 'OTP sent to your mobile.' };
  }
  
  // 🔥 ब्रह्मास्त्र: Frontend के डेटा को Backend के फॉर्मेट में ज़बरदस्ती बदलना 🔥
  const fixedPayload = {
    ...payload,
    customer_name: payload.customer_name || payload.customerName || payload.fullName || payload.name || payload.full_name || 'Customer',
    customer_email: payload.customer_email || payload.customerEmail || payload.email || payload.emailAddress || 'no-email@test.com',
    customer_phone: payload.customer_phone || payload.customerPhone || payload.phone || payload.mobile || payload.mobileNumber || '0000000000',
  };

  return apiFetch<OrderResponse>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(fixedPayload),
  });
}

export async function verifyOTP(payload: OTPVerifyPayload): Promise<{ success: boolean; message: string }> {
  if (USE_MOCK) {
    await delay(600);
    if (payload.otp === '000000') {
      throw new Error('Invalid OTP. Please try again.');
    }
    return { success: true, message: 'OTP verified successfully.' };
  }
  return apiFetch('/api/orders/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function resendOTP(payload: OTPResendPayload): Promise<{ success: boolean }> {
  if (USE_MOCK) {
    await delay(400);
    return { success: true };
  }
  return apiFetch('/api/orders/resend-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Tracking ────────────────────────────────────────────────────────────────

export async function trackOrder(order_ref: string): Promise<OrderTrackingResponse> {
  if (USE_MOCK) {
    await delay(500);
    if (!order_ref.startsWith('CSC-')) throw new Error('Order not found');
    return { ...MOCK_ORDER_TRACKING, order_ref };
  }
  return apiFetch<OrderTrackingResponse>(`/api/orders/${encodeURIComponent(order_ref)}`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
