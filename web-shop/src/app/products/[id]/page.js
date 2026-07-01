'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getOrCreateCartId, API_BASE_URL, CATALOG_API_BASE_URL } from '../../utils/cartHelper';

export default function ProductDetailPage({ params }) {
  const productId = params.id;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);

    fetch(`${CATALOG_API_BASE_URL}/products/${productId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [productId]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    const cartId = getOrCreateCartId();

    try {
      const response = await fetch(`${API_BASE_URL}/carts/${cartId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.productId || product.id,
          quantity: quantity,
        }),
      });

      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(errorDetail.detail || 'Failed to add item to cart');
      }

      setNotification(`Added ${quantity}x ${product.name} to your cart! ✦`);
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '8rem 0' }}>
        <span className="logo-spark" style={{ display: 'inline-block', animation: 'spin 2s linear infinite', fontSize: '3rem' }}>✦</span>
        <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>Retrieving product specification...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', maxWidth: '600px', margin: '4rem auto' }}>
        <h2 style={{ color: 'var(--accent-rose)', marginBottom: '1rem' }}>Product Unavailable</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          {error || 'The requested premium product could not be located in our catalog.'}
        </p>
        <Link href="/" className="btn-premium" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Return to Catalog
        </Link>
      </div>
    );
  }

  const priceNumeric = product.priceNumeric !== undefined ? product.priceNumeric : product.price;
  const isOutOfStock = product.stockQuantity <= 0;

  // Generate some luxurious mock specifications based on product category
  const getSpecs = (category, name) => {
    switch (category) {
      case 'Audio':
        return [
          { label: 'Frequency Response', value: '10Hz - 40kHz' },
          { label: 'Driver Unit', value: '40mm Custom Dynamic' },
          { label: 'Connectivity', value: 'Ultra-low latency RF / Bluetooth 5.2' },
          { label: 'Battery Life', value: 'Up to 45 Hours (Continuous)' }
        ];
      case 'Hardware':
        return [
          { label: 'Form Factor', value: 'Tenkeyless (80%) CNC Anodized' },
          { label: 'Mounting Style', value: 'Gasket Mounted with Poron Foam' },
          { label: 'Hot-swap Support', value: '5-pin Cherry MX Compatible' },
          { label: 'Stabilizers', value: 'Screw-in, Factory Lubed' }
        ];
      case 'Wearables':
        return [
          { label: 'Display', value: '1.43" Retina LTPO AMOLED, Always-On' },
          { label: 'Chassis Material', value: 'Aerospace-Grade Titanium' },
          { label: 'Water Resistance', value: '10 ATM (up to 100m)' },
          { label: 'Sensor Suite', value: 'Biometric Heart-Rate, SpO2, Accelerometer' }
        ];
      default:
        return [
          { label: 'Material Composition', value: 'Premium Alloy & Polycarbonate' },
          { label: 'Finish', value: 'Matte Powder-Coated / Anti-Fingerprint' },
          { label: 'Warranty Coverage', value: '2-Year Abysalto Elite Protection' },
          { label: 'Origin', value: 'Designed & Engineered in Stockholm' }
        ];
    }
  };

  const specs = getSpecs(product.category, product.name);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem 1.5rem 4rem 1.5rem' }}>
      
      {/* Back to Catalog Nav */}
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          fontSize: '0.95rem',
          fontWeight: '600',
          transition: 'all 0.25s ease',
          padding: '0.5rem 1rem',
          borderRadius: '50px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'white';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.transform = 'translateX(-3px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-secondary)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
          e.currentTarget.style.transform = 'translateX(0)';
        }}
        >
          ← ✦ Back to Catalog
        </Link>
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

      {/* Main product presentation layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '3rem',
        alignItems: 'start'
      }}>
        
        {/* Left Side: Premium Image Container */}
        <div style={{
          position: 'sticky',
          top: '100px'
        }}>
          <div className="glass-card" style={{
            padding: '1.5rem',
            borderRadius: '24px',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
            e.currentTarget.style.boxShadow = '0 30px 60px rgba(99, 102, 241, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.4)';
          }}
          >
            <div style={{
              width: '100%',
              height: '420px',
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#0c0d14'
            }}>
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Side: Product Details & Purchase controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          {/* Category and Stock Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{
              background: 'rgba(99, 102, 241, 0.1)',
              color: 'var(--accent-solid)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              padding: '0.4rem 1rem',
              borderRadius: '50px',
              fontSize: '0.85rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              {product.category}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="live-pulse" style={{
                backgroundColor: isOutOfStock ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                boxShadow: isOutOfStock ? '0 0 10px var(--accent-rose)' : '0 0 10px var(--accent-emerald)'
              }}></span>
              <span style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: isOutOfStock ? 'var(--accent-rose)' : 'var(--accent-emerald)'
              }}>
                {isOutOfStock ? 'Sold Out' : `${product.stockQuantity} In Stock`}
              </span>
            </div>
          </div>

          {/* Product Title */}
          <div>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              lineHeight: '1.15',
              letterSpacing: '-0.5px',
              background: 'linear-gradient(to right, #ffffff, #cbd5e1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.5rem'
            }}>
              {product.name}
            </h2>
            <div className="product-price" style={{ fontSize: '2rem', fontWeight: '700', color: 'white' }}>
              ${priceNumeric.toFixed(2)}
            </div>
          </div>

          <hr style={{ border: 'none', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }} />

          {/* Product Description */}
          <div>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              Overview
            </h4>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '1.05rem',
              lineHeight: '1.6',
              fontWeight: '400'
            }}>
              {product.description}
            </p>
          </div>

          {/* Technical Specifications Container */}
          <div className="glass-card" style={{
            padding: '1.25rem 1.5rem',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
          }}>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.8rem', letterSpacing: '0.5px' }}>
              ✦ TECHNICAL SPECIFICATIONS
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {specs.map((spec, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>{spec.label}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{spec.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Add to Cart Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            marginTop: '0.5rem'
          }}>
            
            {/* Quantity Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Quantity
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '50px',
                padding: '0.25rem'
              }}>
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'none',
                    color: 'white',
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: (quantity <= 1 || isOutOfStock) ? 0.3 : 1
                  }}
                  onMouseEnter={(e) => { if (quantity > 1 && !isOutOfStock) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  −
                </button>
                <span style={{
                  width: '40px',
                  textAlign: 'center',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  color: isOutOfStock ? 'var(--text-muted)' : 'white'
                }}>
                  {isOutOfStock ? 0 : quantity}
                </span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stockQuantity, q + 1))}
                  disabled={quantity >= product.stockQuantity || isOutOfStock}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'none',
                    color: 'white',
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: (quantity >= product.stockQuantity || isOutOfStock) ? 0.3 : 1
                  }}
                  onMouseEnter={(e) => { if (quantity < product.stockQuantity && !isOutOfStock) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  +
                </button>
              </div>
            </div>

            {/* Action CTA Button */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span style={{ opacity: 0, fontSize: '0.8rem' }}>Spacing</span>
              <button
                className="btn-premium"
                disabled={isOutOfStock || adding}
                onClick={handleAddToCart}
                style={{
                  width: '100%',
                  padding: '1.1rem',
                  borderRadius: '50px',
                  fontWeight: '700',
                  fontSize: '1.05rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  opacity: isOutOfStock ? 0.5 : 1,
                  boxShadow: isOutOfStock ? 'none' : '0 10px 25px rgba(99, 102, 241, 0.35)',
                }}
              >
                {isOutOfStock ? (
                  'Out of Stock'
                ) : adding ? (
                  'Adding to Cart...'
                ) : (
                  <>
                    <span>Add to Cart</span>
                    <span style={{ fontSize: '0.85rem', opacity: 0.85 }}>• ${(priceNumeric * quantity).toFixed(2)}</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
