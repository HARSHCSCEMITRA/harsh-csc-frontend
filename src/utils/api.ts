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

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const err = await res.text();
    try {
      const json = JSON.parse(err);
      throw new Error(json.error || err);
    } catch {
      throw new Error(err || `Request failed: ${res.status}`);
    }
  }
  return res.json() as Promise<T>;
}

export async function fetchCatalog(): Promise<CatalogResponse> {
  if (USE_MOCK) return { products: MOCK_PRODUCTS, categories: [] };
  return apiFetch<CatalogResponse>('/api/catalog');
}

export async function fetchProduct(id: string): Promise<ProductDetailResponse> {
  if (USE_MOCK) return { product: MOCK_PRODUCTS[0] as any, related: [] };
  return apiFetch<ProductDetailResponse>(`/api/catalog/${id}`);
}

export async function placeOrder(payload: any): Promise<OrderResponse> {
  if (USE_MOCK) return { success: true, order_ref: 'CSC-123456', message: 'Mock OTP sent' };

  const payloadStr = JSON.stringify(payload);

  // +91 ya 91 prefix hatakar sirf 10 digit wala number nikalna
  const phoneMatch = payloadStr.match(/(?:\+91|91)?([6-9]\d{9})/);
  const cleanPhone = phoneMatch ? phoneMatch[1] : '9999999999';

  // Email dhundhna
  const emailMatch = payloadStr.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const cleanEmail = emailMatch ? emailMatch[0] : 'no-email@test.com';

  // Naam dhundhna
  const cleanName =
    payload.customer_name ||
    payload.customerName ||
    payload.fullName ||
    payload.name ||
    'Customer';

  const bulletproofPayload = {
    ...payload,
    customer_phone: cleanPhone,
    customerPhone: cleanPhone,
    phone: cleanPhone,
    mobile: cleanPhone,

    customer_email: cleanEmail,
    customerEmail: cleanEmail,
    email: cleanEmail,

    customer_name: cleanName,
    customerName: cleanName,
    fullName: cleanName,
    name: cleanName,
  };

  if (bulletproofPayload.customer) {
    bulletproofPayload.customer.phone = cleanPhone;
    bulletproofPayload.customer.mobile = cleanPhone;
    bulletproofPayload.customer.email = cleanEmail;
  }

  return apiFetch<OrderResponse>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(bulletproofPayload),
  });
}

export async function verifyOTP(payload: any): Promise<{ success: boolean; message: string }> {
  if (USE_MOCK) return { success: true, message: 'OTP verified successfully.' };
  return apiFetch('/api/orders/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function resendOTP(payload: any): Promise<{ success: boolean }> {
  if (USE_MOCK) return { success: true };
  return apiFetch('/api/orders/resend-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function trackOrder(order_ref: string): Promise<OrderTrackingResponse> {
  if (USE_MOCK) return { ...MOCK_ORDER_TRACKING, order_ref };
  return apiFetch<OrderTrackingResponse>(`/api/orders/${encodeURIComponent(order_ref)}`);
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
