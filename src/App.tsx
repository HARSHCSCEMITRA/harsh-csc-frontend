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
const Software        = lazy(() => import('./pages/Software'));
const ZamifyWebPortal = lazy(() => import('./pages/ZamifyWebPortal'));

// ─── Admin Pages (alag lazy load) ────────────────────────────────────────────
const AdminLogin      = lazy(() => import('./admin/Login'));
const AdminDashboard  = lazy(() => import('./admin/Dashboard'));

// ─── Admin Route Guard ───────────────────────────────────────────────────────
// Agar token nahi hai toh login page pe bhej do
function AdminGuard({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('admin_token');
  if (!token) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

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

// ─── Admin Layout (Header/CartDrawer nahi chahiye admin mein) ────────────────
function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Admin Routes (Header aur Cart nahi) ───────────────────────── */}
        <Route
          path="/admin/login"
          element={
            <Suspense fallback={<PageLoader />}>
              <AdminLayout>
                <AdminLogin />
              </AdminLayout>
            </Suspense>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <Suspense fallback={<PageLoader />}>
              <AdminLayout>
                <AdminGuard>
                  <AdminDashboard />
                </AdminGuard>
              </AdminLayout>
            </Suspense>
          }
        />
        {/* /admin → seedha login pe bhejo */}
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

        {/* ── Public Routes (Header + Cart ke saath) ────────────────────── */}
        <Route
          path="*"
          element={
            <>
              <Header />
              <CartDrawer />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/"            element={<Home />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/checkout"    element={<Checkout />} />
                  <Route path="/verify-otp"  element={<OTPVerification />} />
                  <Route path="/track"       element={<OrderTracking />} />
                  <Route path="/track/:ref"  element={<OrderTracking />} />
                  <Route path="/software"    element={<Software />} />
                  <Route path="/portal"      element={<ZamifyWebPortal />} />
                  <Route path="/mobile"      element={<ZamifyWebPortal />} />

                  {/* Catch-all */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}
