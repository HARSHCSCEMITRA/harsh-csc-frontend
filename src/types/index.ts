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
  imageUrl?: string; // Cloud Storage URL
  description: string;
  descriptionHi: string;
  documents: string[];
  documentsHi: string[];
  badge?: string;
  turnaround?: string;
  turnaroundHi?: string;
  isActive?: boolean; // Enable/disable product
  formFields?: ProductFormField[]; // Custom form fields for this service
}

export interface CatalogResponse {
  products: Product[];
  categories: Category[];
}

export interface ProductDetailResponse {
  product: Product;
  related: Product[];
}

// ─── Product Form Builder ───────────────────────────────────────────────────

export type FormFieldType = 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'textarea' | 'email' | 'phone';

export interface ProductFormField {
  id: string;
  productId: string;
  fieldName: string; // Field key (e.g., "aadhaar_number")
  fieldNameHi: string; // Hindi label
  label: string; // Display label English
  labelHi: string; // Display label Hindi
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  placeholderHi?: string;
  options?: string[]; // For select type
  optionsHi?: string[]; // For select type Hindi
  helpText?: string;
  helpTextHi?: string;
  order: number; // Display order
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
  | 'pending'
  | 'verified'
  | 'flagged'
  | 'docs_reviewed'
  | 'accepted'
  | 'paid'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export interface TrackingStep {
  code: OrderStatusCode;
  label: string;
  labelHi: string;
  description: string;
  descriptionHi: string;
  icon: string;
}

// ✅ Backend ke exact response fields se match karta hai
export interface OrderTrackingResponse {
  order_ref:          string;
  status:             OrderStatusCode;
  status_message:     string;
  customer_name:      string;
  delivery_type:      string;           // 'digital_whatsapp' | 'shop_visit'
  created_at:         string;
  updated_at:         string;
  total_amount:       number;           // ✅ backend 'total_amount' bhejta hai
  items:              Array<{           // ✅ backend 'items' array bhejta hai
    name: string;
    qty:  number;
    subtotal: number;
  }>;
  payment_link_url?:  string | null;    // ✅ backend field naam
  payment_expires_at?: string | null;
  support_whatsapp?:  string;           // ✅ backend se aata hai
  completion_info?:   string;
  completion_infoHi?: string;
}

// ─── i18n ────────────────────────────────────────────────────────────────────

export type Language = 'en' | 'hi';

export interface Translations {
  [key: string]: string;
}
