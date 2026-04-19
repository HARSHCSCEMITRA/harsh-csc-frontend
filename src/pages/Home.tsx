import React, { useState, useEffect } from 'react';
import { fetchCatalog } from '../utils/api';
import { ProductCard } from '../components/ProductCard';
import { CartDrawer } from '../components/CartDrawer'; // कार्ट वापस जोड़ा

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCatalog()
      .then(data => {
        setProducts(data?.products || []);
        setError('');
      })
      .catch(() => setError('Server Connect Nahi Ho Paya'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="home-page fade-in">
      <CartDrawer /> {/* ऊपर वाला कार्ट का डब्बा */}

      <section style={{ padding: '40px 0', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ color: '#60a5fa', marginBottom: '30px' }}>Our Services</h2>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Services Load Ho Rahi Hain...</p>
            </div>
          ) : error ? (
            <div className="error-card">
              <p>⚠️ {error}</p>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          ) : (
            <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
