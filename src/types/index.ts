// ─── Product & Catalog ───────────────────────────────────────────────────────

export type Category =
  | 'Premium Services'
  | 'Govt Certificates'
  | 'Banking & Finance'
  | 'Education & Exams'
  | 'Insurance';

export interface Product {
  id: string;
  name: string;
  nameHi: string;
  price: number;
  originalPrice?: number;
  category: Category;
  emoji: string;
  description: string;
  descriptionHi: string;
  documents: string[];
  documentsHi: string[];
  badge?: string;          // e.g. "Popular", "Free", "New"
  turnaround?: string;     // e.g. "2-3 days"
  turnaroundHi?: string;
}

export interface CatalogResponse {
  products: Product[];
  categories: Category[];
}

export interface ProductDetailResponse {
  product: Product;
  related: Product[];
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export interface CartItem {
  product: Product;
  quantity: number;
}

// ─── Order ───────────────────────────────────────────────────────────────────

export type DeliveryType = 'digital' | 'pickup';

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export interface OrderPayload {
  items: Array<{
    product_id: string;
    quantity: number;
    price: number;
    name: string;
  }>;
  customer: CustomerInfo;
  delivery_type: DeliveryType;
  total: number;
}

export interface OrderResponse {
  success: boolean;
  order_ref: string;
  message: string;
}

export interface OTPVerifyPayload {
  order_ref: string;
  otp: string;
}

export interface OTPResendPayload {
  order_ref: string;
}

// ─── Order Tracking ──────────────────────────────────────────────────────────

export type OrderStatusCode =
  | 'verified'
  | 'under_review'
  | 'processing'
  | 'paid'
  | 'completed';

export interface TrackingStep {
  code: OrderStatusCode;
  label: string;
  labelHi: string;
  description: string;
  descriptionHi: string;
  icon: string;
}

export interface OrderTrackingResponse {
  order_ref: string;
  status: OrderStatusCode;
  customer_name: string;
  service_name: string;
  service_nameHi: string;
  total: number;
  delivery_type: DeliveryType;
  created_at: string;
  updated_at: string;
  payment_link?: string;
  completion_info?: string;
  completion_infoHi?: string;
}

// ─── i18n ────────────────────────────────────────────────────────────────────

export type Language = 'en' | 'hi';

export interface Translations {
  [key: string]: string;
}
