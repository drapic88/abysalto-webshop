'use client';

import { useState, useEffect } from 'react';
import { getOrCreateCartId, API_BASE_URL, CATALOG_API_BASE_URL } from './utils/cartHelper';

export default function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetch(`${CATALOG_API_BASE_URL}/products`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch product catalog');
        return res.json();
      })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleAddToCart = async (productId, productName) => {
    setAddingId(productId);
    const cartId = getOrCreateCartId();

    try {
      const response = await fetch(`${API_BASE_URL}/carts/${cartId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: productId,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(errorDetail.detail || 'Failed to add item to cart');
      }

      setNotification(`Added ${productName} to your cart! ✦`);
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setAddingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <span className="logo-spark" style={{ display: 'inline-block', animation: 'spin 2s linear infinite', fontSize: '3rem' }}>✦</span>
        <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>Loading catalog items from server...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', maxWidth: '600px', margin: '2rem auto' }}>
        <h2 style={{ color: 'var(--accent-rose)', marginBottom: '1rem' }}>Backend Connection Required</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Unable to retrieve product feed from the Spring Boot API. Make sure your docker containers are built and running.
        </p>
        <button className="btn-premium" onClick={() => window.location.reload()}>Retry Handshake</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.75rem', letterSpacing: '-0.5px' }}>
          The Autumn Collection
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Engineered hardware, audio, and desk accessories built to satisfy absolute standards. Seseeded with 10 high-end products.
        </p>
      </div>

      {notification && (
        <div className="glass-card" style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          padding: '1rem 2rem',
          borderLeft: '4px solid var(--accent-solid)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          zIndex: 9999,
          animation: 'slideIn 0.3s ease-out'
        }}>
          <p style={{ fontWeight: '600', color: 'white' }}>{notification}</p>
        </div>
      )}

      <div className="products-grid">
        {products.map((product) => (
          <div key={product.productId} className="glass-card product-card">
            <div className="product-image-container">
              <img src={product.imageUrl} alt={product.name} className="product-img" />
            </div>
            <div className="product-category">{product.category}</div>
            <h3 className="product-title">{product.name}</h3>
            <p className="product-description">{product.description}</p>
            <div className="product-footer">
              <span className="product-price">${product.priceNumeric.toFixed(2)}</span>
              <button 
                className="btn-premium" 
                onClick={() => handleAddToCart(product.productId, product.name)}
                disabled={addingId === product.productId}
              >
                {addingId === product.productId ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
