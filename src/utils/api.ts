// ─────────────────────────────────────────────────────────────
//  api.ts  –  All network calls for Harsh CSC e-Mitra
//  KEY FIX: BASE_URL now falls back to the real Cloudflare Worker
//           so the app works even without a .env file.
// ─────────────────────────────────────────────────────────────
import type {
  CatalogResponse,
  ProductDetailResponse,
  OrderResponse,
  OrderTrackingResponse,
} from '../types';
import { MOCK_PRODUCTS, MOCK_ORDER_TRACKING } from './mockData';

// ── FIX 1: Hardcoded fallback to your real backend URL ──────
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://emitra-worker.harshcscemitra.workers.dev';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// ── Core fetch wrapper ────────────────────────────────────────
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
    mode: 'cors',                                   // FIX 2: explicit CORS mode
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const errText = await res.text();
    try {
      const json = JSON.parse(errText);
      throw new Error(json.error || json.message || errText);
    } catch {
      throw new Error(errText || `HTTP ${res.status} – Request failed`);
    }
  }

  return res.json() as Promise<T>;
}

// ── Catalog ───────────────────────────────────────────────────
// FIX 3: Response is { products: [...] } – handled correctly here
export async function fetchCatalog(): Promise<CatalogResponse> {
  if (USE_MOCK) return { products: MOCK_PRODUCTS, categories: [] };
  return apiFetch<CatalogResponse>('/api/catalog');
}

// ── Product Detail ────────────────────────────────────────────
export async function fetchProduct(id: string): Promise<ProductDetailResponse> {
  if (USE_MOCK) return { product: MOCK_PRODUCTS[0] as any, related: [] };
  return apiFetch<ProductDetailResponse>(`/api/catalog/${id}`);
}

// ── Place Order ───────────────────────────────────────────────
export async function placeOrder(payload: any): Promise<OrderResponse> {
  if (USE_MOCK)
    return { success: true, order_ref: 'CSC-123456', message: 'Mock OTP sent' };

  const payloadStr = JSON.stringify(payload);

  const phoneMatch  = payloadStr.match(/(?:\+91|91)?([6-9]\d{9})/);
  const cleanPhone  = phoneMatch ? phoneMatch[1] : '';

  const emailMatch  = payloadStr.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const cleanEmail  = emailMatch ? emailMatch[0] : '';

  const cleanName =
    payload.customer?.name   ||
    payload.customer_name    ||
    payload.customerName     ||
    payload.fullName         ||
    payload.name             ||
    '';

  const rawDelivery  = payload.delivery_type || payload.deliveryType || 'digital';
  const cleanDelivery = rawDelivery === 'digital' ? 'digital_whatsapp' : 'shop_visit';

  const rawItems   = payload.items || [];
  const cleanItems = rawItems.map((item: any) => ({
    product_id: item.product_id || item.id,
    quantity:   item.quantity   || 1,
  }));

  const backendPayload = {
    customer_name:  cleanName,
    customer_email: cleanEmail,
    customer_phone: cleanPhone,
    delivery_type:  cleanDelivery,
    items:          cleanItems,
    customer_notes: payload.customer?.notes || payload.notes || '',
  };

  return apiFetch<OrderResponse>('/api/orders', {
    method: 'POST',
    body:   JSON.stringify(backendPayload),
  });
}

// ── OTP ───────────────────────────────────────────────────────
export async function verifyOTP(payload: any): Promise<{ success: boolean; message: string }> {
  if (USE_MOCK) return { success: true, message: 'OTP verified successfully.' };
  return apiFetch('/api/orders/verify-otp', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });
}

export async function resendOTP(payload: any): Promise<{ success: boolean }> {
  if (USE_MOCK) return { success: true };
  return apiFetch('/api/orders/resend-otp', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });
}

// ── Order Tracking ────────────────────────────────────────────
export async function trackOrder(order_ref: string): Promise<OrderTrackingResponse> {
  if (USE_MOCK) return { ...MOCK_ORDER_TRACKING, order_ref };
  return apiFetch<OrderTrackingResponse>(`/api/orders/${encodeURIComponent(order_ref)}`);
}
