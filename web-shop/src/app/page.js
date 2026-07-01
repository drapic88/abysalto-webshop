'use client';

import { useState, useEffect } from 'react';
import { getOrCreateCartId, API_BASE_URL, CATALOG_API_BASE_URL } from './utils/cartHelper';

export default function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [notification, setNotification] = useState(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 6;

  useEffect(() => {
    setLoading(true);
    fetch(`${CATALOG_API_BASE_URL}/products?page=${currentPage}&size=${pageSize}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch product catalog');
        return res.json();
      })
      .then((data) => {
        if (data && Array.isArray(data)) {
          setProducts(data);
          setTotalPages(1);
          setTotalElements(data.length);
        } else if (data && data.content) {
          setProducts(data.content);
          setTotalPages(data.totalPages);
          setTotalElements(data.totalElements);
        } else {
          setProducts([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [currentPage]);

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
      
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '3.5rem',
          marginBottom: '2rem'
        }}>
          <button
            className="btn-premium"
            style={{
              padding: '0.6rem 1.2rem',
              fontSize: '0.9rem',
              minWidth: '100px',
              opacity: currentPage === 0 ? 0.5 : 1,
              pointerEvents: currentPage === 0 ? 'none' : 'auto'
            }}
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
          >
            ← Previous
          </button>
          
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center'
          }}>
            {(() => {
              const maxVisible = 3;
              let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
              let end = Math.min(totalPages - 1, start + maxVisible - 1);
              if (end - start + 1 < maxVisible) {
                start = Math.max(0, end - maxVisible + 1);
              }
              const pageIndices = [];
              for (let i = start; i <= end; i++) {
                pageIndices.push(i);
              }
              return pageIndices.map((index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index)}
                  style={{
                    background: currentPage === index ? 'var(--accent-solid)' : 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    border: currentPage === index ? '1px solid var(--accent-solid)' : '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '0.5rem 0.9rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease',
                    boxShadow: currentPage === index ? '0 0 12px var(--accent-solid)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== index) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== index) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                >
                  {index + 1}
                </button>
              ));
            })()}
          </div>

          <button
            className="btn-premium"
            style={{
              padding: '0.6rem 1.2rem',
              fontSize: '0.9rem',
              minWidth: '100px',
              opacity: currentPage === totalPages - 1 ? 0.5 : 1,
              pointerEvents: currentPage === totalPages - 1 ? 'none' : 'auto'
            }}
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage === totalPages - 1}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
