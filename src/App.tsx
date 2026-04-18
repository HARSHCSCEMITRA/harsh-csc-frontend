import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { CartDrawer } from './components/CartDrawer';

// ─── Lazy-loaded Pages ───────────────────────────────────────────────────────
const Home            = lazy(() => import('./pages/Home'));
const ProductDetail   = lazy(() => import('./pages/ProductDetail'));
const Checkout        = lazy(() => import('./pages/Checkout'));
const OTPVerification = lazy(() => import('./pages/OTPVerification'));
const OrderTracking   = lazy(() => import('./pages/OrderTracking'));

// ─── Loading Fallback ────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '80vh', flexDirection: 'column', gap: '16px',
    }}>
      <div style={{
        width: '48px', height: '48px',
        border: '3px solid var(--border)',
        borderTopColor: 'var(--blue)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading…</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <CartDrawer />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"                 element={<Home />} />
          <Route path="/product/:id"      element={<ProductDetail />} />
          <Route path="/checkout"         element={<Checkout />} />
          <Route path="/verify-otp"       element={<OTPVerification />} />
          <Route path="/track"            element={<OrderTracking />} />
          <Route path="/track/:ref"       element={<OrderTracking />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
