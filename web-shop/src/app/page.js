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

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ["All", "Accessories", "Audio", "Hardware", "Wearables", "Smart Home", "Office", "Networking"];

  useEffect(() => {
    setLoading(true);
    // Use the search endpoint if there is a query or category filter, or fallback gracefully
    const fetchUrl = searchQuery || selectedCategory !== 'All'
      ? `${CATALOG_API_BASE_URL}/products/search?query=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(selectedCategory)}&page=${currentPage}&size=${pageSize}`
      : `${CATALOG_API_BASE_URL}/products?page=${currentPage}&size=${pageSize}`;

    fetch(fetchUrl)
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
  }, [currentPage, searchQuery, selectedCategory]);

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

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setCurrentPage(0); // Reset to first page
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(0); // Reset to first page
  };

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
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.75rem', letterSpacing: '-0.5px' }}>
          The Autumn Collection
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Engineered hardware, audio, and desk accessories built to satisfy absolute standards. Seeding completed with 1000 premium products.
        </p>
      </div>

      {/* Modern Search & Filter UI */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto 3rem auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        alignItems: 'center'
      }}>
        {/* Search input field */}
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search products, brands, tech specifications..."
            style={{
              width: '100%',
              padding: '1.1rem 1.5rem 1.1rem 3rem',
              borderRadius: '50px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              fontSize: '1.05rem',
              fontWeight: '500',
              outline: 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.border = '1px solid var(--accent-solid)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(124, 58, 237, 0.3)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
            }}
          />
          <span style={{
            position: 'absolute',
            left: '1.2rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-secondary)',
            fontSize: '1.2rem',
            pointerEvents: 'none'
          }}>
            🔍
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '1.2rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '1.1rem',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div style={{
          display: 'flex',
          gap: '0.6rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          width: '100%'
        }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              style={{
                background: selectedCategory === cat ? 'var(--accent-solid)' : 'rgba(255, 255, 255, 0.04)',
                color: selectedCategory === cat ? 'white' : 'var(--text-secondary)',
                border: selectedCategory === cat ? '1px solid var(--accent-solid)' : '1px solid rgba(255, 255, 255, 0.08)',
                padding: '0.5rem 1.1rem',
                borderRadius: '30px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: selectedCategory === cat ? '0 0 15px rgba(124, 58, 237, 0.4)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== cat) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== cat) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }
              }}
            >
              {cat}
            </button>
          ))}
        </div>
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <span className="logo-spark" style={{ display: 'inline-block', animation: 'spin 2s linear infinite', fontSize: '3rem' }}>✦</span>
          <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>Retrieving premium listings...</p>
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <p style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>No premium products match your criteria.</p>
          <button className="btn-premium" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}>Clear Filters</button>
        </div>
      ) : (
        <>
          <div className="products-grid">
            {products.map((product) => {
              const productId = product.productId || product.id;
              const priceNumeric = product.priceNumeric !== undefined ? product.priceNumeric : product.price;
              return (
                <div key={productId} className="glass-card product-card">
                  <div className="product-image-container">
                    <img src={product.imageUrl} alt={product.name} className="product-img" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className="product-category" style={{ marginBottom: 0 }}>{product.category}</span>
                    <span style={{ fontSize: '0.8rem', color: product.stockQuantity > 0 ? 'rgba(255, 255, 255, 0.4)' : 'var(--accent-rose)', fontWeight: '500' }}>
                      {product.stockQuantity > 0 ? `${product.stockQuantity} available` : 'Out of stock'}
                    </span>
                  </div>
                  <h3 className="product-title">{product.name}</h3>
                  <p className="product-description">{product.description}</p>
                  <div className="product-footer">
                    <span className="product-price">${priceNumeric.toFixed(2)}</span>
                    <button 
                      className="btn-premium" 
                      onClick={() => handleAddToCart(productId, product.name)}
                      disabled={addingId === productId}
                    >
                      {addingId === productId ? 'Adding...' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              );
            })}
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
        </>
      )}
    </div>
  );
}
